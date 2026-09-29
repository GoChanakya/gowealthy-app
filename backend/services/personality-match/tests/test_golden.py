from pathlib import Path
import sys

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pm_batch import score_features
from pm_basket import basket_plan
from pm_config import load_config
from pm_lookup import capacity_context, rank_funds, user_match


@pytest.fixture(scope="module")
def cfg():
    return load_config()


@pytest.fixture(scope="module")
def scored(cfg):
    features = pd.DataFrame([
        {
            "scheme_code": "100001", "goc_short_code": "EQ-LC", "fund_persona_code": "STEADY_CLIMBER",
            "grade": 4, "role": "core", "complex": False, "auto_recommend": True,
            "history_months": 132, "status": "SCORED", "DP": 0.8718, "dp_conf": 1.0,
            "recovery_ratio": 0.9, "unrecovered_penalty": 0.0, "batting": 0.7917,
            "rank_stability": 0.6996, "rank_level": 0.9383, "rank_trend": 0.9409,
            "return_1y": 0.75, "sip_3y": 0.8, "alpha_3y": 0.78, "aum": 0.85,
            "track_record": 1.0, "track_record_years": 11.0, "turnaround": 0.25,
        },
        {
            "scheme_code": "100002", "goc_short_code": "EQ-FC", "fund_persona_code": "SPRINTER",
            "grade": 5, "role": "core", "complex": False, "auto_recommend": True,
            "history_months": 84, "status": "SCORED", "DP": 1.28, "dp_conf": 1.0,
            "recovery_ratio": 0.5, "unrecovered_penalty": 0.09, "batting": 0.5139,
            "rank_stability": 0.7333, "rank_level": 0.9167, "rank_trend": 1.0,
            "return_1y": 0.9, "sip_3y": 0.85, "alpha_3y": 0.8, "aum": 0.45,
            "track_record": 0.7, "track_record_years": 7.0, "turnaround": 0.25,
        },
    ])
    return score_features(features, cfg)


def test_golden_persona_scores(scored):
    scores, _ = scored
    expected = {
        "100001": [94, 95, 95, 95, 93, 77, 92, 91],
        "100002": [52, 60, 64, 74, 83, 63, 89, 90],
    }
    personas = ["LLL", "LHL", "HLL", "HHL", "LHH", "LLH", "HLH", "HHH"]
    for _, row in scores.iterrows():
        assert [int(row[f"score_{code}"]) for code in personas] == expected[row["scheme_code"]]


def test_golden_intermediate(scored):
    _, audit = scored
    row = audit.loc[(audit.scheme_code == "100002") & (audit.persona_code == "LLL")].iloc[0]
    assert row.dp_score == pytest.approx(0.1213, abs=1e-3)
    assert row.resilience == pytest.approx(0.1828, abs=1e-3)
    assert row.consistency == pytest.approx(0.6017, abs=1e-3)
    assert row.growth == pytest.approx(0.8583, abs=1e-3)
    assert row.stature == pytest.approx(0.55, abs=1e-3)
    assert row.fit == pytest.approx(0.4285, abs=1e-3)
    assert row.base == pytest.approx(42.95, abs=1e-2)
    assert row.display == pytest.approx(51.66, abs=1e-2)


def test_golden_reasons(scored):
    scores, _ = scored
    rows = scores.set_index("scheme_code")
    assert rows.at["100001", "pos_reasons_LLL"] == ["SMALLER_FALLS", "TRUSTED_SIZE"]
    assert rows.at["100001", "pos_reasons_HHL"] == ["SMALLER_FALLS", "STRONG_CLIMB"]
    assert rows.at["100001", "pos_reasons_HHH"] == ["STRONG_CLIMB", "SMALLER_FALLS"]
    assert rows.at["100002", "neg_reasons_LLL"] == ["BIGGER_FALLS"]
    assert rows.at["100002", "pos_reasons_HHL"] == ["STRONG_CLIMB", "YOUR_STYLE"]
    assert rows.at["100002", "pos_reasons_HHH"] == ["STRONG_CLIMB"]


@pytest.mark.parametrize(
    "profile,expected_context,expected_scores",
    [
        ({"age": 24, "living": "family", "persona_code": "HHH"}, (3, 4, 7), (91, 90)),
        (
            {"age": 62, "living": "renting", "persona_code": "HHH", "health_insurance": False},
            (-2, 1, 5), (93, 69),
        ),
        ({"age": 42, "living": "own_emi", "persona_code": "HHL"}, (0, 2, 6), (95, 66)),
    ],
)
def test_golden_users(scored, cfg, profile, expected_context, expected_scores):
    scores, _ = scored
    context = capacity_context(profile, cfg)
    assert (context["points"], context["tier"], context["allowed_grade"]) == expected_context
    assert tuple(user_match(row, profile, cfg)["score"] for _, row in scores.iterrows()) == expected_scores


def test_ranked_listing_includes_v11_match(scored, cfg):
    scores, _ = scored
    listing = rank_funds(scores, {"age": 24, "living": "family", "persona_code": "HHH"}, cfg)
    assert listing["scheme_code"].tolist() == ["100001", "100002"]
    assert listing.iloc[0]["personality_match"] == {
        "score": 91,
        "band": {"code": "GREAT", "label": "Great fit"},
        "reasons": [
            {"code": "STRONG_CLIMB", "text": "Climbing its category ranks with strong returns"},
            {"code": "SMALLER_FALLS", "text": "Fell less than most funds in past crashes"},
        ],
        "status": "SCORED",
        "user_gate": None,
        "recommended": True,
    }


@pytest.mark.parametrize(
    "profile,amount,beta,band,funds,slots",
    [
        ({"age": 24, "living": "family", "persona_code": "HHH"}, 3000, 0.0, "A1", 2, {"core": 1, "growth": 1, "satellite": 0}),
        ({"age": 30, "living": "renting", "persona_code": "HHL"}, 15000, 0.15, "A3", 5, {"core": 3, "growth": 1, "satellite": 1}),
        ({"age": 62, "living": "renting", "persona_code": "LLL"}, 40000, 0.35, "A5", 9, {"core": 8, "growth": 1, "satellite": 0}),
        ({"age": 24, "living": "family", "persona_code": "HLH"}, 25000, 0.0, "A4", 7, {"core": 3, "growth": 4, "satellite": 0}),
        ({"age": 24, "living": "family", "persona_code": "LHH"}, 8000, 0.0, "A2", 3, {"core": 2, "growth": 1, "satellite": 0}),
    ],
)
def test_golden_basket_slots(cfg, profile, amount, beta, band, funds, slots):
    plan = basket_plan({**profile, "monthly_amount": amount}, cfg)
    assert plan["context"]["beta"] == beta
    assert plan["band"] == band
    assert plan["funds"] == funds
    assert plan["slots"] == slots
