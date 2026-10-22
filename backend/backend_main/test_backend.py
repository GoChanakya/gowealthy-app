"""Synthetic tests for every dataset + an end-to-end run. `python -m pytest -q`"""
import json
from datetime import datetime

import jsonschema
import numpy as np
import pandas as pd
import pyarrow.parquet as pq
import pytest

import core
import main
import metrics as m

TODAY = pd.Timestamp("2026-09-25")
DAYS = pd.bdate_range("2015-06-01", TODAY - pd.Timedelta(days=1))
N = len(DAYS)


def frame(code, dates, nav):
    return pd.DataFrame({"scheme_code": str(code), "nav_date": pd.DatetimeIndex(dates), "nav": np.asarray(nav, float)})


def cleaned(*frames):
    df = pd.concat(frames, ignore_index=True).sort_values(["scheme_code", "nav_date"], ignore_index=True)
    return core.clean_jumps(df)


# ---------------------------------------------------------------- jump cleaning
def test_clean_jumps_rules():
    d = DAYS[-300:]
    fv = np.where(np.arange(300) < 200, 1000.0, 100.0) * (1 + np.arange(300) / 1e4)  # /10 on day 200
    spike = np.full(300, 50.0); spike[100:102] = 15.0  # 2 bad days that come back
    reset = np.where(np.arange(300) < 150, 37.0, 10.0)  # lands on exactly 10
    df, fvd, rsd, bad = cleaned(frame(1, d, fv), frame(2, d, spike), frame(3, d, reset))
    a = df[df.scheme_code == "1"]
    assert np.allclose(a.nav_adj, 100 * (1 + np.arange(300) / 1e4)) and fvd["1"] == d[200]
    assert bad == 2 and len(df[df.scheme_code == "2"]) == 298
    c = df[df.scheme_code == "3"]
    assert c.seg.iloc[149] == 0 and c.seg.iloc[150] == 1 and rsd["3"] == d[150]


# ---------------------------------------------------------------- month-end grid, batting, momentum
def grid_for(frames, as_of="2026-09"):
    df, *_ = cleaned(*frames)
    return df, m.month_end_grid(df, pd.Period(as_of))


def test_month_end_grid_excludes_current_month_and_resets():
    df, (M, SEG, D) = grid_for([frame(1, DAYS, np.linspace(10, 20, N))])
    assert M.columns[-1] == pd.Period("2026-08") and D.loc["1", pd.Period("2026-08")] == DAYS[DAYS < "2026-09-01"][-1]
    _, (M2, SEG2, _) = grid_for([frame(2, DAYS, np.where(np.arange(N) < N - 60, 37.0, 10.0))])
    p = pd.Timestamp(DAYS[N - 60]).to_period("M")
    assert np.isnan(m.period_return(M2, SEG2, p + 1, 2)["2"])  # spans the reset


def monthly_path(rets, start="2025-08"):
    """Daily NAV whose month-end-to-month-end returns equal `rets` (flat inside each month)."""
    months = pd.period_range(start, periods=len(rets) + 2, freq="M")
    nav = np.cumprod([100.0, *[1 + r for r in rets], 1.0])
    dates, vals = [], []
    for p, v in zip(months, nav):
        ds_ = pd.bdate_range(p.start_time, min(p.end_time, TODAY))
        dates += list(ds_); vals += [v] * len(ds_)
    return dates, vals


def test_batting_counts_beats_vs_category_average():
    up, down, flat = [0.02] * 12, [-0.01] * 12, [0.008] * 12
    frames = [frame(c, *monthly_path(r)) for c, r in ((1, up), (2, down), (3, flat))]
    _, (M, SEG, _) = grid_for(frames)
    goc = pd.Series("EQS-LRG", index=["1", "2", "3"])
    funds, long = m.batting(M, SEG, goc, ["1", "2", "3"], pd.Period("2026-09"))
    assert funds["1"]["window_months"] == 12 and funds["1"]["months_beat"] == 12
    assert funds["2"]["months_beat"] == 0 and funds["3"]["months_beat"] == 12  # 0.8% > category avg 0.6%
    assert [x["month"] for x in funds["1"]["monthly"]][0] == "2025-09"
    solo = m.batting(M.loc[["1"]], SEG.loc[["1"]], goc, ["1"], pd.Period("2026-09"))[0]
    assert solo == {}  # a category of one is not a comparison


def test_batting_needs_six_months():
    frames = [frame(1, *monthly_path([0.01] * 4, "2026-03")),  # fund 1: only 5 month returns
              frame(2, *monthly_path([0.0] * 12)), frame(3, *monthly_path([0.01] * 12))]
    _, (M, SEG, _) = grid_for(frames)
    funds, _ = m.batting(M, SEG, pd.Series("X", index=["1", "2", "3"]), ["1", "2"], pd.Period("2026-09"))
    assert "1" not in funds and "2" in funds


def test_momentum_ranks_within_group_and_universe():
    frames = [frame(c, *monthly_path([g] * 12)) for c, g in ((1, 0.03), (2, 0.01), (3, 0.02), (4, 0.05))]
    _, (M, SEG, _) = grid_for(frames)
    goc = pd.Series({"1": "A", "2": "A", "3": "A", "4": "B"})
    funds, long, summary = m.momentum(M, SEG, goc, {"1", "2", "3", "4"}, ["1", "2", "3", "4"], pd.Period("2026-09"))
    s = funds["1"]["snapshots"]
    assert [x["rank"] for x in s] == [1] * len(s) and s[-1]["total"] == 3 and s[-1]["date"] == pd.Timestamp("2026-08-31")
    assert funds["2"]["snapshots"][-1]["rank"] == 3 and funds["4"]["snapshots"][-1]["total"] == 1
    assert [x["date"] for x in s] == sorted(x["date"] for x in s)  # oldest -> newest
    f1 = funds["1"]
    assert [x["date"] for x in f1["last_6_months"]] == [pd.Timestamp(f"2026-0{k}-01") + pd.offsets.MonthEnd(0) for k in range(3, 9)]
    assert f1["rank_now"] == 1 and f1["rank_6m_ago"] == 1 and f1["moved_6m"] == 0 and f1["total_6m_ago"] == 3
    out = m.momentum(M, SEG, goc, {"1", "2"}, ["1", "2", "3"], pd.Period("2026-09"))[0]
    assert set(out) == {"1", "2"} and out["1"]["snapshots"][-1]["total"] == 2  # only the universe is ranked


# ---------------------------------------------------------------- SIP
def sip_run(frames):
    df, (M, SEG, D) = grid_for(frames)
    latest = df.groupby("scheme_code").tail(1).set_index("scheme_code")[["nav_date", "nav", "seg"]]
    return m.sip_3y(M, SEG, D, latest, latest.index)


def test_sip_value_rules():
    flat = frame(1, DAYS, 10.0)
    fv = frame(2, DAYS, np.where(np.arange(N) < N - 400, 100.0, 10.0))  # /10 inside the 36 months
    gap = frame(3, DAYS[(DAYS < "2025-03-01") | (DAYS >= "2025-04-01")], 10.0)  # no NAV in Mar 2025
    reset = frame(4, DAYS, np.where(np.arange(N) < N - 300, 37.0, 10.0))
    young = frame(5, DAYS[-500:], 10.0)
    funds, t = sip_run([flat, fv, gap, reset, young])
    assert set(funds) == {"1", "2"}
    assert funds["1"]["current_value"] == 180000 and funds["2"]["current_value"] == 180000  # face value handled
    assert funds["1"]["savings_value"] == 189499 and funds["1"]["window_end_month"] == "2026-08"


# ---------------------------------------------------------------- stress events
def test_stress_events_fall_recovery_and_statuses():
    d = DAYS
    v = np.full(N, 100.0)
    covid = (d >= "2020-02-15") & (d < "2020-06-01"); v[covid] = 70.0  # -30%, back on 1 Jun 2020
    iran = d >= "2026-03-02"; v[iran] = 80.0; v[d >= "2026-08-03"] = 90.0  # still 10% below: 50% regained
    fv = np.where(d < "2021-11-15", 1000.0, 100.0)  # face value /10 inside the FII window -> no fall
    df, *_ = cleaned(frame(1, d, v), frame(2, d, fv), frame(3, d[d >= "2019-01-01"], 50.0))
    funds, t = m.stress_events(df, ["1", "2", "3"], pd.Series({"3": pd.Timestamp("2019-01-01")}))
    e1 = {e["event_code"]: e for e in funds["1"]["events"]}
    assert [e["event_code"] for e in funds["1"]["events"]][0] == "IRAN_2026"  # newest first
    assert e1["COVID_2020"]["status"] == "recovered" and e1["COVID_2020"]["fall_pct"] == 30.0
    assert e1["COVID_2020"]["recovery_months"] == round((pd.Timestamp("2020-06-01") - pd.Timestamp("2020-02-15")).days / 30.44, 2)
    assert e1["IRAN_2026"]["status"] == "recovering" and e1["IRAN_2026"]["recovered_pct"] == 50.0
    e2 = {e["event_code"]: e for e in funds["2"]["events"]}
    assert e2["FII_2021"]["fall_pct"] == 0.0 and e2["FII_2021"]["status"] == "recovered"
    e3 = {e["event_code"]: e for e in funds["3"]["events"]}
    assert e3["ILFS_2018"]["status"] == "not_applicable" and e3["ILFS_2018"]["reason"] == "launched_after"
    assert e3["COVID_2020"]["status"] == "recovered"


def test_recovery_speed_compares_same_events():
    """Fund 4 only lived through the quick 2026 fall: it is compared with its category in that fall only."""
    rows = []
    for code, months in {"1": {"COVID_2020": 9.0, "IRAN_2026": 2.0}, "2": {"COVID_2020": 7.0, "IRAN_2026": 1.0},
                         "3": {"COVID_2020": 8.0, "IRAN_2026": 3.0}, "4": {"IRAN_2026": 1.5}}.items():
        rows += [{"scheme_code": code, "event_code": e, "status": "recovered", "recovery_months": v} for e, v in months.items()]
    rows.append({"scheme_code": "4", "event_code": "FII_2021", "status": "recovering", "recovery_months": None})
    goc = pd.Series("A", index=["1", "2", "3", "4"])
    funds, t = m.recovery_speed(pd.DataFrame(rows), goc, None, ["1", "2", "3", "4"])
    f4 = funds["4"]
    assert f4["typical_months"] == 1.5 and f4["events_used"] == 1 and f4["recovering_events"] == 1
    assert f4["category_typical_months"] == 1.8  # Iran only: median of 2, 1, 3, 1.5 = 1.75 -> 1.8, not Covid's ~8
    assert funds["1"]["typical_months"] == 5.5 and funds["1"]["category_typical_months"] == 4.9  # median(8.0, 1.75)
    assert [x["event_code"] for x in f4["by_event"]] == ["IRAN_2026"] and f4["by_event"][0]["category_funds"] == 4


def test_recovery_speed_needs_three_peers_per_event():
    rows = [{"scheme_code": c, "event_code": "IRAN_2026", "status": "recovered", "recovery_months": 1.0} for c in ("1", "2")]
    funds, _ = m.recovery_speed(pd.DataFrame(rows), pd.Series("A", index=["1", "2"]), None, ["1", "2"])
    assert funds["1"]["typical_months"] == 1.0 and funds["1"]["category_typical_months"] is None


# ---------------------------------------------------------------- end to end
HEADER = ("AMC,Code,Scheme Name,Scheme Name Lowercase,Scheme Type,Scheme Category,Sub-Category,GOC_Category,"
          "GOC_sub_category,Sector,Theme,Benchmark,Scheme NAV Name,Scheme NAV Name Lowercase,Scheme Minimum Amount,"
          "MinAmount,Launch Date, Closure Date,ISIN Div Payout/ ISIN GrowthISIN Div Reinvestment,Schemetype,"
          "Growth_div_type,ISIN Growth/Div Payout,ISIN Div Reinvestment,International,Region,isprimary_v1,"
          "rootPrimary_v1,Active_Passive,Budget,GoChanakya Short Code").split(",")


@pytest.fixture
def bucket(tmp_path, monkeypatch):
    rng = np.random.default_rng(7)
    rows, navs = [], []
    for i in range(6):  # 6 funds x (primary Regular Growth + Direct Growth)
        prim, direct = 100001 + 2 * i, 100002 + 2 * i
        for code, plan in ((prim, "Regular"), (direct, "Direct")):
            r = dict.fromkeys(HEADER, "")
            r.update({"AMC": "Northstar Asset Management Limited", "Code": str(code), "Scheme Name": f"Fund {i}",
                      "Scheme NAV Name": f"Fund {i} - {plan} Plan - Growth", "Scheme Category": "Equity Scheme",
                      "Sub-Category": "Large Cap Fund", "GOC_Category": "Equity Scheme", "GOC_sub_category": "Large Cap Fund",
                      "Launch Date": "01-Jan-2010", "Schemetype": plan, "Growth_div_type": "Growth",
                      "ISIN Growth/Div Payout": f"INF000X{code}", "isprimary_v1": "Y" if plan == "Regular" else "N",
                      "rootPrimary_v1": str(prim), "Active_Passive": "Active", "GoChanakya Short Code": "EQS-LRG"})
            rows.append(r)
            walk = 100 * np.exp(np.cumsum(rng.normal(0.0004, 0.01, N)))
            if i == 0:
                walk[-120:] /= 10  # a face-value change in the last 6 months
            navs.append(pd.DataFrame({"scheme_code": np.int32(code), "date": DAYS.date, "nav": walk, "month_end": False}))
    pd.DataFrame(rows, columns=HEADER).to_csv(tmp_path / "Scheme Master.csv", index=False)
    pd.concat(navs).to_parquet(tmp_path / "nav_history.parquet", index=False)
    pd.DataFrame({"GOC_ShortCode": "EQS-LRG", "amfi_code": [100001 + 2 * i for i in range(6)]}).to_csv(tmp_path / "mom.csv", index=False)
    pd.DataFrame({"isin": ["INF000X100001"], "scheme_name": "Fund 0", "amc": "x", "category": "EQS-LRG", "score": [91.2],
                  "status": ["Freshly computed"], "months_carried": [0], "mean_recovery": [30.44], "median_recovery": [3.0],
                  "longest_recovery": [304.4], "worst_fall_pct": [-35.0], "cycle_count": [40.0], "nav_history_years": [10.0],
                  "last_cycle_date": ["2026-08-01"], "last_fresh_date": ["2026-09-05"], "history_lookback_years": [10]}).to_parquet(tmp_path / "res.parquet")
    nav = pd.concat(navs)
    nav = nav.assign(date=pd.to_datetime(nav["date"]))
    nav["m"] = nav["date"].dt.to_period("M")
    me = nav.sort_values(["scheme_code", "date"]).groupby(["scheme_code", "m"]).tail(1)
    me["r"] = me.groupby("scheme_code")["nav"].pct_change() * 100
    me = me[me["m"].between(pd.Period("2023-09"), pd.Period("2026-08")) & me["scheme_code"].isin([100001 + 2 * i for i in range(6)])]
    pd.DataFrame({"amfi_code": me["scheme_code"].astype(int), "goc_shortcode": "EQS-LRG", "return_month": me["m"].astype(str),
                  "monthly_return_pct": me["r"]}).to_parquet(tmp_path / "mr.parquet", index=False)
    (tmp_path / "aum").mkdir()
    pd.DataFrame({"amficode": [100001, 100003], "scheme_name": ["F0", "F1"], "amc": "northstar", "as_on_date": pd.Timestamp("2026-08-31"),
                  "aum_lakhs": [12345.6, 777.0], "start_date": pd.Timestamp("2010-01-01"), "fund_age_years": [16.67, 16.67]}).to_parquet(tmp_path / "aum" / "2026-08.parquet")
    (tmp_path / "nse.json").write_text(json.dumps([{"unique_sr_no": "1", "scheme_code": "NS0-GR", "isin": "INF000X100001", "scheme_name": "FUND 0 REGULAR GROWTH",
        "settlement_type": "T2", "maturity_date": "31-12-2099", "purchase_allowed": "Y", "redemption_allowed": "Y", "sip_allowed": "Y",
        "purchase_transaction_mode": "DP", "new_purchase_min_amount": "1000", "scheme_start_date": "01-01-2010"}]))
    import extras
    monkeypatch.setattr(extras, "AUM_PREFIX", str(tmp_path / "aum"))
    monkeypatch.setattr(extras, "NSE_URI", str(tmp_path / "nse.json"))
    for k, v in {"SRC_URI": "nav_history.parquet", "SCHEME_MASTER_URI": "Scheme Master.csv", "MOMENTUM_UNIVERSE_URI": "mom.csv",
                 "RESILIENCE_URI": "res.parquet", "MONTHLY_RETURNS_URI": "mr.parquet", "DST_ROOT": "out"}.items():
        monkeypatch.setattr(core, k, str(tmp_path / v))
    monkeypatch.setattr(core, "now_ist", lambda: datetime(2026, 9, 26, 1, 0, tzinfo=core.IST))
    return tmp_path


def test_end_to_end(bucket):
    s = main.app.test_client().post("/run").get_json()
    assert s["fund_cards"] == 6 and s["returns_schemes"] == 12 and s["face_value_changes_adjusted"] >= 1
    out = bucket / "out"
    history_as_of = {
        "returns": s["as_of_date"],
        "category": "2026-09-26",
        "batting_average": "2026-08-31",
        "rank_momentum": "2026-08-31",
        "sip_3y": s["as_of_date"],
        "stress_events": s["as_of_date"],
        "recovery_speed": s["as_of_date"],
        "aum": "2026-08-31",
    }
    for name in main.DATASETS:
        for ext in ("json", "parquet", "xlsx"):
            assert (out / name / "latest" / f"{name}.{ext}").exists(), (name, ext)
            if name in history_as_of:
                as_of = history_as_of[name]
                assert (out / name / "history" / as_of[:7] / as_of / f"{name}.{ext}").exists(), (name, ext)
        if name in ("fund_cards", "nse_schemes"):
            assert not (out / name / "history").exists(), name
    assert (out / "category" / "latest" / "plan_map.parquet").exists()
    assert (out / "category" / "history" / "2026-09" / "2026-09-26" / "plan_map.parquet").exists()
    cards = json.loads((out / "fund_cards" / "latest" / "fund_cards.json").read_text())
    jsonschema.Draft202012Validator(json.load(open("fund_card.schema.json"))).validate(cards)
    c0 = next(c for c in cards["funds"] if c["scheme_code"] == "100001")
    assert c0["amc"]["short_name"] == "Northstar MF" and c0["plan"] == "Regular - Growth"
    assert c0["returns_pct"]["m3"] is not None and abs(c0["returns_pct"]["m3"]) < 50  # face value handled
    assert len(c0["recovery"]["events"]) == 6 and c0["rank_momentum"]["snapshots"][-1]["total"] == 6
    rec = json.loads((out / "recovery_speed" / "latest" / "recovery_speed.json").read_text())["funds"]["100001"]
    assert rec["resilience"]["score"] == 91.2 and rec["resilience"]["mean_recovery_months"] == 1.0
    bat = json.loads((out / "batting_average" / "latest" / "batting_average.json").read_text())
    assert bat["method"]["source"].endswith("mr.parquet") and bat["funds"]["100001"]["window_months"] == 12
    fv_month = [x for x in bat["funds"]["100001"]["monthly"] if x["adjusted"] == "face_value"]
    assert len(fv_month) == 1 and abs(fv_month[0]["fund_ret_pct"]) < 20  # the /10 month is corrected
    assert c0["aum"]["aum_lakhs"] == 12345.6 and c0["nse"]["scheme_code"] == "NS0-GR" and c0["nse"]["new_purchase_min_amount"] == 1000
    assert s["with_aum"] == 2 and s["with_nse"] == 1 and s["aum_month"] == "2026-08"
    plans = pq.read_table(out / "category" / "latest" / "plan_map.parquet").to_pandas()
    assert plans.set_index("plan_code").at["100002", "primary_code"] == "100001"


def test_gcs_path_with_space():
    fs, path = core.open_fs("gs://mf-data-public/Scheme Master.csv")
    assert fs.type_name == "gcs" and path == "mf-data-public/Scheme Master.csv"


# ---------------------------------------------------------------- returns (ported from returns-calc)
R_DAYS = pd.bdate_range(end=TODAY - pd.Timedelta(days=1), periods=900)
RN = len(R_DAYS)
GROWTH = 100 * (1 + np.arange(RN) / 1e4)


def return_cases():
    """code -> (raw dates, raw NAV, dates/NAV the right answer comes from, reset?)"""
    fv = GROWTH * np.where(np.arange(RN) < RN - 40, 10.0, 1.0) * np.where(np.arange(RN) == RN - 40, 0.98, 1)
    fv_ok = GROWTH * np.where(np.arange(RN) == RN - 40, 0.98, 1)
    spike = GROWTH.copy(); spike[RN - 60: RN - 58] *= 0.3
    keep = np.r_[0: RN - 60, RN - 58: RN]
    loss = GROWTH * np.where(np.arange(RN) < RN - 30, 1.0, 0.13)
    reset = np.where(np.arange(RN) < RN - 50, GROWTH * 1.5, 10.0 * (1 + np.arange(RN) / 1e4) / (1 + (RN - 50) / 1e4))
    return {
        "100001": (R_DAYS, GROWTH, R_DAYS, GROWTH, False),
        "100002": (R_DAYS[-70:], GROWTH[-70:], R_DAYS[-70:], GROWTH[-70:], False),  # new fund
        "100003": (R_DAYS[:-42], GROWTH[:-42], R_DAYS[:-42], GROWTH[:-42], False),  # stopped reporting
        "100005": (R_DAYS, fv, R_DAYS, fv_ok, False),  # face value /10 two months ago
        "100006": (R_DAYS, spike, R_DAYS[keep], GROWTH[keep], False),  # bad days dropped
        "100007": (R_DAYS, loss, R_DAYS, loss, False),  # unexplained -87% is a real loss
        "100008": (R_DAYS, reset, R_DAYS, reset, True),  # NAV reset to exactly 10
    }


def test_returns_match_step_by_step():
    cs = return_cases()
    df, fvd, rsd, _ = cleaned(*(frame(c, d, v) for c, (d, v, *_) in cs.items()))
    out = m.compute_returns(df, fvd, rsd, TODAY.date())
    assert set(out.index) == set(cs) - {"100003"}
    for code, (_, _, d, v, reset) in cs.items():
        if code == "100003":
            continue
        s = pd.Series(v, index=d)
        for key, months in m.PERIODS.items():
            target = s.index[-1] - pd.DateOffset(months=months)
            base = s[s.index <= target]
            exp = None if base.empty or target - base.index[-1] > pd.Timedelta(days=core.TOLERANCE_DAYS) else round((s.iloc[-1] / base.iloc[-1] - 1) * 100, 2)
            if reset and exp is not None and base.index[-1] < R_DAYS[RN - 50]:
                exp = None
            got = out.at[code, f"ret_{key}"]
            assert (pd.isna(got) and exp is None) or got == pytest.approx(exp, abs=0.011), (code, key, got, exp)


def test_momentum_six_month_move():
    """Fund 2 climbs from 3rd to 1st over 6 months as its monthly return overtakes the others."""
    frames = [frame(1, *monthly_path([0.03] * 12)), frame(3, *monthly_path([0.02] * 12)),
              frame(2, *monthly_path([0.0] * 6 + [0.10] * 6))]
    _, (M, SEG, _) = grid_for(frames)
    goc = pd.Series("A", index=["1", "2", "3"])
    funds, _, summary = m.momentum(M, SEG, goc, {"1", "2", "3"}, ["1", "2", "3"], pd.Period("2026-09"))
    f2 = funds["2"]
    assert f2["rank_6m_ago"] == 3 and f2["rank_now"] == 1 and f2["moved_6m"] == 2
    assert [x["rank"] for x in f2["last_6_months"]][-1] == 1 and len(f2["last_6_months"]) == 6
    row = summary.set_index("scheme_code").loc["1"]
    assert row["rank_now"] == 2 and row["moved_6m"] == -1


# ---------------------------------------------------------------- batting from monthly_returns
def mr_rows(code, group, rets, start="2025-09"):
    months = pd.period_range(start, periods=len(rets), freq="M").astype(str)
    return pd.DataFrame({"amfi_code": int(code), "goc_shortcode": group, "return_month": months, "monthly_return_pct": rets})


def test_batting_from_monthly_returns_uses_source_and_fixes_face_value():
    n = 12
    mr = pd.concat([
        mr_rows(1, "A", [2.0] * n), mr_rows(2, "A", [1.0] * n), mr_rows(3, "A", [0.0] * n),
        mr_rows(4, "A", [1.5] * 11 + [-89.85]),  # face-value /10 in the last month: really +1.5%
        mr_rows(5, "SOLO", [1.0] * n),  # alone in its category: no comparison
    ], ignore_index=True)
    d = pd.bdate_range("2025-08-01", "2026-09-10")
    fv = np.where(d < "2026-08-10", 1000.0, 100.0)  # /10 on 10 Aug 2026
    clean, *_ = cleaned(frame(4, d, fv), frame(1, d, 10.0))
    funds, t, s36, last = m.batting_from_monthly_returns(mr, clean, ["1", "2", "3", "4", "5"])
    assert last == "2026-08"
    aug = t[t["month"].eq("2026-08")].set_index("scheme_code")
    assert aug.at["4", "adjusted"] == "face_value" and aug.at["4", "fund_ret_pct"] == pytest.approx(1.5, abs=0.01)
    assert aug.at["1", "adjusted"] == "category_average" and aug.at["1", "category_avg_pct"] == pytest.approx(1.125, abs=0.01)
    assert funds["1"]["months_beat"] == 12 and funds["3"]["months_beat"] == 0  # 2% > 1.125% avg; 0% never
    assert funds["2"]["monthly"][0]["beat"] == 0 and funds["2"]["monthly"][-1]["beat"] == 0  # 1.0 not > 1.0
    assert all(x["beat"] in (0, 1) and isinstance(x["beat"], int) for x in funds["1"]["monthly"])
    assert "5" not in funds  # never compared with itself
    assert funds["1"]["last_36"] == {"months_available": 12, "comparable_months": 12, "months_beat": 12, "score": 100.0}


def test_batting_needs_six_months_from_monthly_returns():
    mr = pd.concat([mr_rows(1, "A", [1.0] * 5, "2026-04"), mr_rows(2, "A", [0.5] * 12), mr_rows(3, "A", [0.8] * 12)], ignore_index=True)
    clean, *_ = cleaned(frame(1, DAYS[-50:], 10.0))
    funds, *_ = m.batting_from_monthly_returns(mr, clean, ["1", "2", "3"])
    assert "1" not in funds and funds["2"]["window_months"] == 12


def test_batting_falls_back_when_monthly_returns_missing(bucket, monkeypatch):
    monkeypatch.setattr(core, "MONTHLY_RETURNS_URI", str(bucket / "does_not_exist.parquet"))
    main.run()
    bat = json.loads((bucket / "out" / "batting_average" / "latest" / "batting_average.json").read_text())
    assert bat["method"]["source"].endswith("(fallback)") and bat["funds"]["100001"]["monthly"][0]["beat"] in (0, 1)


# ---------------------------------------------------------------- AUM + NSE
import extras as X


def sm_frame(rows):
    """Minimal Scheme Master indexed by Code: rows = (code, root, isin_growth, isin_reinvest, nav_name)."""
    return pd.DataFrame([{"Code": c, "rootPrimary_v1": r, "ISIN Growth/Div Payout": g, "ISIN Div Reinvestment": v,
                          "Scheme NAV Name": nm} for c, r, g, v, nm in rows]).set_index("Code")


def test_aum_takes_latest_month_by_file_name_and_maps_to_fund(tmp_path):
    for month, aum in (("2026-07", 1.0), ("2026-08", 2.0), ("2025-12", 9.0)):
        pd.DataFrame({"amficode": [101, 202], "scheme_name": ["A", "B"], "amc": "x", "as_on_date": pd.Timestamp(f"{month}-28"),
                      "aum_lakhs": [aum, aum * 10], "start_date": pd.Timestamp("2010-01-01"), "fund_age_years": [16.5, None]}
                     ).to_parquet(tmp_path / f"{month}.parquet")
    (tmp_path / "notes.txt").write_text("ignored")
    raw, month, prev = X.load_latest_aum(str(tmp_path))
    assert month == "2026-08" and prev == 2 and raw["aum_lakhs"].tolist() == [2.0, 20.0]
    sm = sm_frame([("101", "100", None, None, ""), ("100", "100", None, None, ""), ("202", "202", None, None, "")])
    funds, t = X.aum_dataset(raw, sm, ["100", "202"])
    assert funds["100"]["aum_lakhs"] == 2.0 and funds["100"]["amficode"] == "101"  # a non-primary code lands on its fund
    assert funds["202"]["fund_age_years"] is None and len(t) == 2


def nse_row(**kw):
    base = {"unique_sr_no": "1", "scheme_code": "X", "isin": "INF1", "scheme_name": "ALPHA FUND REGULAR GROWTH",
            "settlement_type": "T2", "maturity_date": "31-12-2099", "purchase_allowed": "Y", "redemption_allowed": "Y",
            "sip_allowed": "Y", "purchase_transaction_mode": "DP", "new_purchase_min_amount": "1000", "scheme_start_date": "01-01-2010"}
    return {**base, **kw}


def test_nse_selects_live_retail_code_and_matches_by_isin(tmp_path):
    rows = [
        nse_row(unique_sr_no="1", scheme_code="A-L1", settlement_type="L1", new_purchase_min_amount="200000", redemption_allowed="N"),
        nse_row(unique_sr_no="2", scheme_code="A-NFO", settlement_type="MF", maturity_date="01-01-2025"),
        nse_row(unique_sr_no="3", scheme_code="A-GR"),  # the live retail code
        nse_row(unique_sr_no="4", scheme_code="B-NFO", isin="INF2", settlement_type="MF", maturity_date="01-01-2025"),
        nse_row(unique_sr_no="5", scheme_code="B-L1", isin="INF2", settlement_type="L1", new_purchase_min_amount="200000"),
        nse_row(unique_sr_no="6", scheme_code="C-DR", isin="INF3R"),  # reinvestment ISIN of plan 102
        nse_row(unique_sr_no="7", scheme_code="JUNK", isin="IN123", scheme_name="432423243"),
    ]
    (tmp_path / "funds.json").write_text(json.dumps([{k: str(v) for k, v in r.items()} for r in rows]))
    n = X.load_nse(str(tmp_path / "funds.json"))
    assert n.loc[0, "new_purchase_min_amount"] == 200000 and n.loc[0, "maturity_date"] == "2099-12-31"
    sm = sm_frame([("100", "100", "INF1", None, "Alpha Fund Regular Growth"), ("101", "101", "INF2", None, "Beta"),
                   ("102", "100", "INF3G", "INF3R", "Alpha Fund Regular IDCW")])
    card, plans, t = X.nse_dataset(n, sm, ["100", "101"], pd.Timestamp("2026-09-26").date())
    assert card["100"]["scheme_code"] == "A-GR"  # live T2 beats L1 and the closed NFO code
    assert card["101"]["scheme_code"] == "B-L1"  # only a live L1 exists: better than a closed NFO code
    assert plans["102"]["primary_code"] == "100" and plans["102"]["isins"][0]["isin_type"] == "reinvestment"
    assert t.loc[t["scheme_code"].eq("JUNK"), "plan_code"].isna().all() and t["selected"].sum() == 3
