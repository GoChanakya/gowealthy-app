"""Pure, deterministic slot-based SIP basket construction from the scored fund universe.

Each persona has a fixed slot template per number of schemes (the owner's "tier":
5/6/7), ordered lowest risk first by `basket.risk_order`; smaller tiers take the first N
(lowest-risk) slots of the smallest template. Every slot is filled with the fund of its
own category that has the highest suitability score for the persona, after the hard
filters (primary plan, top half of category by latest rank, persona and category minimum
age, minimum SIP affordable, one fund per AMC).
Amounts are split equally. A short pool returns fewer funds, never weaker ones.
"""

from __future__ import annotations

import json
from typing import Any, Mapping

import numpy as np
import pandas as pd


CANDIDATE_COLUMNS = ["scheme_code", "amc_code", "goc_short_code", "holdings", "min_sip_amount"]


def _persona_code(profile: Mapping[str, Any], cfg: Mapping[str, Any]) -> str:
    code = profile.get("persona_code", profile.get("persona"))
    if code not in cfg["basket"]["personas"]:
        raise ValueError(f"unknown persona_code: {code!r}")
    return code


def amount_band(monthly_amount: int, cfg: Mapping[str, Any]) -> Mapping[str, Any] | None:
    return next(
        (
            band for band in cfg["basket"]["amount_bands"]
            if int(band["min"]) <= monthly_amount <= int(band["max"])
        ),
        None,
    )


def _equal_share(amount: int, count: int, step: int) -> int:
    return (amount // count) // step * step if count else 0


def basket_plan(profile: Mapping[str, Any], cfg: Mapping[str, Any]) -> dict[str, Any] | None:
    """Return the amount band, fund count, ordered slot list and per-fund amount."""
    amount = int(profile.get("monthly_amount") or 0)
    band = amount_band(amount, cfg)
    if band is None:
        return None
    persona = _persona_code(profile, cfg)
    basket = cfg["basket"]
    count = min(int(band["funds"]), amount // int(basket["min_per_fund"]))
    risk = {slot: index for index, slot in enumerate(basket["risk_order"])}
    templates = {
        int(size): sorted(slots, key=risk.__getitem__)
        for size, slots in basket["personas"][persona]["templates"].items()
    }
    if count in templates:
        slots = list(templates[count])
    elif count < min(templates):
        slots = list(templates[min(templates)][:count])
    else:
        slots = list(templates[max(templates)])
    return {
        "band": band["code"],
        "persona_code": persona,
        "funds": len(slots),
        "slots": slots,
        "per_fund_amount": _equal_share(amount, len(slots), int(basket["amount_rounding"])),
    }


def _min_sip(frame: pd.DataFrame, cfg: Mapping[str, Any]) -> pd.Series:
    floor = int(cfg["basket"]["min_per_fund"])
    return pd.to_numeric(frame["min_sip_amount"], errors="coerce").fillna(floor).clip(lower=floor)


def required_age(frame: pd.DataFrame, persona_min_age: int, cfg: Mapping[str, Any]) -> pd.Series:
    """Months since launch a fund needs: the persona minimum or its category's, if higher."""
    category_min = frame["goc_short_code"].map(
        {code: category.get("min_age_months", 0) for code, category in cfg["categories"].items()}
    )
    return category_min.fillna(0).clip(lower=int(persona_min_age))


def _eligible(
    frame: pd.DataFrame, status: str, min_age: int, max_sip: int, cfg: Mapping[str, Any]
) -> pd.DataFrame:
    momentum = frame["momentum_pass"].astype("boolean").fillna(False).astype(bool)
    history = pd.to_numeric(frame["history_months"], errors="coerce")
    mask = frame["status"].eq(status) & momentum & history.ge(required_age(frame, min_age, cfg)) & _min_sip(frame, cfg).le(max_sip)
    if cfg["basket"].get("require_sip_allowed"):
        mask &= frame["sip_allowed"].astype("boolean").fillna(False).astype(bool)
    return frame.loc[mask]


def slot_mask(frame: pd.DataFrame, slot: Mapping[str, Any]) -> pd.Series:
    """Funds whose category (and, if configured, scheme name) fits the slot."""
    categories = frame["goc_short_code"].astype("string").fillna("")
    mask = categories.isin(slot.get("codes", []))
    for prefix in slot.get("prefixes", []):
        mask |= categories.eq(prefix) | categories.str.startswith(f"{prefix}-")
    if slot.get("name_include") or slot.get("name_exclude"):
        names = frame.get("name", pd.Series("", index=frame.index)).astype("string").fillna("")
        if slot.get("name_include"):
            mask &= names.str.contains(slot["name_include"], case=False, regex=True)
        if slot.get("name_exclude"):
            mask &= ~names.str.contains(slot["name_exclude"], case=False, regex=True)
    return mask.fillna(False).astype(bool)


def eligible_slots(frame: pd.DataFrame, cfg: Mapping[str, Any]) -> list[list[str]]:
    """Basket slots each fund can fill, persona-independent (empty for buffer funds)."""
    slots = cfg["basket"]["slots"]
    names = list(slots)
    masks = np.column_stack([slot_mask(frame, slots[name]).to_numpy() for name in names])
    return [[names[i] for i in np.flatnonzero(row)] for row in masks]


def persona_slots(persona_code: str, cfg: Mapping[str, Any]) -> set[str]:
    """Every slot used by any of the persona's basket templates."""
    templates = cfg["basket"]["personas"][persona_code]["templates"].values()
    return {slot for template in templates for slot in template}


def _ranked(pool: pd.DataFrame, score_column: str) -> list[dict[str, Any]]:
    ordered = pool.sort_values(
        [score_column, "aum_pct", "scheme_code"],
        ascending=[False, False, True],
        na_position="last",
        kind="mergesort",
    )
    return ordered.reindex(columns=CANDIDATE_COLUMNS + [score_column]).to_dict("records")


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
    candidate: Mapping[str, Any],
    slot: str,
    picked: list[dict[str, Any]],
    amc_cap: int,
    cfg: Mapping[str, Any],
) -> bool:
    rules = cfg["basket"]["diversification"]
    code = str(candidate["scheme_code"])
    if any(row["scheme_code"] == code for row in picked):
        return False
    amc = candidate.get("amc_code")
    if isinstance(amc, str) and amc:
        same_amc = [row for row in picked if row["amc_code"] == amc]
        if len(same_amc) >= amc_cap:
            return False
        if rules["distinct_amc_for_repeated_slot"] and any(row["slot"] == slot for row in same_amc):
            return False
    if cfg["basket"]["slots"][slot].get("distinct_category") and any(
        row["slot"] == slot and row["goc_short_code"] == candidate["goc_short_code"] for row in picked
    ):
        return False
    limit = float(rules["max_holdings_overlap_pct"])
    return all(
        overlap is None or overlap <= limit
        for overlap in (_overlap(candidate.get("holdings"), row["holdings"]) for row in picked)
    )


def _slot_rankings(
    pool: pd.DataFrame, slots: list[str], persona_code: str, cfg: Mapping[str, Any]
) -> dict[str, list[dict[str, Any]]]:
    """Each slot's own category pool, best first by the persona's suitability score."""
    return {
        slot: _ranked(pool.loc[slot_mask(pool, cfg["basket"]["slots"][slot])], f"suit_{persona_code}")
        for slot in dict.fromkeys(slots)
    }


def select_funds(
    scores_df: pd.DataFrame, plan: Mapping[str, Any], cfg: Mapping[str, Any]
) -> list[dict[str, Any]]:
    """Fill the plan's slots in order with the best eligible, diversified fund per slot."""
    basket = cfg["basket"]
    persona = basket["personas"][plan["persona_code"]]
    pool = _eligible(scores_df, "SCORED", int(persona["min_age_months"]), int(plan["per_fund_amount"]), cfg)
    if pool.empty:
        return []
    rules = basket["diversification"]
    amc_cap = int(
        rules["max_per_amc_small"] if plan["funds"] <= int(rules["small_basket_max_funds"]) else rules["max_per_amc"]
    )
    ranked_by_slot = _slot_rankings(pool, plan["slots"], plan["persona_code"], cfg)
    picked: list[dict[str, Any]] = []
    for slot in plan["slots"]:
        choice = next((row for row in ranked_by_slot[slot] if _can_pick(row, slot, picked, amc_cap, cfg)), None)
        if choice is not None:
            picked.append({
                "scheme_code": str(choice["scheme_code"]),
                "slot": slot,
                "goc_short_code": choice["goc_short_code"],
                "amc_code": choice["amc_code"],
                "holdings": choice["holdings"],
            })
    return picked


def select_buffer(
    scores_df: pd.DataFrame, monthly_amount: int, cfg: Mapping[str, Any]
) -> dict[str, Any] | None:
    """Pick the single best liquid fund for the buffer / emergency SIP."""
    rules = cfg["basket"]["buffer"]
    pool = _eligible(scores_df, "BUFFER", int(rules["min_age_months"]), monthly_amount, cfg)
    pool = pool.loc[pool["goc_short_code"].isin(rules["codes"])]
    if pool.empty:
        return None
    score = "buffer_score"
    best = pool.assign(_min_sip=_min_sip(pool, cfg)).sort_values(
        [score, "_min_sip", "aum_pct", "scheme_code"],
        ascending=[False, True, False, True],
        na_position="last",
        kind="mergesort",
    ).iloc[0]
    return {
        "scheme_code": str(best["scheme_code"]),
        "slot": "BUFFER",
        "goc_short_code": best["goc_short_code"],
        "amount": int(monthly_amount),
    }


def persona_positions(
    scores_df: pd.DataFrame, cfg: Mapping[str, Any], alternates: int = 2
) -> dict[str, dict[str, list[dict[str, Any]]]]:
    """Fixed fund positions per persona and SIP amount band, for listings.

    Each position is one slot of the persona's template, filled by the fund of that
    slot's own category with the best persona suitability (same rules as the basket). `alternates` are the next
    best funds of the same category, for "switch". Bands are evaluated at their
    minimum amount so every user in the band can afford each fund's minimum SIP.
    """
    slots = cfg["basket"]["slots"]
    result: dict[str, dict[str, list[dict[str, Any]]]] = {}
    for code in cfg["personas"]:
        persona = cfg["basket"]["personas"][code]
        result[code] = {}
        for band in cfg["basket"]["amount_bands"]:
            plan = basket_plan({"persona_code": code, "monthly_amount": int(band["min"])}, cfg)
            if not plan or not plan["funds"]:
                continue
            picked = select_funds(scores_df, plan, cfg)
            pool = _eligible(scores_df, "SCORED", int(persona["min_age_months"]), int(plan["per_fund_amount"]), cfg)
            ranked = _slot_rankings(pool, plan["slots"], plan["persona_code"], cfg)
            taken = {row["scheme_code"] for row in picked}
            result[code][band["code"]] = [
                {
                    "position": number,
                    "slot": row["slot"],
                    "label": slots[row["slot"]]["label"],
                    "scheme_code": row["scheme_code"],
                    "alternates": [
                        str(c["scheme_code"]) for c in ranked[row["slot"]] if str(c["scheme_code"]) not in taken
                    ][:alternates],
                }
                for number, row in enumerate(picked, 1)
            ]
    return result


def build_basket(
    scores_df: pd.DataFrame, profile: Mapping[str, Any], cfg: Mapping[str, Any]
) -> list[dict[str, Any]]:
    """Build the diversified SIP basket plus the optional buffer (liquid) SIP.

    The basket is goal-agnostic: units bought are pooled and allocated to goals
    downstream rather than mapping a scheme to a goal.
    """
    result: list[dict[str, Any]] = []
    plan = basket_plan(profile, cfg)
    if plan and plan["funds"]:
        picked = select_funds(scores_df, plan, cfg)
        if picked:
            amount = int(profile["monthly_amount"])
            each = _equal_share(amount, len(picked), int(cfg["basket"]["amount_rounding"]))
            remainder = amount - each * len(picked)
            result = [
                {
                    "scheme_code": row["scheme_code"],
                    "slot": row["slot"],
                    "goc_short_code": row["goc_short_code"],
                    "amount": each + (remainder if index == 0 else 0),
                }
                for index, row in enumerate(picked)
            ]
    buffer_amount = int(profile.get("buffer_monthly_amount") or 0)
    if buffer_amount:
        buffer = select_buffer(scores_df, buffer_amount, cfg)
        if buffer:
            result.append(buffer)
    return result
