"""Compare backend_main_kartik outputs with the existing services' files and report match rates.
Differences are expected only where face-value changes were fixed or a category changed since that
service last ran. Run after a deploy:  python verify_against_sources.py   (uses your gcloud login)."""
import io
import json
import os

import pandas as pd

import core

OUT = os.getenv("OUT_ROOT", core.DST_ROOT)
MOM = os.getenv("MOMENTUM_URI", core.MOMENTUM_UNIVERSE_URI)
SIP = os.getenv("SIP_URI", "gs://mf-data-public/3-year SIP value (INR 5000 per month)/latest.parquet")
MR = os.getenv("MONTHLY_RETURNS_URI", core.MONTHLY_RETURNS_URI)
EVT = os.getenv("EVENTS_URI", "gs://mf-data-public/resilience-score-v2/exceptional timelines/exceptional_timelines.json")
EVENT_IDS = {"chinese_yuan_devaluation_2015_2016": "YUAN_2015", "demonetization_india_2016": "DEMO_2016",
             "ilfs_liquidity_crisis_2018": "ILFS_2018", "covid_19_crises_lockdown_2020": "COVID_2020",
             "massive_fii_selloff_2021": "FII_2021", "us_israel_attack_iran_2026": "IRAN_2026"}


def read(uri, kind):
    fs, path = core.open_fs(uri)
    with fs.open_input_file(path) as f:
        data = f.read()
    return {"parquet": lambda: pd.read_parquet(io.BytesIO(data)), "csv": lambda: pd.read_csv(io.BytesIO(data)),
            "json": lambda: json.loads(data)}[kind]()


def main():
    ret = read(f"{OUT}/returns/latest/returns.parquet", "parquet")
    fixed = set(ret.loc[ret["fv_change_date"].notna(), "scheme_code"])
    print(f"Face-value changes fixed in the last 400 days: {len(fixed)} funds\n")

    mb = read(f"{OUT}/batting_average/latest/batting_average.parquet", "parquet")
    mr = read(MR, "parquet")
    mr["scheme_code"] = mr["amfi_code"].astype(str)
    c = mb.merge(mr[["scheme_code", "return_month", "better_than_avg", "category_scheme_count"]],
                 left_on=["scheme_code", "month"], right_on=["scheme_code", "return_month"])
    u = c[c["adjusted"].isna() & c["better_than_avg"].notna() & c["beat"].notna()]
    solo = c[c["better_than_avg"].notna() & c["beat"].isna() & c["category_scheme_count"].eq(1)]
    print(f"BATTING   {len(u):6d} untouched fund-months: 1/0 identical to monthly_returns {(u['beat'].astype(int) == u['better_than_avg'].astype(int)).mean():.1%}")
    print(f"          adjusted: {mb['adjusted'].value_counts().to_dict()}; single-fund categories left empty: {len(solo)} months ({solo['scheme_code'].nunique()} funds)")

    mine = read(f"{OUT}/rank_momentum/latest/rank_momentum.parquet", "parquet")
    th = read(MOM, "csv")
    th["scheme_code"] = th["amfi_code"].astype(str)
    tl = pd.concat([th[["scheme_code"]].assign(i=i, rank=th[f"rank_{i}"]) for i in range(1, 13)]).dropna()
    as_of_month = mine["date"].max().to_period("M") + 1
    tl["date"] = tl["i"].map(lambda i: (as_of_month - i).end_time.normalize())
    c = tl.merge(mine, on=["scheme_code", "date"], suffixes=("_theirs", "_mine"))
    ok = c["rank_theirs"].astype(int).eq(c["rank_mine"])
    print(f"MOMENTUM  {len(c):6d} fund-months compared: rank identical {ok.mean():.1%} "
          "(rest: face-value fixes and category changes shift ranks in the same group)")

    ms = read(f"{OUT}/sip_3y/latest/sip_3y.parquet", "parquet")
    ts = read(SIP, "parquet")
    ts["scheme_code"] = ts["scheme_code"].astype(str)
    c = ms.merge(ts[["scheme_code", "value", "abs_return_pct"]], on="scheme_code", suffixes=("_mine", "_theirs"))
    ok = (c["current_value"] - c["value"]).abs() <= 1
    print(f"SIP 3Y    {len(c):6d} funds compared: value identical {ok.mean():.1%}; the {(~ok).sum()} that differ:")
    print(c.loc[~ok, ["scheme_code", "value", "current_value", "abs_return_pct_theirs", "abs_return_pct_mine"]]
          .rename(columns={"value": "value_theirs", "current_value": "value_mine"}).head(40).to_string(index=False))

    me = read(f"{OUT}/stress_events/latest/stress_events.parquet", "parquet")
    ev = read(EVT, "json")
    te = pd.DataFrame([s for e in ev["events"] for s in e["schemes"]])
    te["scheme_code"], te["event_code"] = te["amfi_code"].astype(str), te["event_id"].map(EVENT_IDS)
    c = te.merge(me, on=["scheme_code", "event_code"], suffixes=("_theirs", "_mine"))
    rec = c[c["status_theirs"].eq("Recovered") & c["status_mine"].eq("recovered")]
    same = (rec["recovery_months_from_event_start"] - rec["recovery_months"].astype(float)).abs() <= 0.011
    print(f"\nSTRESS    {len(c):6d} fund-events compared: recovery months identical {same.mean():.1%} of {len(rec)} recovered")
    print(pd.crosstab(c["status_theirs"], c["status_mine"]).to_string())


if __name__ == "__main__":
    main()
