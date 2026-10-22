"""backend-main: builds every fund-card dataset daily from nav_history.parquet + Scheme Master.

Writes gs://mf-data-public/backend_main_kartik/<dataset>/latest/<dataset>.{json,parquet,xlsx}.
Historical datasets also write to history/YYYY-MM/YYYY-MM-DD/. fund_cards and nse_schemes are latest-only.
Cloud Run service: Cloud Scheduler POSTs to /run daily. Locally: `python main.py`.
"""
import pandas as pd
from flask import Flask, jsonify

import cards as C
import core
import extras as X
import metrics as m

DATASETS = ("returns", "category", "batting_average", "rank_momentum", "sip_3y", "stress_events", "recovery_speed",
            "aum", "nse_schemes", "fund_cards")
PCT, DATE = "0.00%", "dd-mmm-yyyy"
UPPER = {"isin": "ISIN", "nav": "NAV", "amc": "AMC", "goc": "GOC", "sebi": "SEBI", "sip": "SIP", "1m": "1M", "2m": "2M", "3m": "3M", "4m": "4M", "5m": "5M", "6m": "6M", "1y": "1Y", "fii": "FII", "ilfs": "IL&FS", "nse": "NSE", "rta": "RTA", "sr": "SR", "no": "No", "stp": "STP", "swp": "SWP", "ind": "Ind"}


def label(col: str) -> str:
    """snake_case column -> readable Excel header: 'amc_short_name' -> 'AMC Short Name', 'ret_3m_pct' -> 'Ret 3M %'."""
    col = str(col)
    if col != col.lower():  # already a readable header, e.g. "Scheme Name"
        return col
    return " ".join(UPPER.get(w, "%" if w == "pct" else w.capitalize()) for w in col.split("_"))


def momentum_universe(primary) -> set:
    """Funds ranked by momentum-rank (its shortlist); falls back to all primaries if unreadable."""
    try:
        fs, path = core.open_fs(core.MOMENTUM_UNIVERSE_URI)
        with fs.open_input_file(path) as f:
            return set(pd.read_csv(f, usecols=["amfi_code"])["amfi_code"].astype(str))
    except Exception as exc:
        core.log.warning("Momentum universe unavailable (%s); ranking all primary funds", exc)
        return set(primary)


def batting_section(prim, M, SEG, goc, codes, as_of_month):
    """Batting from monthly_returns (face-value months corrected); NAV-based fallback if unreadable.
    Returns (funds, 12-month long table, 36-month summary or None, source month, source label)."""
    try:
        fs, path = core.open_fs(core.MONTHLY_RETURNS_URI)
        with fs.open_input_file(path) as f:
            mr = pd.read_parquet(f)
        funds, long, s36, last = m.batting_from_monthly_returns(mr, prim, codes)
        first = str(pd.Period(last) - 11)
        return funds, long, s36, last, core.MONTHLY_RETURNS_URI, long[long["month"].ge(first) & long["beat"].notna()]
    except Exception as exc:
        core.log.warning("monthly_returns unavailable (%s); batting falls back to NAV month-ends", exc)
        funds, long = m.batting(M, SEG, goc, codes, as_of_month)
        long["beat"] = long["beat"].astype(int)
        for f in funds.values():
            f["monthly"] = [{**x, "beat": int(x["beat"])} for x in f["monthly"]]
        return funds, long, None, str(as_of_month - 1), f"{core.SRC_URI} (fallback)", long


def run() -> dict:
    today = core.now_ist().date()
    core.ensure_folders(DATASETS)
    sm = core.load_scheme_master()
    primary = sm.index[sm["isprimary_v1"].eq("Y")]
    recent_raw, primary_raw = core.load_nav(today, primary)

    # Returns: every plan, last 400 days
    recent, fv, reset, spikes = core.clean_jumps(recent_raw)
    del recent_raw
    ret = m.compute_returns(recent, fv, reset, today)
    if ret.empty:
        raise RuntimeError("No active schemes found; refusing to overwrite latest/ with empty output")
    as_of = ret["nav_date"].max()
    as_of_s, as_of_month = as_of.date().isoformat(), as_of.to_period("M")
    ret_funds = m.returns_funds(ret)

    # Everything else: active primary plans (one per fund), full history since 2015
    del recent
    prim, *_ = core.clean_jumps(primary_raw)
    del primary_raw
    codes = sorted(set(primary) & set(ret.index))
    goc, names = sm["GoChanakya Short Code"], sm["Scheme Name"]
    M, SEG, DATES = m.month_end_grid(prim, as_of_month)
    latest = prim.groupby("scheme_code", sort=False).tail(1).set_index("scheme_code")[["nav_date", "nav", "seg"]]

    cat_funds, cat_t, plan_map = m.category(sm, codes)
    bat_funds, bat_all, bat_36, bat_month, bat_src, bat_t = batting_section(prim, M, SEG, goc, codes, as_of_month)
    bat_asof = pd.Period(bat_month).end_time.date().isoformat()  # month-end of the latest month in the source
    mom_funds, mom_t, mom_s = m.momentum(M, SEG, goc, momentum_universe(primary), codes, as_of_month)
    sip_funds, sip_t = m.sip_3y(M, SEG, DATES, latest, codes)
    st_funds, st_t = m.stress_events(prim, codes, sm["launch_date"])
    res = m.load_resilience(core.RESILIENCE_URI, sm, primary)
    rec_funds, rec_t = m.recovery_speed(st_t, goc, res, codes)
    try:
        aum_raw, aum_month, aum_prev = X.load_latest_aum()
        aum_funds, aum_t = X.aum_dataset(aum_raw, sm, codes)
        if aum_prev and len(aum_raw) < 0.8 * aum_prev:
            core.log.warning("AUM %s has %d rows vs %d the month before: file may be incomplete", aum_month, len(aum_raw), aum_prev)
    except Exception as exc:
        core.log.warning("AUM unavailable (%s)", exc)
        aum_funds, aum_t, aum_month, aum_prev = {}, None, None, None
    try:
        nse_card, nse_plans, nse_t = X.nse_dataset(X.load_nse(), sm, codes, today)
    except Exception as exc:
        core.log.warning("NSE schemes unavailable (%s)", exc)
        nse_card, nse_plans, nse_t = {}, {}, None
    card_funds = C.build_cards(codes, cat_funds, ret_funds, bat_funds, mom_funds, sip_funds, st_funds, rec_funds, aum_funds, nse_card)

    month_end = (as_of_month - 1).end_time.date().isoformat()
    sections = {"returns": as_of_s, "category": today.isoformat(), "batting_average": bat_asof,
                "rank_momentum": month_end, "sip_3y": as_of_s, "stress_events": as_of_s, "recovery_speed": as_of_s,
                "aum": aum_month and pd.Period(aum_month).end_time.date().isoformat(), "nse_schemes": today.isoformat()}
    name = lambda s: s.map(names)

    # ---- returns (all plans; same JSON as before)
    ret_x = ret.reset_index()
    ret_x.insert(1, "scheme_name", ret_x["scheme_code"].map(sm["Scheme NAV Name"]))
    ret_x[[f"ret_{k}" for k in m.PERIODS]] = ret_x[[f"ret_{k}" for k in m.PERIODS]].div(100)
    ret_x = ret_x[["scheme_code", "scheme_name", "nav", "nav_date", "ret_m3", "ret_m6", "ret_y1", "base_date_m3",
                   "base_date_m6", "base_date_y1", "fv_change_date", "nav_reset_date"]]
    ret_x.columns = ["Scheme Code", "Scheme Name", "NAV (Rs)", "NAV Date", "3M Return", "6M Return", "1Y Return",
                     "3M From", "6M From", "1Y From", "Face-value Change On", "NAV Reset On"]
    core.write_dataset(
        "returns", as_of_s, core.envelope("returns", as_of_s, ret_funds, method="point_to_point_absolute_pct"),
        ret.reset_index(),
        core.to_excel_bytes([("Returns", ret_x, {"NAV (Rs)": "#,##0.0000", "3M Return": PCT, "6M Return": PCT, "1Y Return": PCT})], {
            "As of": as_of_s, "Schemes": len(ret_x),
            "Return": "Latest NAV / NAV on the last date on or before the same date 3, 6 or 12 months earlier - 1 (absolute).",
            "Blank": "No NAV within 7 days of that earlier date (fund too new or data gap), or a NAV reset in the period.",
            "Face-value change": "One-day NAV move within 5% of x10 or x100; older NAVs rescaled so the return stays correct.",
            "NAV reset": "NAV landed on exactly 10 / 100 / 1,000 after a big one-day move (payout or plan reset).",
            "Source": f"{core.SRC_URI} (last {core.LOOKBACK_DAYS} days), every plan"}),
    )

    # ---- category
    cx = cat_t.rename(columns=label)
    px = plan_map.rename(columns=label)
    core.write_dataset(
        "category", today.isoformat(), core.envelope("category", today.isoformat(), cat_funds), cat_t,
        core.to_excel_bytes([("Funds", cx, {}), ("Plans", px, {})], {
            "As of": today.isoformat(), "Funds": len(cx),
            "Scope": "One row per fund: its primary plan (isprimary_v1 = Y) with a NAV in the last 10 days.",
            "Plans sheet": "Every plan code (Direct/Regular, Growth/IDCW) mapped to the primary plan of its fund.",
            "Source": core.SCHEME_MASTER_URI}),
    )
    if True:  # plan map also as its own parquet for lookups (any plan code -> fund card)
        fs, root = core.open_fs(f"{core.DST_ROOT}/category")
        import pyarrow as pa, pyarrow.parquet as pq

        for sub in ("latest", core.history_subpath(today.isoformat())):
            folder = f"{root}/{sub}"
            if fs.type_name == "local":
                fs.create_dir(folder, recursive=True)
            pq.write_table(pa.Table.from_pandas(plan_map, preserve_index=False), f"{folder}/plan_map.parquet", filesystem=fs)

    # ---- batting average
    months = sorted(bat_t["month"].unique())
    bw = bat_t.assign(v=bat_t["beat"].astype(int).map({1: "Beat", 0: "Missed"})).pivot(index="scheme_code", columns="month", values="v")
    bw = bw.reindex(columns=months).fillna("")
    bw.columns = [pd.Period(c).strftime("%b %Y") for c in bw.columns]
    bs = pd.DataFrame({c: [f[k] for f in bat_funds.values()] for c, k in (("Months Beat (12M)", "months_beat"), ("Months Counted (12M)", "window_months"))},
                      index=list(bat_funds))
    if bat_36 is not None:
        bs = bs.join(bat_36.set_index("scheme_code").rename(columns={"months_beat_36": "Months Beat (36M)",
                     "comparable_months_36": "Months Counted (36M)", "score_36": "Score 36M (%)"})[["Months Beat (36M)", "Months Counted (36M)", "Score 36M (%)"]])
    bx = bs.join(bw).rename_axis("scheme_code").reset_index()
    bx.insert(1, "Scheme Name", name(bx["scheme_code"]))
    bx.insert(2, "Category", bx["scheme_code"].map(goc))
    adj = bat_all[bat_all["adjusted"].notna()] if "adjusted" in bat_all else bat_all.iloc[0:0]
    sheets = [("Batting", bx.rename(columns={"scheme_code": "Scheme Code"}), {})]
    if len(adj):
        ax = adj[["scheme_code", "month", "group", "fund_ret_pct", "category_avg_pct", "beat", "adjusted"]].copy()
        ax.insert(1, "Scheme Name", name(ax["scheme_code"]))
        sheets.append(("Adjusted Months", ax.rename(columns=label), {}))
    core.write_dataset(
        "batting_average", bat_asof, core.envelope("batting_average", bat_asof, bat_funds, method={
            "source": bat_src, "window_months": 12, "min_months": 6, "beat": "1 = month return above the average of all funds in the same GoChanakya Short Code that month, 0 = not",
            "corrections": "face-value months: fund return corrected by the exact power of 10 and that category-month's average recalculated from the same file; months spanning a NAV reset left out"}),
        bat_all, core.to_excel_bytes(sheets, {
            "As of": f"last completed month {bat_month}", "Funds": len(bx), "Source": bat_src,
            "Beat": "1 / Beat = the fund's return that month was above the average of all funds in its GoChanakya category; 0 / Missed = not.",
            "Rules": "Last 12 months for the card (needs 6 or more); 36-month totals for reference.",
            "Adjusted Months sheet": "Months changed from the source file: face_value = the fund's own face-value change corrected; category_average = the category average was recalculated because another fund's face-value change distorted it."}),
    )

    # ---- rank momentum
    mw = mom_t.assign(v=mom_t["rank"].astype(str) + "/" + mom_t["total"].astype(str)).pivot(index="scheme_code", columns="date", values="v")
    mw = mw.reindex(columns=sorted(mw.columns)).fillna("")
    mw.columns = [c.strftime("%b %Y") for c in mw.columns]
    ms = mom_s.set_index("scheme_code")[["rank_now", "total_now", "rank_6m_ago", "total_6m_ago", "moved_6m"]]
    mx = ms.join(mw).reset_index()
    mx.insert(1, "Scheme Name", name(mx["scheme_code"]))
    mx.insert(2, "Group", mx["scheme_code"].map(goc))
    mx = mx.rename(columns={"rank_now": "Rank Now", "total_now": "Of (Now)", "rank_6m_ago": "Rank 6M Ago",
                            "total_6m_ago": "Of (6M Ago)", "moved_6m": "Places Climbed (6M)"})
    core.write_dataset(
        "rank_momentum", month_end, core.envelope("rank_momentum", month_end, mom_funds, method={
            "basis": "rolling 6-month return at each month-end, ranked within GoChanakya Short Code (1 = best)",
            "universe": "funds in momentum-rank's shortlist", "snapshots": 12}),
        mom_t, core.to_excel_bytes([("Rank", mx.rename(columns={"scheme_code": "Scheme Code"}), {})], {
            "As of": month_end, "Funds": len(mx),
            "Cell": "rank / number of funds ranked in the same GoChanakya category that month-end (1 = best 6-month return).",
            "Places Climbed (6M)": "Rank 6 months ago minus rank now: positive = climbed, negative = slipped.",
            "Universe": "Same fund list and method as momentum-rank; returns are face-value adjusted.",
            "Source": core.SRC_URI}),
    )

    # ---- 3-year SIP
    sx = sip_t.copy()
    sx.insert(1, "Scheme Name", name(sx["scheme_code"]))
    sx.insert(2, "Category", sx["scheme_code"].map(sm["category_label"]))
    sx["abs_return_pct"] = sx["abs_return_pct"] / 100
    sx = sx.rename(columns=label)
    money = {c: "#,##0" for c in ("Invested", "Current Value", "Gain", "Savings Value", "Extra Vs Savings")}
    core.write_dataset(
        "sip_3y", as_of_s, core.envelope("sip_3y", as_of_s, sip_funds, method={
            "monthly_amount": 5000, "months": 36, "savings_rate_pa": 0.035,
            "sip_nav_rule": "last available NAV in each of the 36 completed calendar months before the latest NAV month",
            "valuation_nav_rule": "latest available NAV", "adjustment": "face-value changes rescaled; no result across a NAV reset"}),
        sip_t, core.to_excel_bytes([("SIP", sx, {**money, "Abs Return %": PCT})], {
            "As of": as_of_s, "Funds": len(sx),
            "Method": "Rs 5,000 invested on the last NAV of each of the 36 completed months before the latest NAV month, valued at the latest NAV.",
            "Savings value": "The same Rs 5,000 a month in a 3.5% p.a. savings account (monthly compounding).",
            "Left out": "Funds without a NAV in all 36 months, or with a NAV reset inside the window.",
            "Source": core.SRC_URI}),
    )

    # ---- stress events
    stx = st_t[["scheme_code", "name", "start_date", "end_date", "status", "fall_pct", "recovery_months", "recovered_pct", "reason",
                "start_nav_date", "max_fall_date", "recovery_date"]].copy()
    stx.insert(1, "Scheme Name", name(stx["scheme_code"]))
    stx[["fall_pct", "recovered_pct"]] = stx[["fall_pct", "recovered_pct"]].astype(float) / 100
    stx = stx.rename(columns={"name": "Event"}).rename(columns=label)
    core.write_dataset(
        "stress_events", as_of_s, core.envelope("stress_events", as_of_s, st_funds, method={
            "start_nav": "last NAV on or before the event start (within 7 days)",
            "fall_pct": "lowest NAV between event start and end vs the start NAV (positive = fell)",
            "recovery": "first date after the lowest point when NAV is back to the start NAV; months = days from event start / 30.44",
            "recovering": "not back yet: recovered_pct = how much of the fall has been regained by the latest NAV",
            "events": [{"event_code": c, "name": n, "start_date": a, "end_date": b} for c, n, a, b in m.EVENTS]}),
        st_t, core.to_excel_bytes([("Stress Events", stx, {"Fall %": PCT, "Recovered %": PCT, "Recovery Months": "0.00"})], {
            "As of": as_of_s, "Rows": len(stx),
            "Method": "Same rules as resilience-score-v2 exceptional timelines, on face-value-adjusted NAV. The 2026 event also gets a recovery.",
            "Not applicable": "launched_after = fund started after the event; no_data = no NAV near the event start; nav_reset = NAV reset breaks the comparison.",
            "Source": core.SRC_URI}),
    )

    # ---- recovery speed
    rx = rec_t.copy()
    rx.insert(1, "Scheme Name", name(rx["scheme_code"]))
    rx = rx.rename(columns=label)
    core.write_dataset(
        "recovery_speed", as_of_s, core.envelope("recovery_speed", as_of_s, rec_funds, method={
            "typical_months": "median recovery time across the market events the fund recovered from (1 or more)",
            "category_typical_months": "for those same events, the median recovery time of funds in the same GoChanakya Short Code (at least 3 funds per event), then the median across the events",
            "resilience": "resilience-score-v2 figures for reference (its recovery counts every dip, so it is much shorter)"}),
        rec_t, core.to_excel_bytes([("Recovery Speed", rx, {})], {
            "As of": as_of_s, "Funds": len(rx),
            "Typical months": "Median time to get back to the pre-fall NAV across the stress events the fund recovered from (1 or more; see Events Used).",
            "Category typical": "How funds in the same GoChanakya category did in the SAME events: median recovery per event (at least 3 funds), then the median across those events.",
            "Recovering events": "Events the fund has not yet recovered from (not counted in the typical figure).",
            "Resilience columns": f"From {core.RESILIENCE_URI}; recovery converted from days to months (/30.44).",
            "Source": core.SRC_URI}),
    )

    # ---- AUM (latest monthly file)
    if aum_t is not None:
        aum_asof = sections["aum"]
        ax = aum_t.copy()
        ax.insert(1, "Fund Name", name(ax["scheme_code"]))
        ax["on_card"] = ax["scheme_code"].isin(set(aum_funds))
        core.write_dataset(
            "aum", aum_asof, core.envelope("aum", aum_asof, aum_funds, method={
                "source": f"{X.AUM_PREFIX}/{aum_month}.parquet", "month": aum_month,
                "match": "amficode -> the fund's primary plan via Scheme Master rootPrimary_v1"}),
            aum_t, core.to_excel_bytes([("AUM", ax.rename(columns=label), {"AUM Lakhs": "#,##0.00"})], {
                "As of": aum_month, "Rows": len(ax), "Source": f"{X.AUM_PREFIX}/{aum_month}.parquet (latest month by file name)",
                "Rows previous month": aum_prev, "On Card": "True = this fund has a fund card (primary plan with a NAV in the last 10 days)."}),
        )

    # ---- NSE schemes (every NSE order code, matched by ISIN)
    if nse_t is not None:
        nx = nse_t.copy()
        nx.insert(0, "Fund Name", name(nx["primary_code"]))
        core.write_dataset(
            "nse_schemes", today.isoformat(), core.envelope("nse_schemes", today.isoformat(), nse_plans, method={
                "source": X.NSE_URI, "match": "NSE isin = Scheme Master 'ISIN Growth/Div Payout' or 'ISIN Div Reinvestment' of a plan",
                "order_code": "per ISIN: live code first (closed NFO codes last), normal settlement over L0/L1, purchase/redemption/SIP allowed, DP mode, closest name, newest"},
                nse_rows=len(nse_t), nse_rows_matched=int(nse_t["plan_code"].notna().sum())),
            nse_t, core.to_excel_bytes([("NSE Order Codes", nx, {})], {
                "As of": today.isoformat(), "Rows": len(nx), "Source": X.NSE_URI,
                "Plan Code": "AMFI code of the plan whose ISIN matches (blank = no match in the Scheme Master).",
                "Selected": "True = the order code shown on the fund card / used by the app for that ISIN."}),
            keep_history=False,
        )

    # ---- fund cards (all sections combined, contract v1.1)
    card_list = list(card_funds.values())
    payload = {"schema_version": "1.1", "as_of_date": as_of_s, "generated_at": core.now_ist().isoformat(timespec="seconds"),
               "sections_as_of": sections, "count": len(card_list), "funds": card_list}
    ct = C.cards_table(card_funds, pd.Timestamp(month_end))
    pct_cols = [c for c in ct.columns if c.endswith("_pct")]
    cx2 = ct.copy()
    cx2[pct_cols] = cx2[pct_cols].astype(float) / 100
    cx2 = cx2.rename(columns=label)
    core.write_dataset(
        "fund_cards", as_of_s, payload, ct,
        core.to_excel_bytes([("Fund Cards", cx2, {label(c): PCT for c in pct_cols})], {
            "As of": as_of_s, "Funds": len(cx2),
            "What": "One row per fund with the key number from every section. The JSON holds the full card for the app.",
            "Not yet included": "Fund persona, personality match and hook (null in the JSON); alternates are empty.",
            **{f"{k} as of": v for k, v in sections.items()}}),
        keep_history=False,
    )

    summary = {
        "as_of_date": as_of_s,
        "returns_schemes": len(ret_funds),
        "fund_cards": len(card_list),
        "with_batting": len(bat_funds),
        "with_momentum": len(mom_funds),
        "with_sip_3y": len(sip_funds),
        "with_typical_recovery": int(rec_t["typical_months"].notna().sum()),
        "with_resilience": int(rec_t["resilience_score"].notna().sum()) if "resilience_score" in rec_t else 0,
        "with_aum": len(aum_funds),
        "aum_month": aum_month,
        "with_nse": len(nse_card),
        "face_value_changes_adjusted": int(ret["fv_change_date"].notna().sum()),
        "nav_resets": int(ret["nav_reset_date"].notna().sum()),
        "bad_nav_days_dropped": spikes,
        "output": core.DST_ROOT,
    }
    core.log.info("backend-main done %s", summary)
    return summary


app = Flask(__name__)


@app.post("/run")
def run_endpoint():
    return jsonify(run())


if __name__ == "__main__":
    run()
