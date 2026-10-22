"""Datasets taken from other feeds and matched to the funds: monthly AUM and the NSE scheme master."""
import json
import re
from datetime import date

import pandas as pd
from pyarrow import fs as pafs

import core

AUM_PREFIX = core.os.getenv("AUM_PREFIX", "gs://mf-data-public/aum")
NSE_URI = core.os.getenv("NSE_URI", "gs://mf-data-public/nse-schemes/funds.json")
NSE_COLUMNS = ["unique_sr_no", "scheme_code", "rta_scheme_code", "amc_scheme_code", "isin", "amc_code", "scheme_type", "plan_type",
               "scheme_name", "purchase_allowed", "purchase_transaction_mode", "new_purchase_min_amount",
               "additional_purchase_min_amount", "additional_purchase_max_amount", "purchase_amount_multiplier",
               "purchase_cutoff_time", "redemption_allowed", "redemption_transaction_mode", "redemption_min_qty",
               "redemption_qty_multiplier", "redemption_max_qty", "redemption_min_amount", "redemption_max_amount",
               "redemption_amount_multiplier", "redemption_cutoff_time", "rta_agent_code", "amc_active_flag",
               "div_reinvest_flag", "sip_allowed", "stp_enabled", "swp_enabled", "switch_allowed", "settlement_type",
               "amc_ind", "face_value", "scheme_start_date", "maturity_date", "exit_load_flag", "exit_load",
               "lock_in_period_flag", "lock_in_period", "channel_partner_code", "reopening_date"]  # all 43 NSE fields
NSE_NUMERIC = ["new_purchase_min_amount", "additional_purchase_min_amount", "additional_purchase_max_amount",
               "purchase_amount_multiplier", "redemption_min_qty", "redemption_qty_multiplier", "redemption_max_qty",
               "redemption_min_amount", "redemption_max_amount", "redemption_amount_multiplier", "face_value", "lock_in_period"]
NSE_DATES = ["scheme_start_date", "maturity_date", "reopening_date"]
MONTH_FILE = re.compile(r"(\d{4}-\d{2})\.parquet$")


def _root(sm: pd.DataFrame, code: pd.Series) -> pd.Series:
    """Any plan code -> its fund's primary plan code (itself if it is primary or unknown)."""
    return code.map(sm["rootPrimary_v1"]).fillna(code)


# ---------------------------------------------------------------- AUM (monthly)
def load_latest_aum(prefix: str = None):
    """Latest monthly file in the aum/ folder, chosen by file name (YYYY-MM.parquet).
    Returns (DataFrame, month 'YYYY-MM', rows in the previous month's file or None)."""
    prefix = prefix or AUM_PREFIX
    fs, path = core.open_fs(prefix)
    files = {m.group(1): f.path for f in fs.get_file_info(pafs.FileSelector(path, recursive=False))
             if (m := MONTH_FILE.search(f.path))}
    if not files:
        raise FileNotFoundError(f"no YYYY-MM.parquet files in {prefix}")
    months = sorted(files)
    read = lambda mth: pd.read_parquet(files[mth], filesystem=fs)
    prev = len(read(months[-2])) if len(months) > 1 else None
    return read(months[-1]), months[-1], prev


def aum_dataset(aum: pd.DataFrame, sm: pd.DataFrame, codes):
    """Every row of the latest AUM file, mapped to its fund (primary plan). One row per fund on the cards."""
    t = aum.copy()
    t.insert(0, "scheme_code", _root(sm, t["amficode"].astype(str)))
    t["amficode"] = t["amficode"].astype(str)
    t = t.sort_values(["scheme_code", "aum_lakhs"], ascending=[True, False])
    per_fund = t.drop_duplicates("scheme_code")
    per_fund = per_fund[per_fund["scheme_code"].isin(set(codes))]
    rows = per_fund.astype(object).where(per_fund.notna(), None)
    funds = {
        r["scheme_code"]: {
            "aum_lakhs": None if r["aum_lakhs"] is None else round(float(r["aum_lakhs"]), 2),
            "fund_age_years": r["fund_age_years"],
            "as_on_date": r["as_on_date"],
            "start_date": r["start_date"],
            "amficode": r["amficode"],
            "scheme_name": r["scheme_name"],
            "amc": r["amc"],
        }
        for r in rows.to_dict("records")
    }
    return funds, t.reset_index(drop=True)


# ---------------------------------------------------------------- NSE schemes
def load_nse(uri: str = None) -> pd.DataFrame:
    fs, path = core.open_fs(uri or NSE_URI)
    with fs.open_input_file(path) as f:
        n = pd.DataFrame(json.loads(f.read()))
    n = n.reindex(columns=list(dict.fromkeys([*NSE_COLUMNS, *n.columns])))  # every NSE field, even if absent today
    n = n.apply(lambda c: c.astype(str).str.strip().where(c.notna())).replace("", None)
    for c in (c for c in NSE_NUMERIC if c in n):  # tolerate NSE adding or dropping columns
        n[c] = pd.to_numeric(n[c], errors="coerce")
    for c in (c for c in NSE_DATES if c in n):  # dd-mm-yyyy -> yyyy-mm-dd as text (keeps 31-12-9999 style "no maturity" values)
        n[c] = n[c].str.replace(r"^(\d{2})-(\d{2})-(\d{4})$", r"\3-\2-\1", regex=True)
    return n


def _tokens(s) -> set:
    return set(re.findall(r"[a-z0-9]+", str(s).lower())) - {"fund", "plan", "option", "the"}


def nse_dataset(n: pd.DataFrame, sm: pd.DataFrame, codes, today: date):
    """Match NSE order codes to AMFI plan codes by ISIN (growth/payout or reinvestment ISIN in the Scheme
    Master). For each plan ISIN one order code is selected for the app, in this order of preference: still
    live (maturity date not passed: closed NFO codes last), normal settlement (the Rs 2 lakh L0/L1 codes only
    if nothing else is live), purchase / redemption / SIP allowed, DP mode, closest name, newest.
    Returns (card section per fund, per-plan JSON, all NSE rows with matches and the selected flag)."""
    isin = pd.concat([
        sm["ISIN Growth/Div Payout"].rename("isin").to_frame().assign(isin_type="growth_or_payout"),
        sm["ISIN Div Reinvestment"].rename("isin").to_frame().assign(isin_type="reinvestment"),
    ]).dropna(subset=["isin"]).rename_axis("plan_code").reset_index().drop_duplicates("isin")
    t = n.merge(isin, on="isin", how="left")
    t["primary_code"] = _root(sm, t["plan_code"].dropna()).reindex(t.index)
    t["plan_nav_name"] = t["plan_code"].map(sm["Scheme NAV Name"])
    today_s = today.isoformat()
    sim = [len(_tokens(a) & _tokens(b)) / max(len(_tokens(a) | _tokens(b)), 1) for a, b in zip(t["scheme_name"], t["plan_nav_name"])]
    t = t.assign(
        _l=t["settlement_type"].str.startswith("L").fillna(False).astype(int),
        _exp=(t.get("maturity_date", pd.Series(None, index=t.index)).fillna("9999-12-31") < today_s).astype(int),
        _buy=t["purchase_allowed"].ne("Y").astype(int),
        _mf=t["settlement_type"].eq("MF").astype(int),
        _red=t["redemption_allowed"].ne("Y").astype(int),
        _sip=t["sip_allowed"].ne("Y").astype(int),
        _mode=t["purchase_transaction_mode"].map({"DP": 0, "D": 1, "P": 2}).fillna(3),
        _sim=[-x for x in sim],
        _sr=-pd.to_numeric(t["unique_sr_no"], errors="coerce").fillna(0),
    )
    rank = ["_exp", "_l", "_buy", "_mf", "_red", "_sip", "_mode", "_sim", "_sr"]
    t = t.sort_values(["isin", *rank], kind="stable")
    t["selected"] = t["plan_code"].notna() & ~t["isin"].duplicated()
    t = t.drop(columns=rank).reset_index(drop=True)

    nse_cols = list(n.columns)
    matched = t[t["plan_code"].notna()]
    recs = matched[nse_cols].astype(object).where(matched[nse_cols].notna(), None).to_dict("records")  # one pass
    per_plan, slot = {}, {}
    for rec, plan, typ, i, sel, prim in zip(recs, matched["plan_code"], matched["isin_type"], matched["isin"],
                                            matched["selected"], matched["primary_code"]):
        key = (plan, typ, i)
        if key not in slot:
            slot[key] = {"isin": i, "isin_type": typ, "order_code": None, "all_order_codes": []}
            per_plan.setdefault(plan, {"primary_code": prim, "isins": []})["isins"].append(slot[key])
        slot[key]["all_order_codes"].append(rec)
        if sel:
            slot[key]["order_code"] = rec
    card = {}
    for code in codes:
        for e in per_plan.get(code, {}).get("isins", []):
            if e["isin_type"] == "growth_or_payout" and e["order_code"]:
                card[code] = e["order_code"]
    return card, per_plan, t
