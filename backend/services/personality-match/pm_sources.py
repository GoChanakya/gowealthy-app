"""Latest-snapshot data sources and the screening step for the personality-match job.

Flow: fund_cards.parquet (every scheme) -> screen (category universe, NSE purchase
allowed, top half of category by latest rank) -> build scoring inputs for the
shortlist only, enriched from the other ``backend_main_kartik/*/latest`` tables.
"""

from __future__ import annotations

import io
import logging
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, Mapping

import numpy as np
import pandas as pd


LOGGER = logging.getLogger("personality_match")
RANK_HISTORY = ("rank_now",) + tuple(f"rank_{months}m_ago" for months in range(1, 7))


def read_uri_bytes(uri: str) -> bytes:
    if uri.startswith("gs://"):
        from google.cloud import storage

        bucket_name, blob_name = uri[5:].split("/", 1)
        return storage.Client().bucket(bucket_name).blob(blob_name).download_as_bytes()
    return Path(uri).read_bytes()


def read_table(uri: str) -> pd.DataFrame:
    content = io.BytesIO(read_uri_bytes(uri))
    if uri.lower().endswith(".csv"):
        frame = pd.read_csv(content, dtype=str, keep_default_na=False)
        frame.columns = frame.columns.str.strip()
        return frame
    return pd.read_parquet(content)


def resolve_uris(cfg: Mapping[str, Any], overrides: Mapping[str, str] | None = None) -> dict[str, str]:
    """Source URIs: config default < env ``PM_SRC_<NAME>`` < explicit override."""
    overrides = overrides or {}
    return {
        name: overrides.get(name, os.getenv(f"PM_SRC_{name.upper()}", spec["uri"]))
        for name, spec in cfg["sources"].items()
    }


def load_sources(cfg: Mapping[str, Any], overrides: Mapping[str, str] | None = None) -> dict[str, pd.DataFrame]:
    """Read every configured source in parallel; optional sources that fail are skipped."""
    uris = {name: uri for name, uri in resolve_uris(cfg, overrides).items() if uri}

    def load(item: tuple[str, str]) -> tuple[str, pd.DataFrame | None]:
        name, uri = item
        try:
            return name, read_table(uri)
        except Exception as error:  # noqa: BLE001 - optional sources degrade with a warning
            if cfg["sources"][name].get("required"):
                raise
            LOGGER.warning("source %s unavailable at %s (%s); continuing without it", name, uri, error)
            return name, None

    with ThreadPoolExecutor(max_workers=max(1, len(uris))) as pool:
        loaded = dict(pool.map(load, uris.items()))
    for name, frame in loaded.items():
        if frame is not None:
            LOGGER.info("source %s: %d rows", name, len(frame))
    return {name: frame for name, frame in loaded.items() if frame is not None}


def _key(series: pd.Series) -> pd.Series:
    return series.astype("string").str.strip()


def _overlay(cards: pd.DataFrame, table: pd.DataFrame | None, spec: Mapping[str, Any], name: str) -> pd.DataFrame:
    """Copy mapped columns from a satellite table onto cards; the satellite value wins when present."""
    if table is None or not spec.get("columns"):
        return cards
    lookup = {column.lower(): column for column in table.columns}
    key = lookup.get(str(spec.get("key", "scheme_code")).lower())
    mapping = {
        target: next((lookup[c.lower()] for c in candidates if c.lower() in lookup), None)
        for target, candidates in spec["columns"].items()
    }
    found = {target: column for target, column in mapping.items() if column}
    if key is None or not found:
        LOGGER.warning("source %s: no usable columns among %s; skipped", name, list(table.columns))
        return cards
    side = table[[key, *found.values()]].copy()
    side[key] = _key(side[key])
    side = side.drop_duplicates(key, keep="last").set_index(key)
    side.columns = list(found)
    joined = side.reindex(cards["scheme_code"]).set_axis(cards.index)
    result = cards.copy()
    for target in found:
        result[target] = joined[target].combine_first(result[target]) if target in result else joined[target]
    return result


def _num(frame: pd.DataFrame, column: str) -> pd.Series:
    return pd.to_numeric(frame[column], errors="coerce") if column in frame else pd.Series(np.nan, index=frame.index)


def _slug(values: pd.Series) -> pd.Series:
    return values.astype("string").str.upper().str.replace(r"[^A-Z0-9]+", "_", regex=True).str.strip("_")


def screen(cards: pd.DataFrame, cfg: Mapping[str, Any]) -> pd.DataFrame:
    """Apply the hard filters to every fund card and record the first failing reason."""
    result = cards.copy()
    result["scheme_code"] = _key(result["scheme_code"])
    category = result["goc_short_code"].astype("string").fillna("")
    rank = pd.to_numeric(result["rank_now"], errors="coerce")
    total = pd.to_numeric(result["rank_total_now"], errors="coerce")
    has_rank = rank.notna() & total.gt(0)
    rules = cfg["momentum_filter"]
    category_ranked = has_rank.groupby(category).transform("any")
    unranked_ok = ~category_ranked if rules["skip_categories_without_ranks"] else False
    momentum = (rank.le(total * float(rules["top_fraction"])) & has_rank).where(has_rank, unranked_ok).astype(bool)
    in_universe = category.isin(cfg["categories"])
    purchase = result["nse_purchase_allowed"].astype("string").str.upper().eq("Y").fillna(False)

    result["momentum_pass"] = momentum
    result["screen_reason"] = np.select(
        [~in_universe, ~purchase, ~momentum & has_rank, ~momentum],
        ["OUT_OF_UNIVERSE", "PURCHASE_NOT_ALLOWED", "BOTTOM_HALF_RANK", "NO_RANK"],
        default="",
    )
    result["shortlisted"] = result["screen_reason"].eq("")
    unranked = sorted(set(category[in_universe & ~category_ranked]))
    if unranked:
        LOGGER.warning("momentum filter skipped (no rank data) for: %s", ", ".join(unranked))
    LOGGER.info("screening: %s", result["screen_reason"].replace("", "SHORTLISTED").value_counts().to_dict())
    return result


EVENT_COLUMNS = ["scheme_code", "event_code", "status", "fall_pct", "recovery_months", "recovered_pct"]


def _batting_36m(table: pd.DataFrame | None, months: int) -> pd.DataFrame:
    if table is None or table.empty:
        return pd.DataFrame(columns=["batting_36_window", "batting_36_beats"])
    rows = table.loc[pd.to_numeric(table.get("peers", 1), errors="coerce").fillna(0).gt(0), ["scheme_code", "month", "beat"]]
    rows = rows.assign(scheme_code=_key(rows["scheme_code"])).sort_values(["scheme_code", "month"], kind="mergesort")
    recent = rows.groupby("scheme_code", sort=False).tail(months)
    beats = pd.to_numeric(recent["beat"], errors="coerce")
    return beats.groupby(recent["scheme_code"]).agg(["count", "sum"]).set_axis(
        ["batting_36_window", "batting_36_beats"], axis=1
    )


def _snapshots(cards: pd.DataFrame, table: pd.DataFrame | None, as_of: pd.Timestamp) -> pd.DataFrame:
    codes = set(cards["scheme_code"])
    if table is not None and not table.empty:
        snap = table.loc[_key(table["scheme_code"]).isin(codes), ["scheme_code", "date", "rank", "total"]]
        return snap.assign(scheme_code=_key(snap["scheme_code"]))
    # Fallback: the card's rank_now..rank_6m_ago history against today's category size
    # (only the order of dates matters to the rank features).
    history = [column for column in RANK_HISTORY if column in cards]
    long = cards.melt(id_vars=["scheme_code", "rank_total_now"], value_vars=history, var_name="lag", value_name="rank")
    offset = long["lag"].str.extract(r"(\d+)")[0].fillna("0").astype(int)
    long["date"] = as_of - pd.to_timedelta(offset * 30, unit="D")
    return long.rename(columns={"rank_total_now": "total"})[["scheme_code", "date", "rank", "total"]].dropna()


def build_inputs(
    screened: pd.DataFrame, sources: Mapping[str, pd.DataFrame], as_of: str, cfg: Mapping[str, Any]
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Scoring contract (schemes, events, snapshots) for the shortlisted schemes only."""
    spec = cfg["sources"]
    cards = screened.loc[screened["shortlisted"]].reset_index(drop=True)
    for name in ("aum", "returns", "sip_3y", "recovery_speed"):
        cards = _overlay(cards, sources.get(name), spec[name], name)
    as_of_ts = pd.Timestamp(as_of)

    inception = pd.to_datetime(cards["start_date"], errors="coerce") if "start_date" in cards else pd.Series(pd.NaT, index=cards.index)
    master = sources.get("scheme_master")
    if master is not None and {"Code", "Launch Date"} <= set(master.columns):
        launch = master.assign(Code=_key(master["Code"])).drop_duplicates("Code").set_index("Code")["Launch Date"]
        inception = inception.fillna(pd.to_datetime(cards["scheme_code"].map(launch), errors="coerce"))
    inception = inception.fillna(as_of_ts - pd.to_timedelta(_num(cards, "fund_age_years") * 365.25, unit="D"))
    missing_age = int(inception.isna().sum())
    if missing_age:
        LOGGER.warning("%d shortlisted schemes have no launch date or age; they fail every minimum-age rule", missing_age)

    investment_columns = [column for column in spec["fund_cards"]["min_investment_columns"] if column in cards]
    min_investment = (
        cards[investment_columns].apply(pd.to_numeric, errors="coerce").bfill(axis=1).iloc[:, 0]
        if investment_columns else np.nan
    )
    batting = _batting_36m(sources.get("batting_average"), int(spec["batting_average"]["months"]))

    schemes = pd.DataFrame({
        "scheme_code": cards["scheme_code"],
        "name": cards.get("name"),
        "isprimary_v1": "Y",                      # fund cards carry one row per scheme
        "primary_scheme_code": None,
        "amc_code": _slug(cards["amc"]),
        "goc_short_code": cards["goc_short_code"],
        "fund_persona_code": None,
        "return_1y_raw": _num(cards, "ret_1y_pct"),
        "sip_invested": _num(cards, "sip_invested"),
        "sip_current_value": _num(cards, "sip_value"),
        "recovery_typical_months": _num(cards, "typical_recovery_months"),
        "recovery_category_typical_months": _num(cards, "category_typical_recovery_months"),
        "aum_raw": _num(cards, "aum_lakhs"),
        "inception_date": inception,
        "alpha_3y_raw": np.nan,
        "min_sip_amount": min_investment,
        "holdings": None,
        "batting_window": _num(cards, "batting_months"),
        "batting_beats": _num(cards, "months_beat"),
        "sip_allowed": cards["nse_sip_allowed"].astype("string").str.upper().eq("Y").fillna(False),
        "rank_latest": _num(cards, "rank_now"),
        "rank_total_latest": _num(cards, "rank_total_now"),
        "momentum_pass": cards["momentum_pass"].astype(bool),
    }).join(batting, on="scheme_code")

    events_table = sources.get("stress_events")
    if events_table is None:
        LOGGER.warning("stress_events unavailable: downside participation is neutral for every fund")
        events = pd.DataFrame(columns=EVENT_COLUMNS)
    else:
        events = events_table.loc[
            _key(events_table["scheme_code"]).isin(set(schemes["scheme_code"]))
        ].reindex(columns=EVENT_COLUMNS).assign(scheme_code=lambda frame: _key(frame["scheme_code"]))
    return schemes, events.reset_index(drop=True), _snapshots(cards, sources.get("rank_momentum"), as_of_ts).reset_index(drop=True)
