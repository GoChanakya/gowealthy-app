from pathlib import Path
import sys

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pm_basket import basket_plan, build_basket, eligible_slots, persona_positions
from pm_lookup import rank_funds
from pm_config import load_config

PERSONAS = ("LLL", "LHL", "HLL", "HHL", "LHH", "LLH", "HLH", "HHH")


@pytest.fixture(scope="module")
def cfg():
    return load_config()


def fund(code, category, amc, *, score=50.0, persona_scores=None, buffer=0.5, status="SCORED",
         history=60, momentum=True, min_sip=500, aum=0.5):
    """A scored row: `score` is the suitability for every persona unless overridden."""
    row = {
        "scheme_code": code, "goc_short_code": category, "amc_code": amc, "status": status,
        "history_months": history, "momentum_pass": momentum, "min_sip_amount": min_sip,
        "aum_pct": aum, "sip_3y_pct": 0.5, "holdings": None, "grade": 5, "sip_allowed": True,
        "buffer_score": buffer,
    }
    row.update({f"suit_{code_}": score for code_ in PERSONAS})
    row.update({f"suit_{code_}": value for code_, value in (persona_scores or {}).items()})
    return row


def basket(rows, cfg, **profile):
    return build_basket(pd.DataFrame(rows), profile, cfg)


def test_aggressive_basket_slots_amc_and_sector_rules(cfg):
    rows = [
        fund("F1", "EQS-FOC", "A1", score=90),
        fund("M1", "EQS-MUC", "A2", score=95),
        fund("M2", "EQS-MUC", "A2", score=94),          # same AMC as M1: never twice in a basket
        fund("M3", "EQS-MUC", "A3", score=80),
        fund("S1", "EQS-SMC", "A4", score=99, momentum=False),  # bottom half: never used
        fund("S2", "EQS-SMC", "A4", score=70),
        fund("S3", "EQS-SMC", "A5", score=60, history=12),     # younger than 36 months
        fund("T1", "EQS-SCT-DIG", "A6", score=97),
        fund("T2", "EQS-SCT-DIG", "A7", score=96),  # same sector as T1
        fund("T3", "EQS-SCT-HLT", "A8", score=90),
        fund("E1", "EQS-ELS", "A9", score=100, status="OUT_OF_UNIVERSE"),
    ]
    result = basket(rows, cfg, persona_code="HHH", monthly_amount=20000)
    assert [(r["slot"], r["scheme_code"]) for r in result] == [
        ("FOCUSED", "F1"), ("MULTI", "M1"), ("MULTI", "M3"),
        ("SMALL", "S2"), ("SECTORAL", "T1"), ("SECTORAL", "T3"),
    ]
    assert [r["amount"] for r in result] == [3500, 3300, 3300, 3300, 3300, 3300]
    assert sum(r["amount"] for r in result) == 20000


def test_never_the_same_amc_twice_at_any_size(cfg):
    small = [
        fund("H1", "HYB-AHF", "X", score=90), fund("MA1", "HYB-MAA", "X", score=95),
        fund("MA2", "HYB-MAA", "Y", score=60), fund("LC1", "EQS-LRG", "Z", score=80),
    ]
    assert [r["scheme_code"] for r in basket(small, cfg, persona_code="LLL", monthly_amount=5000)] == ["H1", "MA2", "LC1"]
    large = [
        fund("H1", "HYB-AHF", "X", score=90), fund("MA1", "HYB-MAA", "X", score=90),
        fund("MA2", "HYB-MAA", "Y", score=50), fund("LC1", "EQS-LRG", "W", score=90),
        fund("FL1", "EQS-FLX", "X", score=90), fund("FL2", "EQS-FLX", "V", score=50),
        fund("MU1", "EQS-MUC", "Z", score=90),
    ]
    result = basket(large, cfg, persona_code="LLL", monthly_amount=12000)
    assert [r["scheme_code"] for r in result] == ["H1", "MA2", "LC1", "FL2", "MU1"]


def test_each_slot_takes_the_personas_best_suitability(cfg):
    rows = [
        fund("H1", "HYB-AHF", "A", score=90), fund("MA1", "HYB-MAA", "B", score=90),
        fund("FL1", "EQS-FLX", "C", score=90), fund("LC1", "EQS-LRG", "F", score=90),
        fund("MU_A", "EQS-MUC", "D", persona_scores={"LLL": 40, "HHH": 90}),
        fund("MU_B", "EQS-MUC", "E", persona_scores={"LLL": 80, "HHH": 30}),
    ]
    assert {r["slot"]: r["scheme_code"] for r in basket(rows, cfg, persona_code="LLL", monthly_amount=10000)}["MULTI"] == "MU_B"
    first_multi = lambda persona: next(r["scheme_code"] for r in basket(rows, cfg, persona_code=persona, monthly_amount=10000) if r["slot"] == "MULTI")
    assert first_multi("HHH") == "MU_A"      # Bold Pioneer has two Multi slots; its best Multi comes first


def test_tiers_keep_the_lowest_risk_slots_first(cfg):
    plan = lambda persona, amount: basket_plan({"persona_code": persona, "monthly_amount": amount}, cfg)["slots"]
    assert plan("HHL", 1000) == ["LARGE", "FLEXI"]                       # 2 schemes: lowest risk two
    assert plan("LHH", 7000) == ["FLEXI", "MULTI", "MID"]
    assert plan("LLL", 12000) == ["AHF", "MAA", "LARGE", "FLEXI", "MULTI"]  # 5 drops the riskiest (Mid)
    assert plan("LLL", 40000) == ["AHF", "MAA", "LARGE", "FLEXI", "FLEXI", "MULTI", "MID"]
    assert plan("HHL", 40000)[-1] == "GOLD"                                # owner ladder: gold last


def test_category_minimum_ages(cfg):
    rows = [
        fund("FOC", "EQS-FOC", "A"),
        fund("MU1", "EQS-MUC", "B"), fund("MU2", "EQS-MUC", "C"),
        fund("S_YOUNG", "EQS-SMC", "D", score=99, history=30),   # small cap needs 36 months
        fund("S_OLD", "EQS-SMC", "E", score=50, history=40),
        fund("SC1", "EQS-SCT-DIG", "F"),
    ]
    picks = {r["slot"]: r["scheme_code"] for r in basket(rows, cfg, persona_code="HHH", monthly_amount=10000)}
    assert picks["SMALL"] == "S_OLD"
    flexi = [fund("FL_YOUNG", "EQS-FLX", "A", score=99, history=20), fund("FL_OK", "EQS-FLX", "B", history=24),
             fund("LC1", "EQS-LRG", "C", history=24)]
    picks = {r["slot"]: r["scheme_code"] for r in basket(flexi, cfg, persona_code="HHL", monthly_amount=1000)}
    assert picks == {"LARGE": "LC1", "FLEXI": "FL_OK"}                   # Flexi needs 24 even for an 18-month persona


def test_conservative_minimum_age_and_min_sip(cfg):
    rows = [
        fund("H_NEW", "HYB-AHF", "A", score=99, history=20),   # below 24 months
        fund("H_MIN", "HYB-AHF", "B", score=95, min_sip=5000),  # min SIP above the 500 share
        fund("H_OK", "HYB-AHF", "C", score=50),
    ]
    result = basket(rows, cfg, persona_code="LLL", monthly_amount=1000)
    assert [r["scheme_code"] for r in result] == ["H_OK"]
    assert result[0]["amount"] == 1000


def test_buffer_is_extra_liquid_sip(cfg):
    rows = [
        fund("FL1", "EQS-FLX", "A", score=90), fund("LC1", "EQS-LRG", "B", score=90),
        fund("L1", "DES-LIQ", "C", status="BUFFER", buffer=0.9, min_sip=1000),
        fund("L2", "DES-LIQ", "D", status="BUFFER", buffer=0.8),
        fund("L3", "DES-LIQ", "E", status="BUFFER", buffer=0.99, history=12),
    ]
    result = basket(rows, cfg, persona_code="HHL", monthly_amount=1000, buffer_monthly_amount=500)
    assert result[-1] == {"scheme_code": "L2", "slot": "BUFFER", "goc_short_code": "DES-LIQ", "amount": 500}
    assert sum(r["amount"] for r in result if r["slot"] != "BUFFER") == 1000


def test_sip_not_allowed_is_never_picked(cfg):
    rows = [fund("LC1", "EQS-LRG", "A", score=90), fund("LC2", "EQS-LRG", "B", score=50)]
    rows[0]["sip_allowed"] = False
    assert [r["scheme_code"] for r in basket(rows, cfg, persona_code="HHL", monthly_amount=800)] == ["LC2"]


def test_index_slot_takes_broad_market_indices_only(cfg):
    names = {
        "I1": "Nippon India Nifty Smallcap 250 Index Fund",
        "I2": "Kotak Nifty Midcap 150 Momentum 50 Index Fund",
        "I3": "SBI Nifty Bank Index Fund",
        "I4": "UTI - Nifty Next 50 Index Fund",
        "I5": "Groww Nifty Total Market Index Fund",
    }
    rows = [{**fund(code, "EQS-IXF", f"A{i}", score=100 - i * 10), "name": name}
            for i, (code, name) in enumerate(names.items())]
    frame = pd.DataFrame(rows)
    assert [s for s in eligible_slots(frame, cfg)] == [[], [], [], ["INDEX"], ["INDEX"]]
    result = basket(rows, cfg, persona_code="LHL", monthly_amount=1000)
    assert [(r["slot"], r["scheme_code"]) for r in result] == [("INDEX", "I4")]


def test_listing_only_shows_the_personas_slot_categories(cfg):
    rows = [
        {**fund("ARB", "HYB-ARB", "A1"), "name": "Kotak Arbitrage Fund"},
        {**fund("FOC", "EQS-FOC", "A2"), "name": "Invesco India Focused Fund"},
        {**fund("LRG", "EQS-LRG", "A3"), "name": "Large Cap Fund"},
    ]
    frame = pd.DataFrame(rows)
    frame["slots"] = eligible_slots(frame, cfg)
    for code in cfg["personas"]:
        frame[f"score_{code}"] = 90
    listed = lambda persona: set(rank_funds(frame, {"persona_code": persona, "age": 30, "living": "family"}, cfg).scheme_code)
    assert listed("HHH") == {"FOC"}            # Bold Pioneer: Focused / Multi / Small / Sectoral
    assert listed("LLL") == {"LRG"}            # Realistic Guardian: no Focused, no Arbitrage
    assert "ARB" not in set().union(*(listed(p) for p in cfg["personas"]))


def test_positions_fill_each_slot_from_its_own_category(cfg):
    rows = [
        fund("FL1", "EQS-FLX", "A1", score=90), fund("FL2", "EQS-FLX", "A2", score=80),
        fund("LG1", "EQS-LRG", "A3", score=70), fund("LG2", "EQS-LRG", "A4", score=60),
        fund("MU1", "EQS-MUC", "A5", score=50), fund("SM1", "EQS-SMC", "A6", score=40),
        fund("SC1", "EQS-SCT-DIG", "A7", score=90),
        fund("SC2", "EQS-SCT-HLT", "A8", score=80),
        fund("ARB", "HYB-ARB", "A9", score=100),       # best score overall, but no Diplomat slot
    ]
    frame = pd.DataFrame(rows).assign(name="")
    positions = persona_positions(frame, cfg)["HHL"]["A3"]   # Noble Diplomat, 5 schemes, lowest risk first
    assert [(p["position"], p["slot"], p["scheme_code"]) for p in positions] == [
        (1, "LARGE", "LG1"), (2, "FLEXI", "FL1"), (3, "MULTI", "MU1"), (4, "SMALL", "SM1"), (5, "SECTORAL", "SC1"),
    ]
    assert positions[0]["alternates"] == ["LG2"]
    assert positions[1]["alternates"] == ["FL2"]
    assert positions[4]["alternates"] == ["SC2"]
