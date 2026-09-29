"""Monthly vectorised scoring job for GoWealthy's personality match engine."""

from __future__ import annotations

import argparse
import io
import json
import logging
import os
import re
import tempfile
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path
from typing import Any, Iterable, Mapping

import numpy as np
import pandas as pd
import yaml

from pm_config import DEFAULT_CONFIG, load_config, validate_config


LOGGER = logging.getLogger("personality_match")
DEFAULT_LIVE_CALIBRATION = Path(__file__).with_name("live_calibration.yaml")
PERSONA_GATE_ORDER = ("GRADE_OVER", "COMPLEX", "HISTORY")
PILLARS = ("resilience", "consistency", "growth", "stature", "turnaround")


def _nested(obj: Mapping[str, Any], path: str, default: Any = None) -> Any:
    value: Any = obj
    for part in path.split("."):
        if not isinstance(value, Mapping) or part not in value:
            return default
        value = value[part]
    return value


def _alias(obj: Mapping[str, Any], aliases: Iterable[str], default: Any = None) -> Any:
    for path in aliases:
        value = _nested(obj, path)
        if value is not None:
            return value
    return default


def _documents(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict) and isinstance(payload.get("funds"), list):
        return payload["funds"]
    if isinstance(payload, dict):
        return [payload]
    raise ValueError("fund input JSON must be an object, an array, or an object containing funds[]")


def _load_local_file(path: Path) -> list[dict[str, Any]]:
    return _documents(json.loads(path.read_text(encoding="utf-8")))


def load_documents(uri: str) -> list[dict[str, Any]]:
    """Load a local JSON file/directory or all JSON objects below a GCS prefix."""
    if uri.startswith("gs://"):
        from google.cloud import storage

        bucket_name, prefix = uri[5:].split("/", 1)
        bucket = storage.Client().bucket(bucket_name)
        blobs = sorted(
            (blob for blob in bucket.list_blobs(prefix=prefix) if blob.name.endswith(".json")),
            key=lambda blob: blob.name,
        )
        with ThreadPoolExecutor(max_workers=min(12, max(1, len(blobs)))) as pool:
            chunks = list(pool.map(lambda blob: _documents(json.loads(blob.download_as_text())), blobs))
        return [document for chunk in chunks for document in chunk]

    path = Path(uri)
    files = [path] if path.is_file() else sorted(path.rglob("*.json"))
    if not files:
        raise FileNotFoundError(f"no JSON inputs found at {uri}")
    with ThreadPoolExecutor(max_workers=min(32, len(files))) as pool:
        chunks = list(pool.map(_load_local_file, files))
    return [document for chunk in chunks for document in chunk]


def _read_uri_bytes(uri: str) -> bytes:
    if uri.startswith("gs://"):
        from google.cloud import storage

        bucket_name, blob_name = uri[5:].split("/", 1)
        return storage.Client().bucket(bucket_name).blob(blob_name).download_as_bytes()
    return Path(uri).read_bytes()


def load_scheme_master(uri: str) -> pd.DataFrame:
    """Load Scheme Master from local disk or GCS with codes kept as strings."""
    frame = pd.read_csv(io.BytesIO(_read_uri_bytes(uri)), dtype=str, keep_default_na=False)
    frame.columns = frame.columns.str.strip()
    frame["Code"] = frame["Code"].str.strip()
    return frame


def apply_calibration(cfg: dict[str, Any], uri: str | None) -> dict[str, Any]:
    if not uri:
        return cfg
    override = yaml.safe_load(_read_uri_bytes(uri))
    if not isinstance(override, dict) or not isinstance(override.get("per_persona_anchors_base"), dict):
        raise ValueError("calibration override must contain per_persona_anchors_base")
    cfg["calibration"]["per_persona_anchors_base"] = override["per_persona_anchors_base"]
    cfg["meta"]["calibration_version"] = str(override.get("calibration_version", "unknown"))
    validate_config(cfg)
    return cfg


def _source_slug(value: Any) -> str:
    return re.sub(r"[^A-Z0-9]+", "_", str(value or "").upper()).strip("_")


def _source_monthly_snapshots(document: Mapping[str, Any]) -> list[dict[str, Any]]:
    trail = _nested(document, "rank_momentum.trail", []) or []
    total = _nested(document, "rank_momentum.total_funds")
    anchor = pd.to_datetime(
        _nested(document, "meta.nav_date") or document.get("updated_at"), errors="coerce"
    )
    if not trail or pd.isna(anchor) or total is None:
        return []
    dates = pd.date_range(end=anchor.to_period("M").to_timestamp(), periods=len(trail), freq="MS")
    return [
        {"date": date.strftime("%Y-%m-%d"), "rank": rank, "total": total}
        for date, rank in zip(dates, trail)
    ]


def adapt_source_documents(
    documents: list[dict[str, Any]], scheme_master: pd.DataFrame, cfg: Mapping[str, Any]
) -> list[dict[str, Any]]:
    """Convert the live fund-card JSON shape into the scoring contract.

    The adapter only maps fields already present in a card or Scheme Master.
    Missing optional analytics remain null and are handled by the configured
    neutral/renormalisation rules in the scoring engine.
    """
    master = {
        str(row["Code"]).strip(): row
        for row in scheme_master.to_dict(orient="records")
        if str(row.get("Code", "")).strip()
    }
    persona_map = cfg.get("source_adapter", {}).get("fund_persona_map", {})

    category_recoveries: dict[str, list[float]] = {}
    for document in documents:
        row = master.get(str(document.get("scheme_code", "")).strip(), {})
        category = str(row.get("GoChanakya Short Code", "")).strip()
        months = pd.to_numeric(_nested(document, "recovery.months_to_recover"), errors="coerce")
        if category and pd.notna(months) and bool(_nested(document, "recovery.recovered", False)):
            category_recoveries.setdefault(category, []).append(float(months))
    category_typical = {
        code: float(np.median(values)) for code, values in category_recoveries.items() if values
    }

    adapted: list[dict[str, Any]] = []
    for document in documents:
        scheme_code = str(document.get("scheme_code", "")).strip()
        row = master.get(scheme_code, {})
        if "category" in document and "returns_pct" in document:
            last_36 = _nested(document, "batting_average.last_36", {}) or {}
            adapted.append({
                **document,
                "isprimary_v1": row.get("isprimary_v1"),
                "primary_scheme_code": row.get("rootPrimary_v1") or None,
                "inception_date": row.get("Launch Date") or None,
                "min_sip_amount": row.get("MinAmount") or row.get("Scheme Minimum Amount") or None,
                "batting_36m": {
                    "window_months": last_36.get("comparable_months") or last_36.get("months_available"),
                    "months_beat": last_36.get("months_beat"),
                },
            })
            continue
        if "meta" not in document:
            adapted.append(document)
            continue
        category_code = str(row.get("GoChanakya Short Code", "")).strip()
        archetype = str(_nested(document, "persona.archetype", "")).strip()
        recovery_months = _nested(document, "recovery.months_to_recover")
        recovered = bool(_nested(document, "recovery.recovered", False))
        amc = row.get("AMC") or _nested(document, "meta.amc")
        adapted.append({
            "scheme_code": scheme_code,
            "isprimary_v1": row.get("isprimary_v1"),
            "primary_scheme_code": row.get("rootPrimary_v1") or None,
            "amc": {"code": _source_slug(amc)},
            "category": {"goc_short_code": category_code},
            "persona": {"code": persona_map.get(archetype, _source_slug(archetype))},
            "returns_pct": {"y1": _nested(document, "persona.ret_1y")},
            "sip_3y": {
                "invested": _nested(document, "wealth_3y.invested"),
                "current_value": _nested(document, "wealth_3y.value"),
            },
            "batting_average": {
                "window_months": _nested(document, "batting.total"),
                "months_beat": _nested(document, "batting.wins"),
            },
            "rank_momentum": {"snapshots": _source_monthly_snapshots(document)},
            "recovery": {
                "typical_months": recovery_months if recovered else None,
                "category_typical_months": category_typical.get(category_code),
                "events": [],
            },
            "inception_date": row.get("Launch Date") or None,
            "min_sip_amount": row.get("MinAmount") or row.get("Scheme Minimum Amount") or None,
            "holdings": document.get("holdings"),
        })
    return adapted


def flatten_documents(
    documents: list[dict[str, Any]], cfg: Mapping[str, Any]
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Flatten each input exactly once into scheme, event, and snapshot frames."""
    aliases = cfg.get("field_aliases", {})
    assume_primary = os.getenv("PM_ASSUME_PRIMARY")
    rows: list[dict[str, Any]] = []
    events: list[dict[str, Any]] = []
    snapshots: list[dict[str, Any]] = []
    placeholder_hits: set[str] = set()

    for document in documents:
        scheme_code = str(document.get("scheme_code", ""))
        primary = _alias(document, aliases.get("is_primary", ["isprimary_v1"]))
        if primary is None:
            placeholder_hits.add("isprimary_v1")
            primary = assume_primary
        row = {
            "scheme_code": scheme_code,
            "primary_scheme_code": _alias(document, aliases.get("primary_scheme_code", ["primary_scheme_code"])),
            "isprimary_v1": primary,
            "amc_code": _nested(document, "amc.code"),
            "goc_short_code": _nested(document, "category.goc_short_code"),
            "fund_persona_code": _nested(document, "persona.code"),
            "return_1y_raw": _nested(document, "returns_pct.y1"),
            "sip_invested": _nested(document, "sip_3y.invested"),
            "sip_current_value": _nested(document, "sip_3y.current_value"),
            "recovery_typical_months": _nested(document, "recovery.typical_months"),
            "recovery_category_typical_months": _nested(document, "recovery.category_typical_months"),
            "aum_raw": _alias(document, aliases.get("aum_cr", ["aum_cr"])),
            "inception_date": _alias(document, aliases.get("inception_date", ["inception_date"])),
            "alpha_3y_raw": _alias(document, aliases.get("alpha_3y_pct", ["alpha_3y_pct"])),
            "min_sip_amount": _alias(document, aliases.get("min_sip_amount", ["min_sip_amount"])),
            "holdings": _alias(document, aliases.get("holdings", ["holdings"])),
            "batting_window": _nested(document, "batting_average.window_months"),
            "batting_beats": _nested(document, "batting_average.months_beat"),
            "batting_36_window": _nested(document, "batting_36m.window_months"),
            "batting_36_beats": _nested(document, "batting_36m.months_beat"),
        }
        for field in ("aum_raw", "inception_date", "alpha_3y_raw", "min_sip_amount"):
            if row[field] is None:
                placeholder_hits.add(field)
        rows.append(row)
        for event in _nested(document, "recovery.events", []) or []:
            events.append({"scheme_code": scheme_code, **event})
        for snapshot in _nested(document, "rank_momentum.snapshots", []) or []:
            snapshots.append({"scheme_code": scheme_code, **snapshot})

    if placeholder_hits:
        LOGGER.warning("TODO(confirm) fields absent: %s", ", ".join(sorted(placeholder_hits)))
    return pd.DataFrame(rows), pd.DataFrame(events), pd.DataFrame(snapshots)


def _whole_months(dates: pd.Series, as_of: pd.Timestamp) -> pd.Series:
    parsed = pd.to_datetime(dates, errors="coerce")
    months = (as_of.year - parsed.dt.year) * 12 + (as_of.month - parsed.dt.month)
    months -= (as_of.day < parsed.dt.day).astype("Int64")
    return months.astype("Float64")


def _peer_percentile(
    frame: pd.DataFrame, value_column: str, cfg: Mapping[str, Any]
) -> pd.Series:
    """Category percentile with the configured parent fallback for small groups."""
    values = pd.to_numeric(frame[value_column], errors="coerce")
    valid = frame["status"].eq("SCORED") & values.notna()
    work = frame.loc[valid, ["goc_short_code", "parent"]].copy()
    work["value"] = values[valid].astype("float64")

    cat_n = work.groupby("goc_short_code")["value"].transform("count")
    cat_rank = work.groupby("goc_short_code")["value"].rank(method="average")
    parent_n = work.groupby("parent")["value"].transform("count")
    parent_rank = work.groupby("parent")["value"].rank(method="average")
    use_parent = cat_n < int(cfg["peer_groups"]["min_peers"])
    n = cat_n.where(~use_parent, parent_n)
    rank = cat_rank.where(~use_parent, parent_rank)
    percentile = ((rank - 0.5) / n).where(n.ne(1), 0.5)
    result = pd.Series(np.nan, index=frame.index, dtype="float32")
    result.loc[valid] = percentile.astype("float32")
    return result


def _snapshot_features(
    snapshots: pd.DataFrame, cfg: Mapping[str, Any]
) -> pd.DataFrame:
    columns = ["rank_stability", "rank_level", "rank_trend", "turnaround"]
    if snapshots.empty:
        return pd.DataFrame(columns=columns, dtype="float32")
    snap = snapshots.copy()
    snap["date"] = pd.to_datetime(snap["date"], errors="coerce")
    snap["rank"] = pd.to_numeric(snap["rank"], errors="coerce")
    snap["total"] = pd.to_numeric(snap["total"], errors="coerce")
    snap = snap.dropna(subset=["scheme_code", "date", "rank", "total"]).sort_values(
        ["scheme_code", "date"], kind="mergesort"
    )
    snap["pct_t"] = np.where(
        snap["total"].eq(1),
        0.5,
        1.0 - (snap["rank"] - 1.0) / (snap["total"] - 1.0),
    )
    snap["pct_t"] = snap["pct_t"].clip(0, 1)
    groups = snap.groupby("scheme_code", sort=False)
    count = groups["pct_t"].count()

    move = groups["pct_t"].diff().abs()
    mean_move = move.groupby(snap["scheme_code"]).mean()
    stability_scale = float(cfg["features"]["rank_stability"]["max_mean_move"])
    stability = (1.0 - mean_move / stability_scale).clip(0, 1).where(count >= 6)
    level = groups.tail(3).groupby("scheme_code", sort=False)["pct_t"].mean()

    last6 = groups.tail(6).copy()
    last6["x"] = last6.groupby("scheme_code", sort=False).cumcount().astype("float64")
    last6["xy"] = last6["x"] * last6["pct_t"]
    last6["x2"] = last6["x"] ** 2
    sums = last6.groupby("scheme_code", sort=False).agg(
        n=("pct_t", "count"), sx=("x", "sum"), sy=("pct_t", "sum"),
        sxy=("xy", "sum"), sx2=("x2", "sum"),
    )
    denom = sums["n"] * sums["sx2"] - sums["sx"] ** 2
    slope = (sums["n"] * sums["sxy"] - sums["sx"] * sums["sy"]) / denom
    trend_cfg = cfg["features"]["rank_trend"]
    trend = (
        float(trend_cfg["neutral"]) + slope / float(trend_cfg["slope_scale"])
    ).clip(0, 1).where(sums["n"] >= 6)

    snap["n"] = groups["pct_t"].transform("count")
    snap["position"] = groups.cumcount()
    trough = snap.loc[snap["position"] < snap["n"] - 3].groupby("scheme_code")["pct_t"].min()
    turnaround_cfg = cfg["features"]["turnaround"]
    turnaround = ((level - trough) / float(turnaround_cfg["climb_scale"])).clip(0, 1)
    turnaround = turnaround.where(
        trough < 0.5, float(turnaround_cfg["never_bottom_half_score"])
    ).where(count >= 6)

    return pd.DataFrame({
        "rank_stability": stability,
        "rank_level": level,
        "rank_trend": trend,
        "turnaround": turnaround,
    }).astype("float32")


def build_feature_frame(
    schemes: pd.DataFrame,
    events: pd.DataFrame,
    snapshots: pd.DataFrame,
    as_of_date: str | date,
    cfg: Mapping[str, Any],
) -> pd.DataFrame:
    """Compute all persona-independent features once."""
    as_of = pd.Timestamp(as_of_date)
    frame = schemes.copy()
    category_meta = pd.DataFrame.from_dict(cfg["categories"], orient="index")
    category_meta.index.name = "goc_short_code"
    frame = frame.join(category_meta, on="goc_short_code", rsuffix="_category")
    frame["auto_recommend"] = frame["auto_recommend"].astype("boolean").fillna(True).astype(bool)
    frame["history_months"] = _whole_months(frame["inception_date"], as_of)

    known_category = frame["goc_short_code"].isin(cfg["categories"])
    is_primary = frame["isprimary_v1"].astype("string").str.upper().eq("Y").fillna(False)
    enough_history = frame["history_months"].ge(int(cfg["universe"]["min_history_months"])).fillna(False)
    frame["status"] = np.select(
        [known_category & is_primary & enough_history, known_category & is_primary & ~enough_history],
        ["SCORED", "TOO_NEW"],
        default="OUT_OF_UNIVERSE",
    )
    non_primary = known_category & ~is_primary & frame["primary_scheme_code"].notna()
    frame.loc[non_primary, "status"] = "INHERIT"
    unknown_count = int((~known_category).sum())
    if unknown_count:
        LOGGER.warning("%d schemes use unknown category codes", unknown_count)

    applicable = pd.DataFrame()
    if not events.empty:
        applicable = events.copy()
        applicable["fall_pct"] = pd.to_numeric(applicable["fall_pct"], errors="coerce")
        applicable["recovered_pct"] = pd.to_numeric(applicable.get("recovered_pct"), errors="coerce")
        applicable = applicable.loc[
            applicable["status"].ne("not_applicable") & applicable["fall_pct"].notna()
        ]
        scheme_categories = frame.set_index("scheme_code")["goc_short_code"]
        applicable["goc_short_code"] = applicable["scheme_code"].map(scheme_categories)
        refs = applicable.loc[
            applicable["goc_short_code"].isin(cfg["peer_groups"]["reference_fall_group"])
        ].groupby("event_code")["fall_pct"].median()
        applicable["ref_fall"] = applicable["event_code"].map(refs)
        applicable["ratio"] = applicable["fall_pct"] / applicable["ref_fall"]
        dp = applicable.dropna(subset=["ratio"]).groupby("scheme_code")["ratio"].agg(["median", "count"])
        dp.columns = ["DP", "dp_events"]
        frame = frame.join(dp, on="scheme_code")
        recovering = applicable.loc[applicable["status"].eq("recovering")].copy()
        recovering["remaining"] = 1.0 - recovering["recovered_pct"] / 100.0
        penalty = recovering.groupby("scheme_code")["remaining"].mean().clip(
            upper=float(cfg["features"]["unrecovered_penalty"]["max_penalty"])
        )
        frame = frame.join(penalty.rename("unrecovered_penalty"), on="scheme_code")
    if "DP" not in frame:
        frame["DP"] = np.nan
        frame["dp_events"] = 0
    frame["dp_conf"] = (
        pd.to_numeric(frame["dp_events"], errors="coerce").fillna(0)
        / float(cfg["features"]["downside_participation"]["min_events_full_confidence"])
    ).clip(0, 1)
    if "unrecovered_penalty" not in frame:
        frame["unrecovered_penalty"] = 0.0
    frame["unrecovered_penalty"] = frame["unrecovered_penalty"].fillna(0.0)

    typical = pd.to_numeric(frame["recovery_typical_months"], errors="coerce")
    category_typical = pd.to_numeric(frame["recovery_category_typical_months"], errors="coerce")
    frame["recovery_ratio"] = (
        float(cfg["features"]["recovery_ratio"]["intercept"]) - typical / category_typical
    ).clip(0, 1).where(category_typical > 0)

    window36 = pd.to_numeric(frame["batting_36_window"], errors="coerce")
    beats36 = pd.to_numeric(frame["batting_36_beats"], errors="coerce")
    window12 = pd.to_numeric(frame["batting_window"], errors="coerce")
    beats12 = pd.to_numeric(frame["batting_beats"], errors="coerce")
    window = window36.where(window36.notna() & beats36.notna(), window12)
    beats = beats36.where(window36.notna() & beats36.notna(), beats12)
    batting_cfg = cfg["features"]["batting_average"]
    prior = float(batting_cfg["prior_k"])
    frame["batting"] = (
        ((beats + prior * float(batting_cfg["prior_mean"])) / (window + prior) - float(batting_cfg["score_floor"]))
        / float(batting_cfg["score_range"])
    ).clip(0, 1)

    snap_features = _snapshot_features(snapshots, cfg)
    frame = frame.join(snap_features, on="scheme_code")
    invested = pd.to_numeric(frame["sip_invested"], errors="coerce")
    current = pd.to_numeric(frame["sip_current_value"], errors="coerce")
    frame["sip_3y_raw"] = (current / invested).where(invested > 0)
    aum = pd.to_numeric(frame["aum_raw"], errors="coerce")
    frame["aum_log_raw"] = np.log(aum.where(aum > 0))
    frame["track_record_years"] = (frame["history_months"] / 12.0).astype("Float64")
    frame["track_record"] = (
        frame["track_record_years"] / float(cfg["features"]["track_record"]["full_years"])
    ).clip(lower=0, upper=1)

    for output, source in (
        ("return_1y", "return_1y_raw"), ("sip_3y", "sip_3y_raw"),
        ("alpha_3y", "alpha_3y_raw"), ("aum", "aum_log_raw"),
    ):
        frame[output] = _peer_percentile(frame, source, cfg)
    return frame


def _weighted_average(values: np.ndarray, weights: np.ndarray, neutral: float) -> tuple[np.ndarray, np.ndarray]:
    present = ~np.isnan(values)
    denominator = present @ weights
    numerator = np.nan_to_num(values, nan=0.0) @ weights
    missing = denominator == 0
    return np.divide(numerator, denominator, out=np.full(values.shape[0], neutral), where=~missing), missing


def _reason_lists(
    contributions: np.ndarray,
    labels: np.ndarray,
    positive: bool,
    threshold: float,
) -> list[list[str]]:
    order = np.argsort(-contributions if positive else contributions, axis=1, kind="stable")
    sorted_values = np.take_along_axis(contributions, order, axis=1)
    sorted_labels = labels[order] if labels.ndim == 1 else np.take_along_axis(labels, order, axis=1)
    keep = sorted_values >= threshold if positive else sorted_values <= -threshold
    # Only serialization is row-oriented; all scoring and ranking maths above is vectorised.
    return [list(row_labels[row_keep][:2]) for row_labels, row_keep in zip(sorted_labels, keep)]


def score_features(
    features: pd.DataFrame, cfg: Mapping[str, Any]
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Score a prepared feature frame for all personas with broadcast NumPy maths."""
    frame = features.copy().reset_index(drop=True)
    personas = list(cfg["personas"])
    n, p = len(frame), len(personas)
    neutral = float(cfg["missing_data"]["pillar_all_null"])

    def matrix(columns: list[str]) -> np.ndarray:
        return frame.reindex(columns=columns).apply(pd.to_numeric, errors="coerce").to_numpy(dtype=np.float64)

    def numeric_series(primary: str, fallback: str | None = None, default: float = np.nan) -> pd.Series:
        if primary in frame:
            source = frame[primary]
        elif fallback and fallback in frame:
            source = frame[fallback]
        else:
            source = pd.Series(default, index=frame.index)
        return pd.to_numeric(source, errors="coerce")

    dp = numeric_series("DP").to_numpy(dtype=np.float64)[:, None]
    dp_conf = numeric_series("dp_conf", default=1.0).fillna(0).to_numpy(dtype=np.float64)[:, None]
    tau = np.array([float(cfg["personas"][code]["tau"]) for code in personas])[None, :]
    k = float(cfg["features"]["downside_participation"]["k"])
    dp_score = dp_conf / (1.0 + np.exp(np.clip(k * (dp - tau), -80, 80))) + (1.0 - dp_conf) * 0.5
    dp_score[np.isnan(dp).repeat(p, axis=1)] = np.nan

    recovery = numeric_series("recovery_ratio", "rec_score").to_numpy(dtype=np.float64)[:, None]
    recovery = np.repeat(recovery, p, axis=1)
    resilience_weights = cfg["pillar_features"]["resilience"]
    res_values = np.stack((dp_score, recovery), axis=2)
    res_weights = np.array([
        float(resilience_weights["downside_participation"]),
        float(resilience_weights["recovery_ratio"]),
    ])
    present = ~np.isnan(res_values)
    res_den = np.sum(present * res_weights, axis=2)
    resilience = np.divide(
        np.sum(np.nan_to_num(res_values, nan=0.0) * res_weights, axis=2),
        res_den,
        out=np.full((n, p), neutral), where=res_den != 0,
    )
    penalty = numeric_series("unrecovered_penalty", "pen", 0.0).fillna(0).to_numpy(dtype=np.float64)[:, None]
    resilience = np.clip(resilience - penalty, 0, 1)
    low_confidence = res_den == 0

    consistency_values = matrix(["batting", "rank_stability"])
    if "rank_stability" not in frame and "stability" in frame:
        consistency_values[:, 1] = pd.to_numeric(frame["stability"], errors="coerce")
    consistency, consistency_missing = _weighted_average(
        consistency_values,
        np.array(list(map(float, cfg["pillar_features"]["consistency"].values()))),
        neutral,
    )
    consistency = np.repeat(consistency[:, None], p, axis=1)
    low_confidence |= consistency_missing[:, None]

    growth_columns = ["sip_3y", "alpha_3y", "rank_level", "return_1y", "rank_trend"]
    growth_values = matrix(growth_columns)
    growth = np.empty((n, p), dtype=np.float64)
    growth_missing = np.empty((n, p), dtype=bool)
    for index, code in enumerate(personas):
        mix = cfg["growth_mixes"][cfg["personas"][code]["growth_mix"]]
        growth[:, index], growth_missing[:, index] = _weighted_average(
            growth_values, np.array([float(mix[column]) for column in growth_columns]), neutral
        )
    low_confidence |= growth_missing

    stature_values = matrix(["aum", "track_record"])
    stature, stature_missing = _weighted_average(
        stature_values,
        np.array(list(map(float, cfg["pillar_features"]["stature"].values()))),
        neutral,
    )
    stature = np.repeat(stature[:, None], p, axis=1)
    low_confidence |= stature_missing[:, None]
    turnaround_raw = pd.to_numeric(frame.get("turnaround"), errors="coerce").to_numpy(dtype=np.float64)
    turnaround_missing = np.isnan(turnaround_raw)
    turnaround = np.repeat(np.where(turnaround_missing, neutral, turnaround_raw)[:, None], p, axis=1)
    low_confidence |= turnaround_missing[:, None]

    pillars = np.stack((resilience, consistency, growth, stature, turnaround), axis=2)
    persona_weights = np.array([
        [float(cfg["personas"][code]["weights"][pillar]) for pillar in PILLARS]
        for code in personas
    ])
    fit = np.sum(pillars * persona_weights[None, :, :], axis=2)
    history = pd.to_numeric(frame["history_months"], errors="coerce").fillna(0).to_numpy(dtype=np.float64)[:, None]
    history_confidence = np.minimum(
        1.0, history / float(cfg["missing_data"]["history_full_confidence_months"])
    )
    fit = history_confidence * fit + (1.0 - history_confidence) * neutral

    fund_personas = frame["fund_persona_code"].fillna("").astype(str)
    default_affinity = float(cfg["fund_persona_affinity"]["default"])
    affinity = np.column_stack([
        fund_personas.map(cfg["fund_persona_affinity"].get(code, {})).fillna(default_affinity).to_numpy(dtype=float)
        for code in personas
    ])
    grades = pd.to_numeric(frame["grade"], errors="coerce").to_numpy(dtype=np.float64)[:, None]
    ideals = np.array([float(cfg["personas"][code]["ideal_grade"]) for code in personas])[None, :]
    composition = cfg["composition"]
    style_fit = np.clip(
        1.0 - np.abs(grades - ideals) / float(composition["style_grade_span"]), 0, 1
    )
    base = float(composition["score_scale"]) * (
        float(composition["fit_weight"]) * fit
        + float(composition["affinity_weight"]) * affinity
        + float(composition["style_weight"]) * style_fit
    )
    display_anchors = np.array(cfg["calibration"]["anchors_display"], dtype=np.float64)
    display = np.column_stack([
        np.interp(
            base[:, index],
            np.array(
                cfg["calibration"].get("per_persona_anchors_base", {}).get(
                    code, cfg["calibration"]["default_anchors_base"]
                ),
                dtype=np.float64,
            ),
            display_anchors,
        )
        for index, code in enumerate(personas)
    ])

    persona_gates = cfg["gates"]["persona_level"]
    willing = np.array([int(cfg["personas"][code]["willingness_grade"]) for code in personas])[None, :]
    grade_over = grades - willing
    grade_caps = np.where(
        grade_over >= 2,
        int(persona_gates["grade_over_by_2plus_cap"]),
        np.where(grade_over == 1, int(persona_gates["grade_over_by_1_cap"]), 100),
    )
    access = np.array([bool(cfg["personas"][code]["complex_access"]) for code in personas])[None, :]
    complex_mask = frame["complex"].eq(True).to_numpy(dtype=bool)[:, None] & ~access
    complex_caps = np.where(complex_mask, int(persona_gates["complex_without_access_cap"]), 100)
    history_mask = history < int(persona_gates["history_under_months"])
    history_caps = np.where(history_mask, int(persona_gates["history_under_12m_cap"]), 100)
    cap = np.minimum(np.minimum(grade_caps, complex_caps), history_caps)
    capped_display = np.minimum(display, cap)
    scores = np.floor(np.where(np.isfinite(capped_display), capped_display, 0) + 0.5 + 1e-9).astype(np.int16)
    status_scored = frame["status"].eq("SCORED").to_numpy()[:, None]

    gates = np.full((n, p), None, dtype=object)
    gate_candidates = (
        ("GRADE_OVER", grade_caps), ("COMPLEX", complex_caps), ("HISTORY", history_caps),
    )
    for gate_code, candidate in reversed(gate_candidates):
        gates[(candidate == cap) & (candidate < 100)] = gate_code

    positive_codes = np.array([cfg["reasons"]["positive"][pillar]["code"] for pillar in PILLARS] + [cfg["reasons"]["positive"]["style"]["code"]])
    threshold = float(cfg["reasons"]["min_contribution"])
    output = frame.copy()
    audit_parts: list[pd.DataFrame] = []
    for index, code in enumerate(personas):
        contribution = np.column_stack([
            float(composition["fit_weight"]) * persona_weights[index] * (pillars[:, index, :] - 0.5),
            float(composition["style_weight"]) * (style_fit[:, index] - 0.5),
        ])
        # Style is row-dependent for negative reasons, so substitute it after ranking.
        neg_labels = np.tile(positive_codes, (n, 1)).astype(object)
        neg_labels[:, :5] = np.array([cfg["reasons"]["negative"][pillar]["code"] for pillar in PILLARS])
        neg_labels[:, 5] = np.where(
            grades[:, 0] < ideals[0, index],
            cfg["reasons"]["negative"]["style_tame"]["code"],
            cfg["reasons"]["negative"]["style_wild"]["code"],
        )
        pos_labels = np.tile(positive_codes, (n, 1))
        output[f"score_{code}"] = pd.array(np.where(status_scored[:, 0], scores[:, index], np.nan), dtype="Int8")
        output[f"gate_{code}"] = np.where(status_scored[:, 0], gates[:, index], None)
        output[f"pos_reasons_{code}"] = _reason_lists(contribution, pos_labels, True, threshold)
        output[f"neg_reasons_{code}"] = _reason_lists(contribution, neg_labels, False, threshold)
        audit_parts.append(pd.DataFrame({
            "scheme_code": output["scheme_code"], "persona_code": code,
            "dp_score": dp_score[:, index], "resilience": resilience[:, index],
            "consistency": consistency[:, index], "growth": growth[:, index],
            "stature": stature[:, index], "turnaround_pillar": turnaround[:, index],
            "fit": fit[:, index], "affinity": affinity[:, index],
            "style_fit": style_fit[:, index], "base": base[:, index],
            "display": display[:, index], "cap": cap[:, index],
            "score": np.where(status_scored[:, 0], scores[:, index], np.nan),
            "persona_gate": gates[:, index], "low_confidence": low_confidence[:, index],
            "history_months": history[:, 0], "status": frame["status"],
        }))

    output["low_confidence"] = low_confidence.any(axis=1)
    output["aum_pct"] = pd.to_numeric(output.get("aum"), errors="coerce").astype("float32")
    output["sip_3y_pct"] = pd.to_numeric(output.get("sip_3y"), errors="coerce").astype("float32")
    for column in ("rank_level", "rank_trend", "turnaround", "track_record_years"):
        output[column] = pd.to_numeric(output.get(column), errors="coerce").astype("float32")
    return output, pd.concat(audit_parts, ignore_index=True)


def _inherit_primary_scores(scores: pd.DataFrame, cfg: Mapping[str, Any]) -> pd.DataFrame:
    result = scores.copy()
    inheriting = result["status"].eq("INHERIT")
    if not inheriting.any():
        return result
    columns = [
        column for column in result.columns
        if column.startswith(("score_", "gate_", "pos_reasons_", "neg_reasons_"))
    ] + ["low_confidence"]
    primary = result.set_index(result["scheme_code"].astype(str))[columns]
    mapped = primary.reindex(result.loc[inheriting, "primary_scheme_code"].astype(str)).set_axis(result.index[inheriting])
    result.loc[inheriting, columns] = mapped
    result.loc[inheriting & result[[c for c in columns if c.startswith("score_")]].notna().any(axis=1), "status"] = "SCORED"
    return result


def score_documents(
    documents: list[dict[str, Any]], as_of_date: str, cfg: Mapping[str, Any]
) -> tuple[pd.DataFrame, pd.DataFrame]:
    schemes, events, snapshots = flatten_documents(documents, cfg)
    features = build_feature_frame(schemes, events, snapshots, as_of_date, cfg)
    scores, audit = score_features(features, cfg)
    scores = _inherit_primary_scores(scores, cfg)
    meta = cfg["meta"]
    for frame in (scores, audit):
        frame["config_version"] = meta["config_version"]
        frame["method_version"] = meta["method_version"]
        frame["calibration_version"] = meta["calibration_version"]
        frame["as_of_date"] = str(as_of_date)
    return scores.sort_values("scheme_code", kind="mergesort").reset_index(drop=True), audit.sort_values(
        ["scheme_code", "persona_code"], kind="mergesort"
    ).reset_index(drop=True)


def calibration_proposal(audit: pd.DataFrame, cfg: Mapping[str, Any]) -> dict[str, Any]:
    eligible = audit.loc[
        audit["status"].eq("SCORED")
        & audit["history_months"].ge(float(cfg["missing_data"]["history_full_confidence_months"]))
    ]
    quantiles = [0.0, 0.10, 0.50, 0.85, 0.97, 1.0]
    display = np.asarray(cfg["calibration"]["anchors_display"], dtype=float)
    anchors: dict[str, list[float]] = {}
    mixes: dict[str, dict[str, float]] = {}
    for code in cfg["personas"]:
        base = eligible.loc[eligible["persona_code"].eq(code), "base"].dropna().to_numpy()
        values = np.quantile(base, quantiles).tolist()
        if any(right <= left for left, right in zip(values, values[1:])):
            raise ValueError(f"calibration anchors are not strictly increasing for {code}")
        displayed = np.interp(base, values, display)
        if float(np.mean(displayed >= 85)) > float(cfg["calibration"]["max_great_share"]):
            raise ValueError(f"calibration Great share exceeds guard for {code}")
        anchors[code] = [round(float(value), 6) for value in values]
        mixes[code] = {
            band["code"]: round(float(np.mean(displayed >= int(band["min"]))), 6)
            for band in cfg["bands"]
        }
    return {
        "calibration_version": date.today().isoformat(),
        "per_persona_anchors_base": anchors,
        "cumulative_band_shares": mixes,
    }


def _parquet_bytes(frame: pd.DataFrame) -> bytes:
    buffer = io.BytesIO()
    frame.to_parquet(buffer, engine="pyarrow", index=False, compression="zstd")
    return buffer.getvalue()


def _write_bytes(destination: str, relative: str, content: bytes) -> None:
    if destination.startswith("gs://"):
        from google.cloud import storage

        bucket_name, prefix = destination[5:].split("/", 1) if "/" in destination[5:] else (destination[5:], "")
        bucket = storage.Client().bucket(bucket_name)
        final_name = "/".join(part for part in (prefix.rstrip("/"), relative) if part)
        temp_name = f"{final_name}.tmp-{uuid.uuid4().hex}"
        temp_blob = bucket.blob(temp_name)
        temp_blob.upload_from_string(content)
        bucket.copy_blob(temp_blob, bucket, final_name)
        temp_blob.delete()
        return
    target = Path(destination) / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=target.parent, delete=False) as handle:
        handle.write(content)
        temp_name = handle.name
    Path(temp_name).replace(target)


def run(args: argparse.Namespace) -> None:
    cfg = apply_calibration(load_config(args.config), args.calibration)
    documents = load_documents(args.input)
    LOGGER.info("loaded %d scheme documents", len(documents))
    if any(
        ("meta" in document and "category" not in document)
        or ("category" in document and "returns_pct" in document)
        for document in documents
    ):
        LOGGER.info("adapting live fund-card documents with %s", args.scheme_master)
        documents = adapt_source_documents(documents, load_scheme_master(args.scheme_master), cfg)
    scores, audit = score_documents(documents, args.as_of, cfg)
    counts = scores["status"].value_counts(dropna=False).to_dict()
    LOGGER.info("status counts: %s", counts)

    if args.mode == "calibrate":
        proposal = yaml.safe_dump(calibration_proposal(audit, cfg), sort_keys=False).encode("utf-8")
        _write_bytes(args.output, "calibration_proposal.yaml", proposal)
        return

    output_columns = [
        "scheme_code", "primary_scheme_code", "amc_code", "goc_short_code", "grade", "role",
        "complex", "auto_recommend", "history_months", "status",
    ] + [column for column in scores.columns if column.startswith(("score_", "gate_", "pos_reasons_", "neg_reasons_"))] + [
        "aum_pct", "sip_3y_pct", "rank_level", "rank_trend", "turnaround", "track_record_years",
        "min_sip_amount", "holdings", "low_confidence", "config_version", "method_version",
        "calibration_version", "as_of_date",
    ]
    output = scores.reindex(columns=output_columns)
    scores_bytes = _parquet_bytes(output)
    audit_bytes = _parquet_bytes(audit)
    json_bytes = json.dumps({
        "schema_version": "1.0",
        "as_of_date": str(args.as_of),
        "config_version": cfg["meta"]["config_version"],
        "method_version": cfg["meta"]["method_version"],
        "calibration_version": cfg["meta"]["calibration_version"],
        "user_adjustment": {
            **cfg["user_adjustment"],
            "gates": cfg["gates"]["user_level"],
            "bands": cfg["bands"],
            "recommend_floor": cfg["recommend_floor"],
            "basket_min_score": cfg["basket_min_score"],
            "amount_bands": cfg["amount_bands"],
            "reasons": cfg["reasons"],
            "willingness_by_persona": {
                code: persona["willingness_grade"] for code, persona in cfg["personas"].items()
            },
        },
        "rows": json.loads(output.to_json(orient="records")),
    }, separators=(",", ":"), sort_keys=True).encode("utf-8")
    dated = f"personality_match/as_of={args.as_of}"
    _write_bytes(args.output, f"{dated}/scores.parquet", scores_bytes)
    _write_bytes(args.output, f"{dated}/audit.parquet", audit_bytes)
    _write_bytes(args.output, f"{dated}/scores.json", json_bytes)
    _write_bytes(args.output, "personality_match/latest/scores.parquet", scores_bytes)
    _write_bytes(args.output, "personality_match/latest/scores.json", json_bytes)


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__)
    result.add_argument(
        "--as-of",
        default=os.getenv("PM_AS_OF", date.today().isoformat()),
        help="scoring date in YYYY-MM-DD format; defaults to today's UTC job date",
    )
    result.add_argument("--mode", choices=("score", "calibrate"), default="score")
    result.add_argument("--input", default=os.getenv("PM_INPUT_URI"), help="JSON file/directory or gs:// prefix")
    result.add_argument(
        "--scheme-master",
        default=os.getenv("PM_SCHEME_MASTER_URI", "gs://mf-data-public/Scheme Master.csv"),
        help="Scheme Master CSV used to enrich the live fund-card JSON shape",
    )
    result.add_argument(
        "--output",
        default=(f"gs://{os.getenv('PM_OUTPUT_BUCKET', 'mf-data-public')}"),
        help="local output directory or gs:// prefix",
    )
    result.add_argument("--config", default=os.getenv("PM_CONFIG_URI", str(DEFAULT_CONFIG)))
    result.add_argument(
        "--calibration",
        default=os.getenv("PM_CALIBRATION_URI", str(DEFAULT_LIVE_CALIBRATION)),
        help="persona calibration override generated from the live universe",
    )
    return result


if __name__ == "__main__":
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(levelname)s %(message)s")
    arguments = parser().parse_args()
    if not arguments.input:
        parser().error("--input or PM_INPUT_URI is required")
    run(arguments)
