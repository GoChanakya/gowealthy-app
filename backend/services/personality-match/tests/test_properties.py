from pathlib import Path
import sys

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pm_config import load_config
from pm_lookup import capacity_context, user_match


def test_missing_optional_fields_are_neutral():
    cfg = load_config()
    base = {"age": 35, "living": "renting", "persona_code": "HHH"}
    explicit = {**base, "spouse_income": False, "dependents_non_earning": 0, "emergency_fund": "partial", "health_insurance": True}
    assert capacity_context(base, cfg)["points"] == capacity_context(explicit, cfg)["points"]


def test_user_cap_never_raises_score():
    cfg = load_config()
    row = pd.Series({
        "status": "SCORED", "grade": 7, "score_HHH": 90, "score_LLL": 80,
        "gate_HHH": None, "pos_reasons_HHH": [], "neg_reasons_HHH": [],
    })
    result = user_match(
        row,
        {"age": 70, "living": "renting", "persona_code": "HHH", "health_insurance": False},
        cfg,
    )
    assert result["score"] <= 90

