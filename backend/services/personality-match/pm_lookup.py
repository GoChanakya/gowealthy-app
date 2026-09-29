"""Pure per-user adjustment functions for precomputed persona scores."""

from __future__ import annotations

import math
from typing import Any, Mapping

import numpy as np
import pandas as pd


def round_half_up(value: float) -> int:
    return math.floor(float(value) + 0.5 + 1e-9)


def _first_match(value: float, rows: list[dict[str, Any]], key: str) -> dict[str, Any]:
    for row in rows:
        if value <= float(row[key]):
            return row
    raise ValueError(f"no configured upper band contains {value}")


def capacity_context(profile: Mapping[str, Any], cfg: Mapping[str, Any]) -> dict[str, Any]:
    """Return capacity points, tier, blend beta, horizon, and allowed grade."""
    persona_code = profile.get("persona_code", profile.get("persona"))
    if persona_code not in cfg["personas"]:
        raise ValueError(f"unknown persona_code: {persona_code!r}")
    if profile.get("age") is None or profile.get("living") is None:
        raise ValueError("profile.age and profile.living are required")

    adjustment = cfg["user_adjustment"]
    neutral = int(adjustment["missing_field_points"])
    age = int(profile["age"])
    age_band = next(
        (row for row in adjustment["age_bands"] if int(row["min"]) <= age <= int(row["max"])),
        None,
    )
    if age_band is None:
        raise ValueError(f"age {age} is outside configured age bands")

    points = int(age_band["points"])
    capacity = adjustment["capacity_points"]
    emi_ratio = profile.get("emi_ratio_pct")
    living = profile["living"]
    if living not in capacity["living"]:
        raise ValueError(f"unknown living value: {living!r}")
    if emi_ratio is None:
        points += int(capacity["living"].get(living, neutral))
    else:
        if living != "own_emi":
            points += int(capacity["living"].get(living, neutral))
        points += int(_first_match(float(emi_ratio), capacity["emi_ratio_pct"], "max")["points"])

    spouse_income = profile.get("spouse_income")
    if spouse_income is not None:
        points += int(capacity["spouse_income"]["has" if spouse_income else "none"])
    dependents = profile.get("dependents_non_earning")
    if dependents is not None:
        points += int(_first_match(float(dependents), capacity["dependents_non_earning"], "max")["points"])
    emergency = profile.get("emergency_fund")
    if emergency is not None:
        if emergency not in capacity["emergency_fund"]:
            raise ValueError(f"unknown emergency_fund value: {emergency!r}")
        points += int(capacity["emergency_fund"][emergency])
    insured = profile.get("health_insurance")
    if insured is not None:
        points += int(capacity["health_insurance"]["has" if insured else "none"])

    tier = next(row for row in adjustment["capacity_tiers"] if points >= int(row["min_points"]))
    horizon_years = float(profile.get("horizon_years", age_band["default_horizon_years"]))
    horizon_grade = next(
        int(row["grade"])
        for row in adjustment["horizon"]["grade_by_years"]
        if horizon_years >= float(row["min_years"])
    )
    persona = cfg["personas"][persona_code]
    loss_penalty = (
        int(cfg["gates"]["user_level"]["loss_reaction_sell_grade_penalty"])
        if profile.get("loss_reaction") == "sell"
        else 0
    )
    willing = int(persona["willingness_grade"]) - loss_penalty
    minimum = int(cfg["gates"]["user_level"]["min_allowed_grade"])
    allowed = max(minimum, min(willing, int(tier["capacity_grade"]), horizon_grade))
    return {
        "persona_code": persona_code,
        "points": points,
        "tier": int(tier["tier"]),
        "beta": float(tier["beta"]),
        "capacity_grade": int(tier["capacity_grade"]),
        "horizon_years": horizon_years,
        "horizon_grade": horizon_grade,
        "willingness_grade": willing,
        "allowed_grade": allowed,
    }


def _band(score: int, cfg: Mapping[str, Any]) -> dict[str, str]:
    row = next(row for row in cfg["bands"] if score >= int(row["min"]))
    return {"code": row["code"], "label": row["label"]}


def _reason_for_code(code: str, cfg: Mapping[str, Any]) -> dict[str, str] | None:
    for group in ("positive", "negative", "gate"):
        for entry in cfg["reasons"][group].values():
            if entry["code"] == code:
                return {"code": entry["code"], "text": entry["text"]}
    return None


def _resolved_gate(stored_gate: Any) -> str | None:
    return {
        "GRADE_OVER": "RISKIER_THAN_YOU",
        "COMPLEX": "NICHE_BET",
        "HISTORY": "TOO_NEW",
    }.get(stored_gate)


def user_match(
    row: Mapping[str, Any], profile: Mapping[str, Any], cfg: Mapping[str, Any]
) -> dict[str, Any]:
    """Adjust one wide score row for a user and return the card match object."""
    status = row.get("status")
    if status != "SCORED":
        return {"score": None, "band": None, "reasons": [], "status": status, "user_gate": None}

    context = capacity_context(profile, cfg)
    persona_code = context["persona_code"]
    anchor = cfg["user_adjustment"]["blend_anchor_persona"]
    persona_score = row.get(f"score_{persona_code}")
    anchor_score = row.get(f"score_{anchor}")
    if pd.isna(persona_score) or pd.isna(anchor_score):
        return {"score": None, "band": None, "reasons": [], "status": status, "user_gate": None}

    beta = context["beta"]
    raw = (1.0 - beta) * float(persona_score) + beta * float(anchor_score)
    over = int(row["grade"]) - context["allowed_grade"]
    gates = cfg["gates"]["user_level"]
    cap = (
        int(gates["grade_over_by_2plus_cap"])
        if over >= 2
        else int(gates["grade_over_by_1_cap"])
        if over == 1
        else 100
    )
    score = round_half_up(min(raw, cap))
    if cap < raw:
        user_gate = "SAFETY_FIRST" if context["allowed_grade"] < context["willingness_grade"] else "RISKIER_THAN_YOU"
    else:
        user_gate = _resolved_gate(row.get(f"gate_{persona_code}"))

    reason_codes: list[str] = []
    if user_gate:
        reason_codes.append(user_gate)
    source = row.get(f"{'pos' if score >= int(cfg['basket_min_score']) else 'neg'}_reasons_{persona_code}", [])
    if isinstance(source, np.ndarray):
        source = source.tolist()
    if not isinstance(source, (list, tuple)):
        source = []
    for code in source:
        if code not in reason_codes:
            reason_codes.append(code)
        if len(reason_codes) >= int(cfg["reasons"]["max"]):
            break
    reasons = [item for code in reason_codes if (item := _reason_for_code(code, cfg)) is not None]
    return {
        "score": score,
        "band": _band(score, cfg),
        "reasons": reasons,
        "status": status,
        "user_gate": user_gate,
        "recommended": score >= int(cfg["recommend_floor"]),
    }


def score_frame(
    scores_df: pd.DataFrame, profile: Mapping[str, Any], cfg: Mapping[str, Any]
) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Vectorise the numeric user adjustment across an entire score table."""
    context = capacity_context(profile, cfg)
    persona = context["persona_code"]
    anchor = cfg["user_adjustment"]["blend_anchor_persona"]
    result = scores_df.copy()
    raw = (
        (1.0 - context["beta"]) * pd.to_numeric(result[f"score_{persona}"], errors="coerce")
        + context["beta"] * pd.to_numeric(result[f"score_{anchor}"], errors="coerce")
    )
    over = pd.to_numeric(result["grade"], errors="coerce") - context["allowed_grade"]
    gates = cfg["gates"]["user_level"]
    caps = np.select(
        [over >= 2, over == 1],
        [int(gates["grade_over_by_2plus_cap"]), int(gates["grade_over_by_1_cap"])],
        default=100,
    )
    scored = result["status"].eq("SCORED") & raw.notna()
    adjusted = np.floor(np.minimum(raw.to_numpy(dtype=float), caps) + 0.5 + 1e-9)
    result["user_score"] = pd.array(np.where(scored, adjusted, np.nan), dtype="Int8")
    result["user_gate"] = np.where(
        scored & (caps < raw.to_numpy(dtype=float)),
        "SAFETY_FIRST" if context["allowed_grade"] < context["willingness_grade"] else "RISKIER_THAN_YOU",
        None,
    )
    return result, context


def rank_funds(
    scores_df: pd.DataFrame,
    profile: Mapping[str, Any],
    cfg: Mapping[str, Any],
    *,
    recommended_only: bool = True,
) -> pd.DataFrame:
    """Return the persona-adjusted fund listing in deterministic recommendation order."""
    adjusted, _ = score_frame(scores_df, profile, cfg)
    listing = adjusted.loc[
        adjusted["status"].eq("SCORED") & adjusted["user_score"].notna()
    ].copy()
    listing["recommended"] = listing["user_score"].ge(int(cfg["recommend_floor"]))
    if recommended_only:
        listing = listing.loc[listing["recommended"]]
    matches = [user_match(row, profile, cfg) for _, row in listing.iterrows()]
    listing["personality_match"] = matches
    return listing.sort_values(
        ["user_score", "sip_3y_pct", "aum_pct", "scheme_code"],
        ascending=[False, False, False, True],
        na_position="last",
        kind="mergesort",
    ).reset_index(drop=True)


def resolve_primary(scores_df: pd.DataFrame, scheme_code: str) -> Mapping[str, Any] | None:
    """Resolve a non-primary plan to its primary score row."""
    matches = scores_df.loc[scores_df["scheme_code"].astype(str).eq(str(scheme_code))]
    if matches.empty:
        return None
    row = matches.iloc[0]
    primary = row.get("primary_scheme_code")
    if row.get("status") == "INHERIT" and pd.notna(primary):
        primary_rows = scores_df.loc[scores_df["scheme_code"].astype(str).eq(str(primary))]
        return None if primary_rows.empty else primary_rows.iloc[0]
    return row
