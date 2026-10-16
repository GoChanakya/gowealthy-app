from pathlib import Path
import sys

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pm_batch import _snapshot_features, score_features
from pm_basket import basket_plan
from pm_config import load_config
from pm_lookup import capacity_context, rank_funds, user_match

PERSONAS = ["LLL", "LHL", "HLL", "HHL", "LHH", "LLH", "HLH", "HHH"]


@pytest.fixture(scope="module")
def cfg():
    return load_config()


def feature_row(code, category, *, batting, stability, dp, recovery, momentum, aum, history, grade=5):
    return {
        "scheme_code": code, "goc_short_code": category, "status": "SCORED", "grade": grade, "complex": False,
        "history_months": history, "DP": dp, "dp_conf": 1.0, "recovery_ratio": recovery,
        "unrecovered_penalty": 0.0, "batting": batting, "rank_stability": stability,
        "rank_momentum_raw": momentum, "aum_log_raw": aum,
    }


@pytest.fixture(scope="module")
def scored(cfg):
    # Flexi: F1 best on every component, F2 middle, F3 worst -> percentiles 5/6, 1/2, 1/6.
    # Multi: G1 better only on rank momentum; G2 better on everything else -> 3/4 vs 1/4.
    # Large: L1 alone in its category -> every component 0.5.
    features = pd.DataFrame([
        feature_row("F1", "EQS-FLX", batting=0.9, stability=0.9, dp=0.6, recovery=0.9, momentum=0.6, aum=10, history=120),
        feature_row("F2", "EQS-FLX", batting=0.6, stability=0.6, dp=1.0, recovery=0.5, momentum=0.4, aum=9, history=60),
        feature_row("F3", "EQS-FLX", batting=0.3, stability=0.3, dp=1.4, recovery=0.2, momentum=0.2, aum=8, history=30),
        feature_row("G1", "EQS-MUC", batting=0.3, stability=0.3, dp=1.4, recovery=0.2, momentum=0.6, aum=8, history=30),
        feature_row("G2", "EQS-MUC", batting=0.9, stability=0.9, dp=0.6, recovery=0.9, momentum=0.2, aum=10, history=120),
        feature_row("L1", "EQS-LRG", batting=0.5, stability=0.5, dp=1.0, recovery=0.5, momentum=0.4, aum=9, history=60),
    ])
    return score_features(features, cfg)


def test_owner_rank_momentum_example(cfg):
    # Owner's example: last three 6M ranks 11 -> 4 -> 3 of 20.
    # 50% x (1 - average 6 / 20) + 50% x climb (11 - 3) / 20 = 0.35 + 0.20 = 0.55
    snapshots = pd.DataFrame({
        "scheme_code": ["A"] * 3, "date": pd.to_datetime(["2026-07-31", "2026-08-31", "2026-09-30"]),
        "rank": [11, 4, 3], "total": [20, 20, 20],
    })
    assert _snapshot_features(snapshots, cfg).at["A", "rank_momentum_raw"] == pytest.approx(0.55)
    slipping = snapshots.assign(rank=[3, 4, 11])          # a fall counts against the fund
    assert _snapshot_features(slipping, cfg).at["A", "rank_momentum_raw"] == pytest.approx(0.35 - 0.20)


def test_components_are_percentiles_within_each_category(scored):
    scores, _ = scored
    rows = scores.set_index("scheme_code")
    components = ["comp_consistency", "comp_rank_momentum", "comp_resilience", "comp_aum", "comp_age"]
    assert rows.loc["F1", components].tolist() == pytest.approx([5 / 6] * 5)
    assert rows.loc["F3", components].tolist() == pytest.approx([1 / 6] * 5)
    assert rows.loc["L1", components].tolist() == pytest.approx([0.5] * 5)    # alone in its category
    assert rows.loc["G1", components].tolist() == pytest.approx([0.25, 0.75, 0.25, 0.25, 0.25])


def test_eight_suitability_scores_use_the_owner_weights(scored):
    scores, _ = scored
    rows = scores.set_index("scheme_code")
    assert [int(rows.at["F1", f"score_{code}"]) for code in PERSONAS] == [83] * 8
    assert [int(rows.at["F3", f"score_{code}"]) for code in PERSONAS] == [17] * 8
    # G1 wins only on momentum: Enigmatic Sage (40% momentum) rates it above Supreme Ruler (20%).
    assert rows.at["G1", "suit_LLH"] == pytest.approx(100 * (0.2 * 0.25 + 0.4 * 0.75 + 0.2 * 0.25 + 0.1 * 0.25 + 0.1 * 0.25))
    assert rows.at["G1", "suit_HLH"] == pytest.approx(100 * (0.4 * 0.25 + 0.2 * 0.75 + 0.2 * 0.25 + 0.2 * 0.25))
    assert int(rows.at["G1", "score_LLH"]) == 45 and int(rows.at["G1", "score_HLH"]) == 35


def test_missing_component_is_dropped_and_reweighted(cfg):
    features = pd.DataFrame([
        feature_row("A", "EQS-FLX", batting=0.9, stability=0.9, dp=0.6, recovery=0.9, momentum=0.6, aum=np.nan, history=120),
        feature_row("B", "EQS-FLX", batting=0.3, stability=0.3, dp=1.4, recovery=0.2, momentum=0.2, aum=8, history=30),
    ])
    scores, _ = score_features(features, cfg)
    a = scores.set_index("scheme_code").loc["A"]
    assert np.isnan(a["comp_aum"]) and bool(a["low_confidence"])
    assert int(a["score_LLL"]) == 75                    # every remaining component is 0.75


def test_reasons_follow_the_weighted_components(scored):
    scores, _ = scored
    rows = scores.set_index("scheme_code")
    assert rows.at["F1", "pos_reasons_LLL"] == ["STEADY_BEATS", "SMALLER_FALLS"]
    assert rows.at["F3", "neg_reasons_LLL"] == ["PATCHY", "BIGGER_FALLS"]
    assert rows.at["G1", "pos_reasons_LLH"] == ["STRONG_CLIMB"]


@pytest.mark.parametrize(
    "profile,expected_context",
    [
        ({"age": 24, "living": "family", "persona_code": "HHH"}, (3, 4, 7)),
        ({"age": 62, "living": "renting", "persona_code": "HHH", "health_insurance": False}, (-2, 1, 5)),
        ({"age": 42, "living": "own_emi", "persona_code": "HHL"}, (0, 2, 6)),
    ],
)
def test_user_capacity_context_and_match(scored, cfg, profile, expected_context):
    scores, _ = scored
    context = capacity_context(profile, cfg)
    assert (context["points"], context["tier"], context["allowed_grade"]) == expected_context
    rows = scores.set_index("scheme_code")
    assert user_match(rows.loc["F1"], profile, cfg)["score"] == 83     # equal persona scores: blend keeps 83


def test_ranked_listing_includes_v11_match(scored, cfg):
    scores, _ = scored
    # Fixture categories are Flexi; give two rows Bold Pioneer slots so the listing shows them.
    listing = rank_funds(scores.assign(slots=[["FOCUSED"], ["MULTI"], [], [], [], []]),
                         {"age": 24, "living": "family", "persona_code": "HHH"}, cfg)
    assert listing["scheme_code"].tolist() == ["F1", "F2"]
    assert listing.iloc[0]["personality_match"]["band"] == {"code": "GOOD", "label": "Good fit"}


@pytest.mark.parametrize(
    "persona,amount,band,slots,per_fund",
    [
        ("HHH", 3000, "A1", ["FOCUSED", "MULTI"], 1500),
        ("LHL", 8000, "A2", ["MAA", "INDEX", "FLEXI"], 2600),
        ("LLL", 12000, "A3", ["AHF", "MAA", "LARGE", "FLEXI", "MULTI"], 2400),
        ("HHL", 15000, "A3", ["LARGE", "FLEXI", "MULTI", "SMALL", "SECTORAL"], 3000),
        ("HLH", 10000, "A3", ["FOCUSED", "MULTI", "MULTI", "SMALL", "SECTORAL"], 2000),
        ("LHH", 25000, "A4", ["FLEXI", "MULTI", "MID", "SMALL", "SMALL", "GOLD"], 4100),
        ("LLH", 22000, "A4", ["INDEX", "LARGE", "MULTI", "MULTI", "SMALL", "SECTORAL"], 3600),
        ("LLL", 40000, "A5", ["AHF", "MAA", "LARGE", "FLEXI", "FLEXI", "MULTI", "MID"], 5700),
        ("HHL", 35000, "A5", ["LARGE", "FLEXI", "MULTI", "MID", "SMALL", "SECTORAL", "GOLD"], 5000),
        ("HLL", 50000, "A5", ["INDEX", "INDEX", "LARGE", "MULTI", "MULTI", "SMALL", "SECTORAL"], 7100),
    ],
)
def test_golden_basket_slots(cfg, persona, amount, band, slots, per_fund):
    plan = basket_plan({"persona_code": persona, "monthly_amount": amount}, cfg)
    assert (plan["band"], plan["slots"], plan["per_fund_amount"]) == (band, slots, per_fund)


def test_amount_below_minimum_has_no_basket(cfg):
    assert basket_plan({"persona_code": "LLL", "monthly_amount": 400}, cfg) is None
