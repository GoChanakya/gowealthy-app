from pathlib import Path
import sys

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pm_batch import _snapshot_features, event_resilience, score_features
from pm_basket import basket_plan
from pm_config import load_config
from pm_lookup import capacity_context, rank_funds, user_match

PERSONAS = ["LLL", "LHL", "HLL", "HHL", "LHH", "LLH", "HLH", "HHH"]
COMPONENTS = ["consistency", "rank_momentum", "resilience", "aum", "age"]


@pytest.fixture(scope="module")
def cfg():
    return load_config()


def feature_row(code, category, *, consistency, momentum, resilience, aum, history, grade=5):
    return {
        "scheme_code": code, "goc_short_code": category, "status": "SCORED", "grade": grade, "complex": False,
        "history_months": history, "consistency_36m": consistency, "rank_momentum_raw": momentum,
        "resilience_score": resilience, "aum_log_raw": aum,
    }


def expected_score(cfg, persona, components):
    weights = cfg["personas"][persona]["suitability"]
    return 100 * sum(float(weights.get(name, 0)) * value for name, value in zip(COMPONENTS, components))


@pytest.fixture(scope="module")
def scored(cfg):
    # Flexi: three funds, so AUM / age percentiles are 5/6, 1/2, 1/6.
    # Multi: G1 strong only on rank momentum, G2 strong on everything else.
    # Large: L1 alone in its category -> AUM and age percentiles 0.5.
    features = pd.DataFrame([
        feature_row("F1", "EQS-FLX", consistency=0.8, momentum=0.6, resilience=0.9, aum=10, history=120),
        feature_row("F2", "EQS-FLX", consistency=0.5, momentum=0.4, resilience=0.5, aum=9, history=60),
        feature_row("F3", "EQS-FLX", consistency=0.2, momentum=0.2, resilience=0.1, aum=8, history=30),
        feature_row("G1", "EQS-MUC", consistency=0.3, momentum=0.8, resilience=0.3, aum=8, history=30),
        feature_row("G2", "EQS-MUC", consistency=0.8, momentum=0.2, resilience=0.8, aum=10, history=120),
        feature_row("L1", "EQS-LRG", consistency=0.5, momentum=0.5, resilience=0.5, aum=9, history=60),
    ])
    return score_features(features, cfg)


def test_owner_rank_momentum_formula(cfg):
    # Now 3 of 20, three months ago 11 of 20: 65% x (20 - 3)/20 + 35% x (11 - 3)/20 = 0.6925
    snapshots = pd.DataFrame({
        "scheme_code": ["A"] * 3, "date": pd.to_datetime(["2026-07-31", "2026-08-31", "2026-09-30"]),
        "rank": [11, 4, 3], "total": [20, 20, 20],
    })
    assert _snapshot_features(snapshots, cfg).at["A", "rank_momentum_raw"] == pytest.approx(0.65 * 17 / 20 + 0.35 * 8 / 20)
    slipping = snapshots.assign(rank=[3, 4, 11])          # a fall in rank adds nothing
    assert _snapshot_features(slipping, cfg).at["A", "rank_momentum_raw"] == pytest.approx(0.65 * 9 / 20)


def test_owner_event_resilience(cfg):
    frame = pd.DataFrame({
        "scheme_code": ["A", "B", "C", "D"], "goc_short_code": ["EQS-FLX"] * 3 + ["EQS-LRG"],
        "status": ["SCORED"] * 4,
    })
    events = pd.DataFrame([
        # Iran (30%): falls 5 / 10 / 15; recoveries 1 month, 2 months, still recovering
        ("A", "IRAN_2026", "recovered", 5.0, 1.0, 100.0), ("B", "IRAN_2026", "recovered", 10.0, 2.0, 100.0),
        ("C", "IRAN_2026", "recovering", 15.0, None, 50.0), ("D", "IRAN_2026", "recovered", 9.0, 1.0, 100.0),
        # FII (25%): C launched later; B fell less, A recovered faster
        ("A", "FII_2021", "recovered", 8.0, 1.0, 100.0), ("B", "FII_2021", "recovered", 4.0, 3.0, 100.0),
        ("C", "FII_2021", "not_applicable", None, None, None),
    ], columns=["scheme_code", "event_code", "status", "fall_pct", "recovery_months", "recovered_pct"])
    result = event_resilience(frame, events, cfg)["resilience_score"]
    iran = {"A": 1.0, "B": 2 / 3, "C": 1 / 3}                 # 0.5 x fall + 0.5 x recovery, (n - rank + 1) / n
    fii = {"A": 0.5 * 0.5 + 0.5 * 1.0, "B": 0.5 * 1.0 + 0.5 * 0.5}
    assert result["A"] == pytest.approx((0.30 * iran["A"] + 0.25 * fii["A"]) / 0.55)
    assert result["B"] == pytest.approx((0.30 * iran["B"] + 0.25 * fii["B"]) / 0.55)
    assert result["C"] == pytest.approx(iran["C"])            # missing event skipped, weights renormalised
    assert result["D"] == pytest.approx(0.5)                  # alone in its category


def test_components_use_owner_scores_and_category_percentiles(scored):
    scores, _ = scored
    rows = scores.set_index("scheme_code")
    components = [f"comp_{name}" for name in COMPONENTS]
    assert rows.loc["F1", components].tolist() == pytest.approx([0.8, 0.6, 0.9, 5 / 6, 5 / 6])
    assert rows.loc["F3", components].tolist() == pytest.approx([0.2, 0.2, 0.1, 1 / 6, 1 / 6])
    assert rows.loc["L1", components].tolist() == pytest.approx([0.5] * 5)


def test_eight_suitability_scores_use_the_owner_weights(scored, cfg):
    scores, _ = scored
    rows = scores.set_index("scheme_code")
    for code in PERSONAS:
        assert rows.at["F1", f"suit_{code}"] == pytest.approx(expected_score(cfg, code, [0.8, 0.6, 0.9, 5 / 6, 5 / 6]), abs=1e-4)
    # G1 wins only on momentum: Enigmatic Sage (40% momentum) rates it above Supreme Ruler (20%).
    assert int(rows.at["G1", "score_LLH"]) == 49 and int(rows.at["G1", "score_HLH"]) == 39


def test_missing_component_is_dropped_and_reweighted(cfg):
    features = pd.DataFrame([
        feature_row("A", "EQS-FLX", consistency=0.6, momentum=0.6, resilience=np.nan, aum=10, history=120),
        feature_row("B", "EQS-FLX", consistency=0.6, momentum=0.6, resilience=0.6, aum=8, history=30),
    ])
    scores, _ = score_features(features, cfg)
    a = scores.set_index("scheme_code").loc["A"]
    assert np.isnan(a["comp_resilience"]) and bool(a["low_confidence"])
    weights = cfg["personas"]["LLL"]["suitability"]
    kept = {"consistency": 0.6, "rank_momentum": 0.6, "aum": 0.75, "age": 0.75}
    assert a["suit_LLL"] == pytest.approx(
        100 * sum(float(weights[k]) * v for k, v in kept.items()) / sum(float(weights[k]) for k in kept), abs=1e-4
    )


def test_reasons_follow_the_weighted_components(scored):
    scores, _ = scored
    rows = scores.set_index("scheme_code")
    assert rows.at["F1", "pos_reasons_LLL"] == ["SMALLER_FALLS", "STEADY_BEATS"]
    assert rows.at["F3", "neg_reasons_LLL"] == ["BIGGER_FALLS", "PATCHY"]
    assert rows.at["G1", "pos_reasons_LLH"] == ["STRONG_CLIMB"]


@pytest.mark.parametrize(
    "profile,expected_context,beta",
    [
        ({"age": 24, "living": "family", "persona_code": "HHH"}, (3, 4, 7), 0.0),
        ({"age": 62, "living": "renting", "persona_code": "HHH", "health_insurance": False}, (-2, 1, 5), 0.55),
        ({"age": 42, "living": "own_emi", "persona_code": "HHL"}, (0, 2, 6), 0.35),
    ],
)
def test_user_capacity_context_and_match(scored, cfg, profile, expected_context, beta):
    scores, _ = scored
    context = capacity_context(profile, cfg)
    assert (context["points"], context["tier"], context["allowed_grade"]) == expected_context
    f1 = scores.set_index("scheme_code").loc["F1"]
    persona = profile["persona_code"]
    blended = (1 - beta) * int(f1[f"score_{persona}"]) + beta * int(f1["score_LLL"])
    assert user_match(f1, profile, cfg)["score"] == int(np.floor(blended + 0.5 + 1e-9))


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
