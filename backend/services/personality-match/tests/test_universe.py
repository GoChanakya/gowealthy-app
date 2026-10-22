from pathlib import Path
import sys

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pm_batch import score_frames
from pm_config import load_config
from pm_sources import build_inputs, screen


def card(code, category, rank=None, total=10, purchase="Y", sip="Y", age=8.0, amc="Alpha MF"):
    return {
        "scheme_code": code, "name": f"Fund {code}", "amc": amc, "goc_short_code": category,
        "rank_now": rank, "rank_total_now": total if rank is not None else None,
        "nse_purchase_allowed": purchase, "nse_sip_allowed": sip,
        "nse_additional_purchase_min_amount": 500.0, "nse_new_purchase_min_amount": 5000.0,
        "aum_lakhs": 100000.0, "fund_age_years": age, "ret_1y_pct": 12.0,
        "months_beat": 7.0, "batting_months": 12.0, "sip_invested": 180000.0, "sip_value": 210000.0,
        "typical_recovery_months": 5.0, "category_typical_recovery_months": 6.0,
    }


def test_screening_reasons_and_shortlist_only_scoring():
    cfg = load_config()
    cards = pd.DataFrame([
        card("1", "EQS-FLX", rank=3), card("2", "EQS-FLX", rank=5), card("3", "EQS-FLX", rank=6),
        card("4", "EQS-FLX"),                       # unranked in a ranked category
        card("5", "EQS-FLX", rank=1, purchase="N"),
        card("6", "EQS-ELS", rank=1),               # ELSS never
        card("7", "DES-CRB", rank=1),               # debt: out of universe
        card("8", "DES-LIQ", rank=2),               # liquid: buffer only
        card("9", "EQS-FLX", rank=2, age=None),     # no age anywhere
    ])
    screened = screen(cards, cfg)
    assert screened.set_index("scheme_code")["screen_reason"].to_dict() == {
        "1": "", "2": "", "3": "BOTTOM_HALF_RANK", "4": "NO_RANK", "5": "PURCHASE_NOT_ALLOWED",
        "6": "OUT_OF_UNIVERSE", "7": "OUT_OF_UNIVERSE", "8": "", "9": "",
    }
    sources = {"fund_cards": cards}
    scores, _ = score_frames(*build_inputs(screened, sources, "2026-10-02", cfg), "2026-10-02", cfg)
    rows = scores.set_index("scheme_code")
    assert list(rows.index) == ["1", "2", "8", "9"]
    assert rows["status"].to_dict() == {"1": "SCORED", "2": "SCORED", "8": "BUFFER", "9": "AGE_UNKNOWN"}
    assert rows.at["1", "min_sip_amount"] == 500 and rows.at["1", "amc_code"] == "ALPHA_MF"
    assert rows.at["1", "rank_now_pct"] > rows.at["2", "rank_now_pct"]
    assert pd.isna(rows.at["8", "score_LLL"]) and 0 <= rows.at["8", "buffer_score"] <= 1


def test_satellite_sources_enrich_shortlist():
    cfg = load_config()
    cards = pd.DataFrame([card("1", "EQS-MUC", rank=1, age=None), card("2", "EQS-MUC", rank=2)])
    cards["aum_lakhs"] = None
    sources = {
        "fund_cards": cards,
        "aum": pd.DataFrame({"scheme_code": ["1"], "aum_lakhs": [5.0e5], "start_date": [pd.Timestamp("2016-01-04")], "fund_age_years": [10.7]}),
        "batting_average": pd.DataFrame({
            "scheme_code": ["1"] * 40, "month": [f"{2023 + (m + 4) // 12}-{(m + 4) % 12 + 1:02d}" for m in range(40)],
            "beat": [1] * 30 + [0] * 10, "peers": [20] * 40,
        }),
        "stress_events": pd.DataFrame({
            "scheme_code": ["1", "1"], "event_code": ["COVID_2020", "IRAN_2026"], "status": ["recovered", "recovering"],
            "fall_pct": [30.0, 10.0], "recovered_pct": [100.0, 40.0],
        }),
        "rank_momentum": pd.DataFrame({
            "scheme_code": ["1"] * 6, "date": pd.date_range("2026-04-30", periods=6, freq="ME"),
            "rank": [9, 8, 6, 4, 2, 1], "total": [32] * 6,
        }),
    }
    schemes, events, snapshots = build_inputs(screen(cards, cfg), sources, "2026-10-02", cfg)
    one = schemes.set_index("scheme_code").loc["1"]
    assert one["aum_raw"] == 5.0e5 and one["inception_date"] == pd.Timestamp("2016-01-04")
    assert (one["batting_36_window"], one["batting_36_beats"]) == (36, 26)
    assert len(events) == 2 and len(snapshots) == 6
    scores, _ = score_frames(schemes, events, snapshots, "2026-10-02", cfg)
    first = scores.set_index("scheme_code").loc["1"]
    # Owner rank momentum, last 3 ranks 4, 2, 1 of 32: 65% x (32 - 1) / 32 + 35% x (4 - 1) / 32
    assert first["history_months"] == 128
    assert first["rank_momentum_raw"] == pytest.approx(0.65 * 31 / 32 + 0.35 * 3 / 32, abs=1e-6)
