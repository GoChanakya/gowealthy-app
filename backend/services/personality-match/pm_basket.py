"""Pure, deterministic SIP basket construction from the scored fund universe."""

from __future__ import annotations

import json
import math
from collections import Counter
from typing import Any, Mapping

import numpy as np
import pandas as pd

from pm_lookup import capacity_context, score_frame


ROLE_ORDER = ("core", "growth", "satellite")


def amount_band(monthly_amount: int, cfg: Mapping[str, Any]) -> Mapping[str, Any] | None:
    return next(
        (
            band for band in cfg["amount_bands"]["bands"]
            if int(band["min"]) <= monthly_amount <= int(band["max"])
        ),
        None,
    )


def basket_plan(
    profile: Mapping[str, Any], cfg: Mapping[str, Any]
) -> dict[str, Any] | None:
    """Compute amount band, capacity-adjusted role weights, and slots."""
    amount = int(profile.get("monthly_amount", 0))
    band = amount_band(amount, cfg)
    if band is None:
        return None
    context = capacity_context(profile, cfg)
    persona = cfg["personas"][context["persona_code"]]
    basket = persona["basket"]
    weights = {role: float(basket[role]) for role in ROLE_ORDER}

    if not persona["complex_access"]:
        weights["growth"] += weights["satellite"]
        weights["satellite"] = 0.0
    satellite_cap = float(band["satellite_cap"])
    if weights["satellite"] > satellite_cap:
        weights["growth"] += weights["satellite"] - satellite_cap
        weights["satellite"] = satellite_cap

    beta = context["beta"]
    freed = (weights["growth"] + weights["satellite"]) * beta
    weights["growth"] *= 1.0 - beta
    weights["satellite"] *= 1.0 - beta
    weights["core"] += freed

    allowed = set(band["roles"])
    if "satellite" not in allowed:
        destination = "growth" if "growth" in allowed else "core"
        weights[destination] += weights["satellite"]
        weights["satellite"] = 0.0
    if "growth" not in allowed:
        weights["core"] += weights["growth"]
        weights["growth"] = 0.0

    minimum = int(cfg["amount_bands"]["min_per_fund"])
    count = min(int(band["funds"]), amount // minimum)
    quotas = np.array([count * weights[role] for role in ROLE_ORDER], dtype=float)
    slots_array = np.floor(quotas).astype(int)
    remaining = count - int(slots_array.sum())
    fractional = quotas - slots_array
    tie_order = np.lexsort((np.arange(len(ROLE_ORDER)), -fractional))
    for index in tie_order[:remaining]:
        slots_array[index] += 1
    if count and slots_array[0] == 0:
        donor = max(range(1, len(ROLE_ORDER)), key=lambda index: (slots_array[index], -index))
        if slots_array[donor] > 0:
            slots_array[donor] -= 1
            slots_array[0] += 1
    return {
        "band": band["code"],
        "funds": count,
        "weights": weights,
        "slots": dict(zip(ROLE_ORDER, map(int, slots_array))),
        "context": context,
    }


def _holdings(value: Any) -> dict[str, float] | None:
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except json.JSONDecodeError:
            return None
    if isinstance(value, Mapping):
        return {str(key): float(weight) for key, weight in value.items()}
    return None


def _overlap(left: Any, right: Any) -> float | None:
    a, b = _holdings(left), _holdings(right)
    if not a or not b:
        return None
    return sum(min(weight, b[isin]) for isin, weight in a.items() if isin in b)


def _can_pick(
    candidate: pd.Series,
    picked: list[pd.Series],
    category_limit: int,
    cfg: Mapping[str, Any],
) -> bool:
    rules = cfg["basket_rules"]["diversification"]
    categories = Counter(str(row["goc_short_code"]) for row in picked)
    amcs = Counter(str(row["amc_code"]) for row in picked)
    category = str(candidate["goc_short_code"])
    if categories[category] >= category_limit:
        return False
    if category.startswith("EQ-IDX-") and categories[category] >= 1:
        return False
    if amcs[str(candidate["amc_code"])] >= int(rules["max_per_amc"]):
        return False
    overlap_limit = float(rules["max_holdings_overlap_pct"])
    return all(
        overlap is None or overlap <= overlap_limit
        for overlap in (_overlap(candidate.get("holdings"), row.get("holdings")) for row in picked)
    )


def _sorted_pool(frame: pd.DataFrame) -> pd.DataFrame:
    return frame.sort_values(
        ["user_score", "sip_3y_pct", "aum_pct", "scheme_code"],
        ascending=[False, False, False, True],
        na_position="last",
        kind="mergesort",
    )


def _pick_from_pool(
    pool: pd.DataFrame,
    count: int,
    picked: list[pd.Series],
    cfg: Mapping[str, Any],
) -> list[pd.Series]:
    chosen: list[pd.Series] = []
    first_limit = int(cfg["basket_rules"]["diversification"]["max_per_category_first_pass"])
    final_limit = int(cfg["basket_rules"]["diversification"]["max_per_category"])
    for category_limit in (first_limit, final_limit):
        for _, candidate in pool.iterrows():
            if len(chosen) >= count:
                break
            if any(str(row["scheme_code"]) == str(candidate["scheme_code"]) for row in picked + chosen):
                continue
            if _can_pick(candidate, picked + chosen, category_limit, cfg):
                chosen.append(candidate)
        if len(chosen) >= count:
            break
    return chosen


def _apply_special_slots(
    picked: list[pd.Series],
    eligible: pd.DataFrame,
    plan: Mapping[str, Any],
    cfg: Mapping[str, Any],
) -> list[pd.Series]:
    persona_code = plan["context"]["persona_code"]
    basket = cfg["personas"][persona_code]["basket"]
    count = int(plan["funds"])
    rising_rules = [rule for rule in basket.get("rising_star_slots", []) if count >= int(rule["min_funds"])]
    rising_slots = int(rising_rules[-1]["slots"]) if rising_rules else 0
    rise = cfg["basket_rules"]["rising_star"]
    rising = eligible.loc[
        pd.to_numeric(eligible["aum_pct"], errors="coerce").le(float(rise["max_aum_pct"]))
        & pd.to_numeric(eligible["track_record_years"], errors="coerce").ge(float(rise["min_track_record_years"]))
        & pd.to_numeric(eligible["rank_level"], errors="coerce").ge(float(rise["min_rank_level"]))
        & pd.to_numeric(eligible["rank_trend"], errors="coerce").ge(float(rise["min_rank_trend"]))
    ]
    turnaround_rules = [rule for rule in basket.get("turnaround_slots", []) if count >= int(rule["min_funds"])]
    turnaround_slots = int(turnaround_rules[-1]["slots"]) if turnaround_rules else 0
    turnaround = eligible.iloc[0:0]
    if turnaround_rules:
        turnaround = eligible.loc[
            pd.to_numeric(eligible["turnaround"], errors="coerce").ge(float(turnaround_rules[-1]["min_turnaround"]))
        ]

    result = list(picked)
    for pool, required in ((_sorted_pool(rising), rising_slots), (_sorted_pool(turnaround), turnaround_slots)):
        existing = sum(str(row["scheme_code"]) in set(pool["scheme_code"].astype(str)) for row in result)
        for _, candidate in pool.iterrows():
            if existing >= required:
                break
            if any(str(row["scheme_code"]) == str(candidate["scheme_code"]) for row in result):
                continue
            replaceable = [
                index for index, row in enumerate(result)
                if row["role"] in ("growth", "core") and str(row["scheme_code"]) not in set(pool["scheme_code"].astype(str))
            ]
            replaceable.sort(key=lambda index: (float(result[index]["user_score"]), result[index]["role"] != "growth"))
            if replaceable and _can_pick(candidate, [row for index, row in enumerate(result) if index != replaceable[0]], 2, cfg):
                result[replaceable[0]] = candidate
                existing += 1
    return result


def _allocate(
    picked: list[pd.Series], amount: int, weights: Mapping[str, float], cfg: Mapping[str, Any]
) -> list[dict[str, Any]]:
    minimum = int(cfg["amount_bands"]["min_per_fund"])
    step = int(cfg["basket_rules"]["amount_rounding"])
    current = list(picked)
    while current:
        counts = Counter(str(row["role"]) for row in current)
        active_weight = sum(float(weights[role]) for role in counts)
        allocations: dict[str, int] = {}
        for role, count in counts.items():
            role_amount = amount * float(weights[role]) / active_weight
            each = math.floor((role_amount / count) / step) * step
            for row in current:
                if row["role"] == role:
                    allocations[str(row["scheme_code"])] = each
        remainder = amount - sum(allocations.values())
        recipient = next((row for row in current if row["role"] == "core"), current[0])
        allocations[str(recipient["scheme_code"])] += remainder
        invalid = [
            row for row in current
            if allocations[str(row["scheme_code"])] < max(
                minimum,
                int(row.get("min_sip_amount") or minimum) if not pd.isna(row.get("min_sip_amount")) else minimum,
            )
        ]
        if not invalid:
            return [
                {"scheme_code": str(row["scheme_code"]), "role": str(row["role"]), "amount": allocations[str(row["scheme_code"])]}
                for row in current
            ]
        smallest_role = min(counts, key=lambda role: (float(weights[role]) / counts[role], ROLE_ORDER.index(role)))
        candidates = [row for row in current if row["role"] == smallest_role]
        drop = min(candidates or invalid, key=lambda row: (float(row["user_score"]), str(row["scheme_code"])))
        current.pop(next(index for index, row in enumerate(current) if row is drop))
    return []


def build_basket(
    scores_df: pd.DataFrame, profile: Mapping[str, Any], cfg: Mapping[str, Any]
) -> list[dict[str, Any]]:
    """Build a diversified basket. A short pool returns fewer funds, never weaker funds."""
    plan = basket_plan(profile, cfg)
    if plan is None or not plan["funds"]:
        return []
    adjusted, _ = score_frame(scores_df, profile, cfg)
    eligible = adjusted.loc[
        adjusted["status"].eq("SCORED")
        & pd.to_numeric(adjusted["user_score"], errors="coerce").ge(int(cfg["basket_min_score"]))
        & adjusted["auto_recommend"].fillna(True).astype(bool)
        & adjusted["role"].isin([role for role, count in plan["slots"].items() if count])
    ].copy()
    if eligible.empty:
        return []

    persona_code = plan["context"]["persona_code"]
    basket = cfg["personas"][persona_code]["basket"]
    rise = cfg["basket_rules"]["rising_star"]
    eligible["is_rising_star"] = (
        pd.to_numeric(eligible["aum_pct"], errors="coerce").le(float(rise["max_aum_pct"]))
        & pd.to_numeric(eligible["track_record_years"], errors="coerce").ge(float(rise["min_track_record_years"]))
        & pd.to_numeric(eligible["rank_level"], errors="coerce").ge(float(rise["min_rank_level"]))
        & pd.to_numeric(eligible["rank_trend"], errors="coerce").ge(float(rise["min_rank_trend"]))
    )

    picked: list[pd.Series] = []
    for role in ROLE_ORDER:
        pool = eligible.loc[eligible["role"].eq(role)]
        if role == "core":
            if persona_code in rise["excluded_from_core_for"]:
                pool = pool.loc[~pool["is_rising_star"]]
            if basket.get("core_min_aum_pct") is not None:
                pool = pool.loc[pd.to_numeric(pool["aum_pct"], errors="coerce").ge(float(basket["core_min_aum_pct"]))]
        picked.extend(_pick_from_pool(_sorted_pool(pool), int(plan["slots"][role]), picked, cfg))

    shortfall = int(plan["funds"]) - len(picked)
    for role in ("core", "growth"):
        if shortfall <= 0:
            break
        pool = _sorted_pool(eligible.loc[eligible["role"].eq(role)])
        additions = _pick_from_pool(pool, shortfall, picked, cfg)
        picked.extend(additions)
        shortfall -= len(additions)

    picked = _apply_special_slots(picked, eligible, plan, cfg)
    return _allocate(picked, int(profile["monthly_amount"]), plan["weights"], cfg)
