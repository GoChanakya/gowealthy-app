"""Per-dataset calculations on cleaned NAV (core.clean_jumps).

Each function returns (funds, table): funds = {scheme_code: JSON-ready section} for the app,
table = flat DataFrame for Parquet/Excel. Methods mirror the existing services exactly (verified
against their outputs) but run on face-value-adjusted NAV and never compare across a NAV reset.
"""
from datetime import timedelta

import numpy as np
import pandas as pd

from core import DAYS_PER_MONTH, STALE_DAYS, TOLERANCE_DAYS, amc_short_name

PERIODS = {"m3": 3, "m6": 6, "y1": 12}  # returns: key -> calendar months
EVENTS = [  # (contract code, name, start, end) — same dates as resilience-score-v2 exceptional timelines
    ("YUAN_2015", "Chinese Yuan Devaluation", "2015-08-21", "2016-02-10"),
    ("DEMO_2016", "Demonetization in India", "2016-10-31", "2016-12-31"),
    ("ILFS_2018", "IL&FS Liquidity Crisis", "2018-08-15", "2018-10-15"),
    ("COVID_2020", "Covid-19 Crisis & Lockdown", "2020-02-15", "2020-04-10"),
    ("FII_2021", "Massive FII Selloff", "2021-10-20", "2021-12-31"),
    ("IRAN_2026", "US and Israel Attack on Iran", "2026-02-25", "2026-07-18"),
]


def _r(x, n=2):
    return None if x is None or pd.isna(x) else round(float(x), n)


# ---------------------------------------------------------------- returns (all plans, unchanged logic)
def compute_returns(clean: pd.DataFrame, fv_dates: pd.Series, reset_dates: pd.Series, today) -> pd.DataFrame:
    """One row per active scheme: latest NAV, 3M/6M/1Y point-to-point returns (%), base dates, audit dates."""
    out = clean.groupby("scheme_code", sort=False).tail(1).set_index("scheme_code")[["nav_date", "nav"]]
    out = out[out["nav_date"].ge(pd.Timestamp(today - timedelta(days=STALE_DAYS)))]
    out["fv_change_date"] = fv_dates.reindex(out.index)
    out["nav_reset_date"] = reset_dates.reindex(out.index)
    hist = (
        clean[["scheme_code", "nav_date", "nav_adj"]]
        .rename(columns={"nav_date": "base_date", "nav_adj": "base_nav"})
        .sort_values("base_date", kind="stable")
    )
    for key, months in PERIODS.items():
        base = pd.merge_asof(
            pd.DataFrame(
                {"scheme_code": out.index, "target": (out["nav_date"] - pd.DateOffset(months=months)).to_numpy()}
            ).sort_values("target"),
            hist,
            left_on="target",
            right_on="base_date",
            by="scheme_code",
            direction="backward",
            tolerance=pd.Timedelta(days=TOLERANCE_DAYS),
        ).set_index("scheme_code")
        out[f"base_date_{key}"] = base["base_date"]
        out[f"ret_{key}"] = (
            out["nav"].div(base["base_nav"]).sub(1).mul(100).round(2)
            .where(~(out["nav_reset_date"] > out[f"base_date_{key}"]))
        )
    return out


def returns_funds(out: pd.DataFrame) -> dict:
    rets = out[[f"ret_{k}" for k in PERIODS]]
    rets = rets.astype(object).where(rets.notna(), None)
    return {
        code: {"nav": {"value": nav, "date": d.date().isoformat()}, "returns_pct": dict(zip(PERIODS, r))}
        for code, nav, d, r in zip(out.index, out["nav"], out["nav_date"], rets.itertuples(index=False))
    }


# ---------------------------------------------------------------- category (Scheme Master)
def category(sm: pd.DataFrame, codes) -> tuple[dict, pd.DataFrame, pd.DataFrame]:
    """Identity + category per primary scheme, and every plan code mapped to its primary."""
    p = sm.loc[list(codes)]
    plans = sm[sm["rootPrimary_v1"].isin(p.index)].reset_index()
    plan_map = pd.DataFrame(
        {
            "plan_code": plans["Code"],
            "primary_code": plans["rootPrimary_v1"],
            "plan_nav_name": plans["Scheme NAV Name"],
            "plan_type": plans["Schemetype"],
            "option": plans["Growth_div_type"],
            "isin": plans["ISIN Growth/Div Payout"],
        }
    ).sort_values(["primary_code", "plan_code"], ignore_index=True)
    by_primary = {k: g.drop(columns="primary_code").to_dict("records") for k, g in plan_map.groupby("primary_code")}

    short = p["AMC"].map(amc_short_name)
    table = pd.DataFrame(
        {
            "scheme_code": p.index,
            "isin": p["ISIN Growth/Div Payout"].to_numpy(),
            "name": p["Scheme Name"].to_numpy(),
            "nav_name": p["Scheme NAV Name"].to_numpy(),
            "plan": (p["Schemetype"] + " - " + p["Growth_div_type"]).to_numpy(),
            "amc_name": p["AMC"].to_numpy(),
            "amc_short_name": (short + " MF").to_numpy(),
            "amc_code": short.str.lower().str.replace(r"[^a-z0-9]+", "-", regex=True).str.strip("-").to_numpy(),
            "goc_short_code": p["GoChanakya Short Code"].to_numpy(),
            "category_label": p["category_label"].to_numpy(),
            "category_group": p["GOC_Category"].to_numpy(),
            "sebi_category": p["Scheme Category"].to_numpy(),
            "sebi_sub_category": p["Sub-Category"].to_numpy(),
            "benchmark": p["Benchmark"].to_numpy(),
            "launch_date": p["launch_date"].to_numpy(),
            "active_passive": p["Active_Passive"].to_numpy(),
            "plan_count": [len(by_primary.get(c, [])) for c in p.index],
        }
    )
    funds = {
        r.scheme_code: {
            "isin": r.isin,
            "name": r.name,
            "nav_name": r.nav_name,
            "plan": r.plan,
            "amc": {"code": r.amc_code, "name": r.amc_name, "short_name": r.amc_short_name},
            "category": {
                "goc_short_code": r.goc_short_code,
                "label": r.category_label,
                "group": r.category_group,
                "sebi_category": r.sebi_category,
                "sebi_sub_category": r.sebi_sub_category,
            },
            "benchmark": r.benchmark,
            "launch_date": r.launch_date,
            "active_passive": r.active_passive,
            "plans": by_primary.get(r.scheme_code, []),
        }
        for r in table.astype(object).where(table.notna(), None).itertuples(index=False)
    }
    return funds, table, plan_map


# ---------------------------------------------------------------- month-end grid (primaries)
def month_end_grid(clean: pd.DataFrame, as_of_month: pd.Period):
    """Last cleaned NAV of each completed calendar month (months before as_of_month) per scheme.
    Returns (M = nav_adj, SEG = segment, DATES = NAV date), all scheme x month with every month present."""
    me = clean.assign(ym=clean["nav_date"].dt.to_period("M"))
    me = me[me["ym"] < as_of_month].groupby(["scheme_code", "ym"], sort=False).tail(1)
    months = pd.period_range(me["ym"].min(), as_of_month - 1, freq="M")
    grid = lambda col: me.pivot(index="scheme_code", columns="ym", values=col).reindex(columns=months)
    return grid("nav_adj"), grid("seg"), grid("nav_date")


def period_return(M: pd.DataFrame, SEG: pd.DataFrame, p: pd.Period, lag: int) -> pd.Series:
    """Month-end to month-end return (fraction) from p-lag to p; NaN if missing or across a reset."""
    if p - lag not in M.columns:
        return pd.Series(np.nan, index=M.index)
    return (M[p] / M[p - lag] - 1).where(SEG[p].eq(SEG[p - lag]))


# ---------------------------------------------------------------- batting average
def batting(M, SEG, goc: pd.Series, codes, as_of_month, window: int = 12, min_months: int = 6):
    """Months the fund beat the average of primary funds in its GoChanakya category (last `window`
    completed months; same method as cards/fund_card). Needs >= min_months valid months."""
    months = pd.period_range(as_of_month - window, as_of_month - 1, freq="M")
    R = pd.DataFrame({p: period_return(M, SEG, p, 1) for p in months})
    grp = goc.reindex(R.index)
    avg = R.groupby(grp).transform("mean")
    peers = R.notna().groupby(grp).transform("sum")
    long = pd.DataFrame(
        {
            "fund_ret_pct": R.stack(future_stack=True),
            "category_avg_pct": avg.stack(future_stack=True),
            "peers": peers.stack(future_stack=True),
        }
    )
    long.index.names = ["scheme_code", "month"]
    long = long[long["fund_ret_pct"].notna() & long["peers"].ge(2)].reset_index()
    long = long[long["scheme_code"].isin(set(codes))]
    long["beat"] = long["fund_ret_pct"].gt(long["category_avg_pct"])
    long[["fund_ret_pct", "category_avg_pct"]] = long[["fund_ret_pct", "category_avg_pct"]].mul(100).round(2)
    long["peers"] = long["peers"].astype(int)
    long["month"] = long["month"].astype(str)
    counts = long.groupby("scheme_code")["beat"].agg(["size", "sum"])
    keep = counts.index[counts["size"].ge(min_months)]
    long = long[long["scheme_code"].isin(keep)].reset_index(drop=True)
    funds = {
        code: {
            "window_months": len(g),
            "months_beat": int(g["beat"].sum()),
            "monthly": g[["month", "beat", "fund_ret_pct", "category_avg_pct", "peers"]].to_dict("records"),
        }
        for code, g in long.groupby("scheme_code", sort=False)
    }
    return funds, long


def batting_from_monthly_returns(mr: pd.DataFrame, clean: pd.DataFrame, codes, window: int = 12, min_months: int = 6):
    """Batting from monthly_returns (one row per fund per month, 36 months): better = monthly return above
    the average of every fund in the same GoChanakya Short Code that month (1) or not (0).

    monthly_returns works on unadjusted NAV, so a face-value change shows as a fake ~-90% month that also
    drags down its category's average. Those fund-months are corrected with the exact power of 10 found in
    the daily NAV (`clean.fv_power`) and the category averages are recalculated from the same file; a
    month spanning a NAV reset is left out. Every other value is the file's own. Needs >= min_months
    comparable months in the last `window`."""
    t = pd.DataFrame({
        "scheme_code": mr["amfi_code"].astype(str),
        "month": mr["return_month"].astype(str),
        "group": mr["goc_shortcode"].astype(str),
        "fund_ret_pct": mr["monthly_return_pct"].astype(float),
    })
    ev = clean.assign(month=clean["nav_date"].dt.to_period("M").astype(str))
    fvp = ev[ev["fv_power"].ne(0)].groupby(["scheme_code", "month"])["fv_power"].sum()
    seg = ev.groupby(["scheme_code", "month"])["seg"].agg(["min", "max"])
    prev_seg = seg["max"].groupby(level=0).shift()  # segment at the previous month-end
    reset = seg.index[(seg["max"] > seg["min"]) | (prev_seg.notna() & (seg["min"] > prev_seg))]

    key = pd.MultiIndex.from_frame(t[["scheme_code", "month"]])
    p = pd.Series(fvp.reindex(key).to_numpy(), index=t.index).fillna(0)
    t["adjusted"] = np.where(p.ne(0), "face_value", None).astype(object)
    t.loc[p.ne(0), "fund_ret_pct"] = ((1 + t.loc[p.ne(0), "fund_ret_pct"] / 100) / 10.0 ** p[p.ne(0)] - 1) * 100
    is_reset = key.isin(reset)
    t.loc[is_reset, ["fund_ret_pct", "adjusted"]] = [np.nan, "nav_reset"]

    g = t.groupby(["group", "month"])["fund_ret_pct"]
    t["category_avg_pct"], t["peers"] = g.transform("mean"), g.transform("count")
    touched = t.loc[t["adjusted"].notna(), ["group", "month"]].drop_duplicates()
    in_touched = pd.MultiIndex.from_frame(t[["group", "month"]]).isin(pd.MultiIndex.from_frame(touched))
    t.loc[in_touched & t["adjusted"].isna(), "adjusted"] = "category_average"
    ok = t["fund_ret_pct"].notna() & t["peers"].ge(2)
    t["beat"] = (t["fund_ret_pct"] > t["category_avg_pct"]).astype("Int64").where(ok)
    t[["fund_ret_pct", "category_avg_pct"]] = t[["fund_ret_pct", "category_avg_pct"]].round(2)
    t["peers"] = t["peers"].astype(int)

    t = t[t["scheme_code"].isin(set(codes))].sort_values(["scheme_code", "month"], ignore_index=True)
    last = t["month"].max()
    first = str(pd.Period(last) - (window - 1))
    comp = t[t["beat"].notna()]
    s36 = pd.DataFrame({
        "months_available_36": t[t["fund_ret_pct"].notna()].groupby("scheme_code").size(),
        "comparable_months_36": comp.groupby("scheme_code").size(),
        "months_beat_36": comp.groupby("scheme_code")["beat"].sum(),
    }).fillna(0).astype(int)
    s36["score_36"] = (s36["months_beat_36"] / s36["comparable_months_36"].where(s36["comparable_months_36"].gt(0)) * 100).round(1)
    win = comp[comp["month"].ge(first)]
    keep = win.groupby("scheme_code").size()
    keep = keep.index[keep.ge(min_months)]
    cols = ["month", "beat", "fund_ret_pct", "category_avg_pct", "peers", "adjusted"]
    funds = {}
    for code, g_ in win[win["scheme_code"].isin(keep)].groupby("scheme_code", sort=False):
        s_ = s36.loc[code]
        funds[code] = {
            "window_months": len(g_),
            "months_beat": int(g_["beat"].sum()),
            "monthly": [{**r, "beat": int(r["beat"])} for r in g_[cols].astype(object).where(g_[cols].notna(), None).to_dict("records")],
            "last_36": {"months_available": int(s_["months_available_36"]), "comparable_months": int(s_["comparable_months_36"]),
                        "months_beat": int(s_["months_beat_36"]), "score": s_["score_36"]},
        }
    return funds, t, s36.rename_axis("scheme_code").reset_index(), last


# ---------------------------------------------------------------- rank momentum
def momentum(M, SEG, goc: pd.Series, universe, codes, as_of_month, snapshots: int = 12, lookback: int = 6, window: int = 6):
    """Rank of the rolling 6-month return within the GoChanakya category, at each of the last
    `snapshots` month-ends (same method and universe as momentum-rank). Oldest -> newest.
    Each fund also gets its rank at each of the last `window` month-ends and the change over
    `window` months: moved_6m = rank 6 months ago - rank now (positive = climbed)."""
    U = M.index.intersection(list(universe))
    months = pd.period_range(as_of_month - snapshots, as_of_month - 1, freq="M")
    R6 = pd.DataFrame({p: period_return(M.loc[U], SEG.loc[U], p, lookback) for p in months})
    grp = goc.reindex(U)
    ranks = R6.groupby(grp).rank(ascending=False, method="first")
    totals = R6.notna().groupby(grp).transform("sum")
    long = pd.DataFrame(
        {
            "rank": ranks.stack(future_stack=True),
            "total": totals.stack(future_stack=True),
            "ret_6m_pct": R6.stack(future_stack=True),
        }
    )
    long.index.names = ["scheme_code", "month"]
    long = long[long["rank"].notna()].reset_index()
    long = long[long["scheme_code"].isin(set(codes))].reset_index(drop=True)
    long["date"] = long["month"].map(lambda p: p.end_time.normalize())
    long[["rank", "total"]] = long[["rank", "total"]].astype(int)
    long["ret_6m_pct"] = long["ret_6m_pct"].mul(100).round(2)
    long["group"] = long["scheme_code"].map(goc)

    # Rank / total at each month-end from now (0) back to `window` months ago
    latest = as_of_month - 1
    wide = lambda col: long.pivot(index="scheme_code", columns="month", values=col).reindex(
        columns=[latest - k for k in range(window + 1)])
    r, t = wide("rank"), wide("total")
    summary = pd.DataFrame(index=r.index)
    for k in range(window + 1):
        tag = "now" if k == 0 else f"{k}m_ago"
        summary[f"rank_{tag}"], summary[f"total_{tag}"] = r.iloc[:, k].astype("Int64"), t.iloc[:, k].astype("Int64")
    summary[f"moved_{window}m"] = summary[f"rank_{window}m_ago"] - summary["rank_now"]
    summary = summary.astype(object).where(summary.notna(), None)

    long = long[["scheme_code", "group", "date", "rank", "total", "ret_6m_pct"]]
    cutoff = (latest - (window - 1)).end_time.normalize()
    funds = {}
    for code, g in long.groupby("scheme_code", sort=False):
        s_ = summary.loc[code]
        snaps = g[["date", "rank", "total", "ret_6m_pct"]].to_dict("records")
        funds[code] = {
            "basis": "rolling_6m_return",
            "group": g["group"].iat[0],
            "snapshots": snaps,
            f"last_{window}_months": [x for x in snaps if x["date"] >= cutoff],
            "rank_now": s_["rank_now"],
            "total_now": s_["total_now"],
            f"rank_{window}m_ago": s_[f"rank_{window}m_ago"],
            f"total_{window}m_ago": s_[f"total_{window}m_ago"],
            f"moved_{window}m": s_[f"moved_{window}m"],
        }
    return funds, long, summary.rename_axis("scheme_code").reset_index()


# ---------------------------------------------------------------- 3-year SIP value
def sip_3y(M, SEG, DATES, latest: pd.DataFrame, codes, months: int = 36, amount: int = 5000, savings_rate: float = 0.035):
    """₹amount on the last NAV of each of the `months` completed calendar months before the latest
    NAV month, valued at the latest NAV (same rule as the 3-year SIP service). Null across a reset."""
    r = savings_rate / 12
    savings_value = round(sum(amount * (1 + r) ** k for k in range(months)))
    lat = latest.loc[latest.index.intersection(list(codes))]
    rows = []
    for lm, grp in lat.groupby(lat["nav_date"].dt.to_period("M")):
        win = pd.period_range(lm - months, lm - 1, freq="M")
        if not win.isin(M.columns).all():
            continue
        ids = grp.index.intersection(M.index)
        m, s = M.loc[ids, win], SEG.loc[ids, win]
        ok = m.notna().all(axis=1) & s.eq(grp.loc[ids, "seg"], axis=0).all(axis=1)
        ids = ok[ok].index
        units = (amount / m.loc[ids]).sum(axis=1)
        rows.append(
            pd.DataFrame(
                {
                    "scheme_code": ids,
                    "window_start_month": str(win[0]),
                    "window_end_month": str(win[-1]),
                    "start_date": DATES.loc[ids, win[0]].to_numpy(),
                    "end_date": grp.loc[ids, "nav_date"].to_numpy(),
                    "value": (units * grp.loc[ids, "nav"]).round().astype("int64").to_numpy(),
                }
            )
        )
    t = pd.concat(rows, ignore_index=True) if rows else pd.DataFrame(columns=["scheme_code", "value"])
    invested = amount * months
    t = t.assign(
        monthly_amount=amount,
        installments=months,
        invested=invested,
        current_value=t["value"],
        gain=t["value"] - invested,
        abs_return_pct=((t["value"] - invested) / invested * 100).round(1),
        savings_value=savings_value,
        extra_vs_savings=t["value"] - savings_value,
    ).drop(columns="value")
    cols = ["monthly_amount", "installments", "start_date", "end_date", "invested", "current_value", "gain",
            "abs_return_pct", "savings_value", "extra_vs_savings", "window_start_month", "window_end_month"]
    funds = {r["scheme_code"]: {c: r[c] for c in cols} for r in t.to_dict("records")}
    return funds, t[["scheme_code", *cols]]


# ---------------------------------------------------------------- stress events
def stress_events(clean: pd.DataFrame, codes, launch: pd.Series):
    """Fall and recovery for each fixed market event (same rules as exceptional timelines, verified
    100% on clean NAVs), computed on face-value-adjusted NAV; the 2026 event also gets a recovery.
    status: recovered | recovering | not_applicable (reason: launched_after | no_data | nav_reset)."""
    tol = np.timedelta64(TOLERANCE_DAYS, "D")
    ev = [(c, n, np.datetime64(a, "D"), np.datetime64(b, "D")) for c, n, a, b in EVENTS]
    sub = clean[clean["scheme_code"].isin(set(codes))]
    rows = []
    for code, g in sub.groupby("scheme_code", sort=False):
        d = g["nav_date"].to_numpy().astype("datetime64[D]")
        v, seg = g["nav_adj"].to_numpy(), g["seg"].to_numpy()
        launched = launch.get(code)
        for ecode, name, s0, s1 in ev:
            row = {"scheme_code": code, "event_code": ecode, "name": name, "start_date": s0, "end_date": s1,
                   "status": "not_applicable", "fall_pct": None, "recovery_months": None, "recovered_pct": None,
                   "reason": None, "start_nav_date": None, "max_fall_date": None, "recovery_date": None}
            rows.append(row)
            i = np.searchsorted(d, s0, "right") - 1
            if i < 0 or s0 - d[i] > tol:
                after_start = d[0] > s0 - tol or (pd.notna(launched) and np.datetime64(launched, "D") > s0)
                row["reason"] = "launched_after" if after_start else "no_data"
                continue
            j0, j1 = np.searchsorted(d, s0, "left"), np.searchsorted(d, s1, "right")
            e = np.searchsorted(seg, seg[i], "right") - 1  # last index still in the start's segment
            if j0 >= j1:
                row["reason"] = "no_data"
                continue
            mf = j0 + int(np.argmin(v[j0:j1]))
            if mf > e:
                row["reason"] = "nav_reset"
                continue
            start = v[i]
            row.update(start_nav_date=d[i], max_fall_date=d[mf], fall_pct=round(max(0.0, (1 - v[mf] / start) * 100), 2))
            hit = np.flatnonzero(v[mf + 1 : e + 1] >= start)
            if hit.size:
                k = mf + 1 + int(hit[0])
                days = int((d[k] - s0) / np.timedelta64(1, "D"))
                row.update(status="recovered", recovery_date=d[k], recovery_months=round(days / DAYS_PER_MONTH, 2), recovered_pct=100.0)
            elif e < len(v) - 1:
                row.update(status="not_applicable", reason="nav_reset", fall_pct=None, start_nav_date=None, max_fall_date=None)
            else:
                pct = 100.0 if start <= v[mf] else float(np.clip((v[e] - v[mf]) / (start - v[mf]) * 100, 0, 100))
                row.update(status="recovering", recovered_pct=round(pct, 1))
    t = pd.DataFrame(rows)
    for c in ("start_date", "end_date", "start_nav_date", "max_fall_date", "recovery_date"):
        t[c] = pd.to_datetime(t[c])
    order = {c: i for i, (c, *_) in enumerate(EVENTS)}
    t = (
        t.assign(_o=t["event_code"].map(order))
        .sort_values(["scheme_code", "_o"], ascending=[True, False], ignore_index=True)  # newest event first
        .drop(columns="_o")
    )
    keep = ["event_code", "name", "start_date", "end_date", "status", "fall_pct", "recovery_months", "recovered_pct",
            "reason", "start_nav_date", "max_fall_date", "recovery_date"]
    clean_t = t.astype(object).where(t.notna(), None)
    funds = {code: {"events": g[keep].to_dict("records")} for code, g in clean_t.groupby("scheme_code", sort=False)}
    return funds, t


# ---------------------------------------------------------------- recovery speed
def recovery_speed(events: pd.DataFrame, goc: pd.Series, resilience: pd.DataFrame | None, codes,
                   min_events: int = 1, min_peers: int = 3):
    """Bounce-back bars, compared like for like.

    typical_months           = median recovery time across the market events the fund recovered from (>= min_events).
    category_typical_months  = for those SAME events, the median recovery time of funds in the same GoChanakya
                               category (an event counts only if >= min_peers funds in the category recovered
                               from it), then the median across the events. A young fund is therefore compared
                               with how its category did in the same falls, not with older, slower crashes.
    Also: events_used / category_events_used, recovering_events (still below the pre-fall NAV), and a
    per-event comparison. Resilience-score-v2 figures are attached as reference when available."""
    ev = events.assign(group=events["scheme_code"].map(goc))
    rec = ev[ev["status"].eq("recovered")].assign(recovery_months=lambda d: d["recovery_months"].astype(float))
    per_event = rec.groupby(["group", "event_code"])["recovery_months"].agg(["median", "size"])
    rec = rec.join(per_event.rename(columns={"median": "cat_months", "size": "cat_funds"}), on=["group", "event_code"])
    rec["cat_months"] = rec["cat_months"].where(rec["cat_funds"].ge(min_peers))

    g = rec.groupby("scheme_code")
    t = pd.DataFrame({
        "events_used": g.size(),
        "typical_months": g["recovery_months"].median(),
        "category_events_used": g["cat_months"].count(),
        "category_typical_months": g["cat_months"].median(),
    }).reindex(list(codes))
    t["events_used"] = t["events_used"].fillna(0).astype(int)
    t["category_events_used"] = t["category_events_used"].fillna(0).astype(int)
    t["typical_months"] = t["typical_months"].where(t["events_used"].ge(min_events)).round(1)
    t["category_typical_months"] = t["category_typical_months"].where(t["typical_months"].notna()).round(1)
    t["recovering_events"] = ev[ev["status"].eq("recovering")].groupby("scheme_code").size().reindex(t.index).fillna(0).astype(int)
    t["group"] = goc.reindex(t.index)
    if resilience is not None and len(resilience):
        t = t.join(resilience, how="left")
    t = t.rename_axis("scheme_code").reset_index()

    cmp_ = rec[["scheme_code", "event_code", "recovery_months", "cat_months", "cat_funds"]].copy()
    cmp_[["recovery_months", "cat_months"]] = cmp_[["recovery_months", "cat_months"]].round(2)
    cmp_ = cmp_.astype(object).where(cmp_.notna(), None)
    by_fund = {k: g_.drop(columns="scheme_code").rename(columns={"recovery_months": "fund_months", "cat_months": "category_months",
                                                               "cat_funds": "category_funds"}).to_dict("records")
               for k, g_ in cmp_.groupby("scheme_code", sort=False)}
    res_cols = [c for c in t.columns if c.startswith("resilience_")]
    clean_t = t.astype(object).where(t.notna(), None)
    funds = {
        r["scheme_code"]: {
            "typical_months": r["typical_months"],
            "category_typical_months": r["category_typical_months"],
            "basis": "same_events",
            "events_used": r["events_used"],
            "category_events_used": r["category_events_used"],
            "recovering_events": r["recovering_events"],
            "by_event": by_fund.get(r["scheme_code"], []),
            "resilience": ({c.removeprefix("resilience_"): r[c] for c in res_cols} if r.get("resilience_score") is not None else None),
        }
        for r in clean_t.to_dict("records")
    }
    return funds, t


def load_resilience(uri: str, sm: pd.DataFrame, primary_codes) -> pd.DataFrame | None:
    """resilience-score-v2 latest scores (keyed by ISIN) -> primary scheme_code; recovery days -> months."""
    from core import log, open_fs

    try:
        fs, path = open_fs(uri)
        with fs.open_input_file(path) as f:
            r = pd.read_parquet(f)
    except Exception as exc:
        log.warning("Resilience scores unavailable (%s)", exc)
        return None
    r = r[~r["status"].str.startswith("Removed", na=False)]
    isin = pd.concat([sm["ISIN Growth/Div Payout"], sm["ISIN Div Reinvestment"]]).dropna().rename("isin").reset_index()
    isin = isin[isin["Code"].isin(set(primary_codes))].drop_duplicates("isin")
    r = r.merge(isin, on="isin").drop_duplicates("Code").set_index("Code")
    days = lambda c: (r[c] / DAYS_PER_MONTH).round(2)
    return pd.DataFrame(
        {
            "resilience_score": r["score"].round(1),
            "resilience_median_recovery_months": days("median_recovery"),
            "resilience_mean_recovery_months": days("mean_recovery"),
            "resilience_longest_recovery_months": days("longest_recovery"),
            "resilience_worst_fall_pct": r["worst_fall_pct"].round(2),
            "resilience_cycle_count": r["cycle_count"],
            "resilience_as_of": r["last_fresh_date"],
        }
    )
