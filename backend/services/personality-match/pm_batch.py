"""Monthly job: screen the latest fund cards, persona-score the shortlist, publish shortlisted_schemes."""

from __future__ import annotations

import argparse
import io
import json
import logging
import os
import tempfile
import uuid
from datetime import date
from pathlib import Path
from typing import Any, Mapping

import numpy as np
import pandas as pd

from pm_basket import eligible_slots, persona_positions
from pm_config import DEFAULT_CONFIG, load_config, validate_config
from pm_sources import build_inputs, load_sources, screen


LOGGER = logging.getLogger("personality_match")
PERSONA_GATE_ORDER = ("GRADE_OVER", "COMPLEX", "HISTORY")


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
    valid = frame["status"].isin(("SCORED", "BUFFER")) & values.notna()
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
    """Rank stability, the owner's rank-momentum score and the latest rank per scheme.

    Rank momentum on the last N monthly ranks by 6-month return (rank 1 = best):
    level_weight x (1 - average rank / total) + change_weight x (oldest - latest rank) / total.
    """
    columns = ["rank_stability", "rank_momentum_raw", "rank_latest", "rank_total_latest"]
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

    rules = cfg["features"]["rank_momentum"]
    recent = groups.tail(int(rules["observations"])).groupby("scheme_code", sort=False)["rank"]
    latest = groups.tail(1).set_index("scheme_code")
    momentum = (
        float(rules["level_weight"]) * (1.0 - recent.mean() / latest["total"])
        + float(rules["change_weight"]) * (recent.first() - latest["rank"]) / latest["total"]
    )

    return pd.DataFrame({
        "rank_stability": stability,
        "rank_momentum_raw": momentum,
        "rank_latest": latest["rank"],
        "rank_total_latest": latest["total"],
    }).astype("float32")


def _momentum_pass(frame: pd.DataFrame, cfg: Mapping[str, Any]) -> pd.Series:
    """Top-half-of-category filter on the latest month's rank (rank 1 = best)."""
    rules = cfg["momentum_filter"]
    rank = pd.to_numeric(frame["rank_latest"], errors="coerce")
    total = pd.to_numeric(frame["rank_total_latest"], errors="coerce")
    has_rank = rank.notna() & total.gt(0)
    in_top = rank.le(total * float(rules["top_fraction"])) & has_rank
    category_has_ranks = has_rank.groupby(frame["goc_short_code"].fillna("")).transform("any")
    unranked_default = ~category_has_ranks if rules["skip_categories_without_ranks"] else False
    in_universe = frame["status"].isin(("SCORED", "BUFFER"))
    unranked_categories = sorted(frame.loc[in_universe & ~category_has_ranks, "goc_short_code"].dropna().unique())
    if unranked_categories:
        LOGGER.warning("momentum filter skipped (no rank data) for: %s", ", ".join(unranked_categories))
    return in_top.where(has_rank, unranked_default).astype(bool)


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
    frame["auto_recommend"] = frame.reindex(columns=["auto_recommend"])["auto_recommend"].astype("boolean").fillna(True).astype(bool)
    frame["history_months"] = _whole_months(frame["inception_date"], as_of)

    known_category = frame["goc_short_code"].isin(cfg["categories"])
    is_primary = frame["isprimary_v1"].astype("string").str.upper().eq("Y").fillna(False)
    enough_history = frame["history_months"].ge(int(cfg["universe"]["min_history_months"])).fillna(False)
    is_buffer = frame["role"].eq("buffer").fillna(False)
    frame["status"] = np.select(
        [
            known_category & is_primary & enough_history & ~is_buffer,
            known_category & is_primary & enough_history & is_buffer,
            known_category & is_primary & frame["history_months"].isna(),
            known_category & is_primary & ~enough_history,
        ],
        ["SCORED", "BUFFER", "AGE_UNKNOWN", "TOO_NEW"],
        default="OUT_OF_UNIVERSE",
    )
    non_primary = known_category & ~is_primary & frame["primary_scheme_code"].notna()
    frame.loc[non_primary, "status"] = "INHERIT"
    if cfg["universe"].get("require_latest_aum"):
        # Owner rule: suitability is scored only where the latest month's AUM is present.
        no_aum = frame["status"].isin(("SCORED", "BUFFER")) & pd.to_numeric(frame["aum_raw"], errors="coerce").isna()
        frame.loc[no_aum, "status"] = "NO_AUM"
        if no_aum.any():
            LOGGER.warning("%d shortlisted schemes have no latest-month AUM and are not scored", int(no_aum.sum()))
    unknown_count = int((~known_category).sum())
    if unknown_count:
        LOGGER.info("%d schemes outside the configured universe (ELSS, ETFs, debt, etc.)", unknown_count)

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
    frame = frame.join(snap_features.drop(columns=snap_features.columns.intersection(frame.columns)), on="scheme_code")
    if "momentum_pass" not in frame:
        frame["momentum_pass"] = _momentum_pass(frame, cfg)
    rank = pd.to_numeric(frame["rank_latest"], errors="coerce")
    total = pd.to_numeric(frame["rank_total_latest"], errors="coerce")
    frame["rank_now_pct"] = np.where(total.eq(1), 0.5, 1.0 - (rank - 1.0) / (total - 1.0)).clip(0, 1)
    invested = pd.to_numeric(frame["sip_invested"], errors="coerce")
    current = pd.to_numeric(frame["sip_current_value"], errors="coerce")
    frame["sip_3y_raw"] = (current / invested).where(invested > 0)
    aum = pd.to_numeric(frame["aum_raw"], errors="coerce")
    frame["aum_log_raw"] = np.log(aum.where(aum > 0))
    for output, source in (("sip_3y", "sip_3y_raw"), ("aum", "aum_log_raw")):
        frame[output] = _peer_percentile(frame, source, cfg)
    return frame


def _weighted_average(values: np.ndarray, weights: np.ndarray, neutral: float) -> tuple[np.ndarray, np.ndarray]:
    present = ~np.isnan(values)
    denominator = present @ weights
    numerator = np.nan_to_num(values, nan=0.0) @ weights
    missing = denominator == 0
    return np.divide(numerator, denominator, out=np.full(values.shape[0], neutral), where=~missing), missing


def _resilience_consistency(frame: pd.DataFrame, cfg: Mapping[str, Any]) -> tuple[np.ndarray, np.ndarray]:
    """Raw 0-1 resilience and consistency pillars (persona-independent)."""
    neutral = float(cfg["missing_data"]["pillar_all_null"])
    numbers = frame.reindex(columns=[
        "DP", "dp_conf", "recovery_ratio", "unrecovered_penalty", "batting", "rank_stability",
    ]).apply(pd.to_numeric, errors="coerce").to_numpy(dtype=np.float64)
    dp, dp_conf, recovery, penalty, batting, stability = numbers.T
    dp_cfg = cfg["features"]["downside_participation"]
    conf = np.nan_to_num(dp_conf, nan=0.0)
    dp_score = conf / (1.0 + np.exp(np.clip(float(dp_cfg["k"]) * (dp - float(dp_cfg["tau"])), -80, 80))) + (1.0 - conf) * 0.5
    dp_score[np.isnan(dp)] = np.nan

    def pillar(columns: tuple[np.ndarray, ...], weights: Mapping[str, Any]) -> np.ndarray:
        value, missing = _weighted_average(np.column_stack(columns), np.array(list(map(float, weights.values()))), neutral)
        return np.where(missing, np.nan, value)

    features = cfg["pillar_features"]
    resilience = np.clip(pillar((dp_score, recovery), features["resilience"]) - np.nan_to_num(penalty, nan=0.0), 0, 1)
    return resilience, pillar((batting, stability), features["consistency"])


def _category_percentile(frame: pd.DataFrame, values: np.ndarray) -> np.ndarray:
    """0-1 percentile within the fund's own GOC short code (never across categories)."""
    series = pd.Series(values, index=frame.index, dtype="float64")
    valid = frame["status"].isin(("SCORED", "BUFFER")) & series.notna()
    groups = series[valid].groupby(frame.loc[valid, "goc_short_code"])
    n = groups.transform("count")
    percentile = ((groups.rank(method="average") - 0.5) / n).where(n.ne(1), 0.5)
    result = np.full(len(frame), np.nan)
    result[valid.to_numpy()] = percentile.to_numpy()
    return result


def suitability_components(frame: pd.DataFrame, cfg: Mapping[str, Any]) -> pd.DataFrame:
    """The five owner components as within-category percentiles (`comp_*`, 0-1)."""
    resilience, consistency = _resilience_consistency(frame, cfg)
    raw = frame.reindex(columns=["rank_momentum_raw", "aum_log_raw", "history_months"]).apply(
        pd.to_numeric, errors="coerce"
    ).to_numpy(dtype=np.float64)
    values = {
        "consistency": consistency, "rank_momentum": raw[:, 0], "resilience": resilience,
        "aum": raw[:, 1], "age": raw[:, 2],
    }
    return pd.DataFrame(
        {f"comp_{name}": _category_percentile(frame, values[name]) for name in cfg["suitability_components"]},
        index=frame.index,
    ).astype("float32")


def buffer_scores(scores: pd.DataFrame, cfg: Mapping[str, Any]) -> pd.Series:
    """Liquid buffer ranking score: weighted within-category components."""
    weights = cfg["basket"]["buffer"]["weights"]
    values = scores.reindex(columns=[f"comp_{name}" for name in weights]).to_numpy(dtype=np.float64)
    score, _ = _weighted_average(
        values, np.array(list(map(float, weights.values()))), float(cfg["missing_data"]["pillar_all_null"])
    )
    return pd.Series(score, index=scores.index, name="buffer_score", dtype="float32")


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
    """Eight persona suitability scores per fund with broadcast NumPy maths.

    suitability = 100 x weighted average of the within-category components, using each
    persona's owner weights; a missing component is dropped and the rest renormalised.
    The fund-card match score is the suitability capped by the persona-level gates.
    """
    frame = features.copy().reset_index(drop=True)
    personas = list(cfg["personas"])
    names = list(cfg["suitability_components"])
    n, p = len(frame), len(personas)
    neutral = float(cfg["missing_data"]["pillar_all_null"])

    components = suitability_components(frame, cfg)
    values = components[[f"comp_{name}" for name in names]].to_numpy(dtype=np.float64)
    weights = np.array([
        [float(cfg["personas"][code]["suitability"].get(name, 0.0)) for name in names] for code in personas
    ])
    present = ~np.isnan(values)
    denominator = present.astype(np.float64) @ weights.T
    numerator = np.nan_to_num(values, nan=0.0) @ weights.T
    suitability = 100.0 * np.divide(numerator, denominator, out=np.full((n, p), neutral), where=denominator > 0)
    low_confidence = ~present.all(axis=1)

    history = pd.to_numeric(frame["history_months"], errors="coerce").fillna(0).to_numpy(dtype=np.float64)[:, None]
    grades = pd.to_numeric(frame["grade"], errors="coerce").to_numpy(dtype=np.float64)[:, None]
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
    history_caps = np.where(
        history < int(persona_gates["history_under_months"]), int(persona_gates["history_under_12m_cap"]), 100
    )
    cap = np.minimum(np.minimum(grade_caps, complex_caps), history_caps)
    scores = np.floor(np.minimum(suitability, cap) + 0.5 + 1e-9).astype(np.int16)
    status_scored = frame["status"].eq("SCORED").to_numpy()

    gates = np.full((n, p), None, dtype=object)
    for gate_code, candidate in reversed((("GRADE_OVER", grade_caps), ("COMPLEX", complex_caps), ("HISTORY", history_caps))):
        gates[(candidate == cap) & (candidate < 100)] = gate_code

    positive_codes = np.array([cfg["reasons"]["positive"][name]["code"] for name in names])
    negative_codes = np.array([cfg["reasons"]["negative"][name]["code"] for name in names])
    threshold = float(cfg["reasons"]["min_contribution"])
    centred = np.nan_to_num(values, nan=0.5) - 0.5
    output = pd.concat([frame, components], axis=1)
    audit_parts: list[pd.DataFrame] = []
    for index, code in enumerate(personas):
        contribution = weights[index] * centred
        output[f"suit_{code}"] = np.where(status_scored, suitability[:, index], np.nan).astype("float32")
        output[f"score_{code}"] = pd.array(np.where(status_scored, scores[:, index], np.nan), dtype="Int8")
        output[f"gate_{code}"] = np.where(status_scored, gates[:, index], None)
        output[f"pos_reasons_{code}"] = _reason_lists(contribution, positive_codes, True, threshold)
        output[f"neg_reasons_{code}"] = _reason_lists(contribution, negative_codes, False, threshold)
        audit_parts.append(pd.DataFrame({
            "scheme_code": output["scheme_code"], "persona_code": code,
            **{f"comp_{name}": values[:, j] for j, name in enumerate(names)},
            "suitability": suitability[:, index], "cap": cap[:, index],
            "score": np.where(status_scored, scores[:, index], np.nan),
            "persona_gate": gates[:, index], "low_confidence": low_confidence,
            "history_months": history[:, 0], "status": frame["status"],
        }))

    output["low_confidence"] = low_confidence
    output["aum_pct"] = pd.to_numeric(output.get("aum"), errors="coerce").astype("float32")
    output["sip_3y_pct"] = pd.to_numeric(output.get("sip_3y"), errors="coerce").astype("float32")
    return output, pd.concat(audit_parts, ignore_index=True)


def _inherit_primary_scores(scores: pd.DataFrame, cfg: Mapping[str, Any]) -> pd.DataFrame:
    result = scores.copy()
    inheriting = result["status"].eq("INHERIT")
    if not inheriting.any():
        return result
    columns = [
        column for column in result.columns
        if column.startswith(("score_", "suit_", "gate_", "pos_reasons_", "neg_reasons_"))
    ] + ["low_confidence"]
    primary = result.set_index(result["scheme_code"].astype(str))[columns]
    mapped = primary.reindex(result.loc[inheriting, "primary_scheme_code"].astype(str)).set_axis(result.index[inheriting])
    result.loc[inheriting, columns] = mapped
    result.loc[inheriting & result[[c for c in columns if c.startswith("score_")]].notna().any(axis=1), "status"] = "SCORED"
    return result


def score_frames(
    schemes: pd.DataFrame,
    events: pd.DataFrame,
    snapshots: pd.DataFrame,
    as_of_date: str,
    cfg: Mapping[str, Any],
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Persona suitability scores, buffer score and audit rows for an already-screened scheme frame."""
    features = build_feature_frame(schemes, events, snapshots, as_of_date, cfg)
    scores, audit = score_features(features, cfg)
    scores["buffer_score"] = buffer_scores(scores, cfg)
    scores = _inherit_primary_scores(scores, cfg)
    meta = cfg["meta"]
    for frame in (scores, audit):
        frame["config_version"] = meta["config_version"]
        frame["method_version"] = meta["method_version"]
        frame["as_of_date"] = str(as_of_date)
    return scores.sort_values("scheme_code", kind="mergesort").reset_index(drop=True), audit.sort_values(
        ["scheme_code", "persona_code"], kind="mergesort"
    ).reset_index(drop=True)


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


SCREENING_COLUMNS = [
    "scheme_code", "name", "amc", "goc_short_code", "rank_now", "rank_total_now",
    "nse_purchase_allowed", "nse_sip_allowed", "screen_reason", "shortlisted",
]


def _output_columns(scores: pd.DataFrame) -> list[str]:
    def starting(*prefixes: str) -> list[str]:
        return [column for column in scores.columns if column.startswith(prefixes)]

    return [
        "scheme_code", "name", "amc_code", "goc_short_code", "slots", "grade", "role", "complex",
        "history_months", "status",
        *starting("score_", "suit_", "gate_", "pos_reasons_", "neg_reasons_"),
        *starting("comp_"), "rank_momentum_raw",
        "aum_pct", "sip_3y_pct", "rank_latest", "rank_total_latest", "rank_now_pct", "momentum_pass",
        "buffer_score", "min_sip_amount", "sip_allowed", "holdings", "low_confidence",
        "config_version", "method_version", "as_of_date",
    ]


def _payload(output: pd.DataFrame, as_of: str, cfg: Mapping[str, Any]) -> bytes:
    """Node-readable JSON: shortlisted rows, fixed listing positions and the user-adjustment rules."""
    return json.dumps({
        "schema_version": "2.0",
        "as_of_date": str(as_of),
        "config_version": cfg["meta"]["config_version"],
        "method_version": cfg["meta"]["method_version"],
        "user_adjustment": {
            **cfg["user_adjustment"],
            "gates": cfg["gates"]["user_level"],
            "bands": cfg["bands"],
            "recommend_floor": cfg["recommend_floor"],
            "basket_min_score": cfg["basket_min_score"],
            "momentum_filter": cfg["momentum_filter"],
            "basket": cfg["basket"],
            "reasons": cfg["reasons"],
            "willingness_by_persona": {
                code: persona["willingness_grade"] for code, persona in cfg["personas"].items()
            },
        },
        # Fixed listing positions: persona -> amount band -> best fund per slot category.
        "positions": persona_positions(output, cfg),
        "rows": json.loads(output.to_json(orient="records", date_format="iso")),
    }, separators=(",", ":"), sort_keys=True).encode("utf-8")


def run(args: argparse.Namespace) -> None:
    cfg = load_config(args.config)
    sources = load_sources(cfg, dict(item.split("=", 1) for item in args.source or []))
    screened = screen(sources["fund_cards"], cfg)
    scores, audit = score_frames(*build_inputs(screened, sources, args.as_of, cfg), args.as_of, cfg)
    LOGGER.info("persona-scored %d shortlisted schemes: %s", len(scores), scores["status"].value_counts().to_dict())
    LOGGER.info(
        "shortlist coverage: AUM %d, fund age %d, 36m batting %d, stress events %d, SIP allowed %d",
        int(scores["aum"].notna().sum()), int(scores["history_months"].notna().sum()),
        int(pd.to_numeric(scores["batting_36_window"], errors="coerce").gt(0).sum()),
        int(scores["dp_events"].fillna(0).gt(0).sum()), int(scores["sip_allowed"].sum()),
    )

    outputs = cfg["outputs"]

    # Basket slots each fund can fill; listings only show funds from the persona's slots.
    scores["slots"] = eligible_slots(scores, cfg)
    output = scores.reindex(columns=_output_columns(scores))
    files = {
        "shortlisted_schemes.parquet": _parquet_bytes(output),
        "shortlisted_schemes.json": _payload(output, args.as_of, cfg),
        "screening.parquet": _parquet_bytes(screened.reindex(columns=SCREENING_COLUMNS).assign(as_of_date=str(args.as_of))),
    }
    for folder in (f"{outputs['prefix']}/as_of={args.as_of}", f"{outputs['prefix']}/latest"):
        for name, content in files.items():
            _write_bytes(args.output, f"{folder}/{name}", content)
    _write_bytes(args.output, f"{outputs['prefix']}/as_of={args.as_of}/audit.parquet", _parquet_bytes(audit))
    legacy = outputs.get("legacy_scores_prefix")
    if legacy:  # the upload service still reads personality_match/latest/scores.json
        _write_bytes(args.output, f"{legacy}/latest/scores.json", files["shortlisted_schemes.json"])
        _write_bytes(args.output, f"{legacy}/latest/scores.parquet", files["shortlisted_schemes.parquet"])


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__)
    result.add_argument(
        "--as-of",
        default=os.getenv("PM_AS_OF", date.today().isoformat()),
        help="scoring date in YYYY-MM-DD format; defaults to today's UTC job date",
    )
    result.add_argument(
        "--source", action="append", metavar="NAME=URI",
        help="override a configured source, e.g. fund_cards=./fund_cards.parquet (repeatable); "
             "env PM_SRC_<NAME> works too",
    )
    result.add_argument(
        "--output",
        default=f"gs://{os.getenv('PM_OUTPUT_BUCKET', 'mf-data-public')}",
        help="local output directory or gs:// bucket/prefix",
    )
    result.add_argument("--config", default=os.getenv("PM_CONFIG_URI", str(DEFAULT_CONFIG)))
    return result


if __name__ == "__main__":
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(levelname)s %(message)s")
    run(parser().parse_args())
