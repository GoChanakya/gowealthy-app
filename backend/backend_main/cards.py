"""Combine the per-dataset sections into one fund card per active primary scheme (contract v1.1)."""
import pandas as pd

from extras import NSE_COLUMNS

CARD_EVENT_KEYS = ("event_code", "name", "start_date", "end_date", "status", "fall_pct", "recovery_months", "recovered_pct", "reason")


def build_cards(codes, category, returns, batting, momentum, sip, stress, recovery, aum=None, nse=None) -> dict:
    """Sections a fund lacks are null (e.g. batting needs 6 months, SIP needs 36). Persona, personality
    match and hook are not produced yet and are null; alternates are empty until matching exists."""
    cards = {}
    for code in codes:
        cat, ret = category[code], returns[code]
        bat, mom, s, rec = batting.get(code), momentum.get(code), sip.get(code), recovery.get(code, {})
        cards[code] = {
            "scheme_code": code,
            "isin": cat["isin"],
            "name": cat["name"],
            "plan": cat["plan"],
            "amc": cat["amc"],
            "category": {"goc_short_code": cat["category"]["goc_short_code"], "label": cat["category"]["label"]},
            "hook": None,
            "nav": ret["nav"],
            "returns_pct": ret["returns_pct"],
            "personality_match": None,
            "persona": None,
            "batting_average": bat and {
                "window_months": bat["window_months"],
                "months_beat": bat["months_beat"],
                "monthly": [{"month": m["month"], "beat": int(m["beat"])} for m in bat["monthly"]],
                **({"last_36": bat["last_36"]} if "last_36" in bat else {}),
            },
            "sip_3y": s and {k: s[k] for k in ("monthly_amount", "installments", "start_date", "end_date", "invested", "current_value")},
            "rank_momentum": mom and {
                "basis": mom["basis"],
                "snapshots": [{"date": x["date"], "rank": x["rank"], "total": x["total"]} for x in mom["snapshots"]],
                "last_6_months": [{"date": x["date"], "rank": x["rank"], "total": x["total"]} for x in mom["last_6_months"]],
                **{k: mom[k] for k in ("rank_now", "total_now", "rank_6m_ago", "total_6m_ago", "moved_6m")},
            },
            "recovery": {
                "typical_months": rec.get("typical_months"),
                "category_typical_months": rec.get("category_typical_months"),
                "events_used": rec.get("events_used", 0),
                "recovering_events": rec.get("recovering_events", 0),
                "events": [{k: e[k] for k in CARD_EVENT_KEYS} for e in stress[code]["events"]],
            },
            "aum": (aum or {}).get(code) and {k: aum[code][k] for k in ("aum_lakhs", "fund_age_years", "as_on_date", "start_date")},
            "nse": (nse or {}).get(code),
            "alternates": [],
        }
    return cards


def cards_table(cards: dict, latest_month_end: pd.Timestamp) -> pd.DataFrame:
    """One flat row per fund: the key numbers from every section, for Parquet/Excel. Momentum shows the
    rank at each of the last 6 month-ends plus 6 months ago (fixed column names, newest first)."""
    month_ends = [(latest_month_end.to_period("M") - k).end_time.normalize() for k in range(7)]
    rows = []
    for c in cards.values():
        mom = c["rank_momentum"] or {}
        by_date = {pd.Timestamp(x["date"]): x["rank"] for x in mom.get("snapshots") or []}
        bat, sip, rec = c["batting_average"], c["sip_3y"], c["recovery"]
        ev = {e["event_code"]: e for e in rec["events"]}
        rows.append(
            {
                "scheme_code": c["scheme_code"],
                "name": c["name"],
                "amc": c["amc"]["short_name"],
                "category": c["category"]["label"],
                "goc_short_code": c["category"]["goc_short_code"],
                "nav": c["nav"]["value"],
                "nav_date": pd.Timestamp(c["nav"]["date"]),
                "ret_3m_pct": c["returns_pct"]["m3"],
                "ret_6m_pct": c["returns_pct"]["m6"],
                "ret_1y_pct": c["returns_pct"]["y1"],
                "months_beat": bat and bat["months_beat"],
                "batting_months": bat and bat["window_months"],
                **{("rank_now" if k == 0 else f"rank_{k}m_ago"): by_date.get(month_ends[k]) for k in range(7)},
                "rank_total_now": mom.get("total_now"),
                "places_climbed_6m": mom.get("moved_6m"),
                "aum_lakhs": (c["aum"] or {}).get("aum_lakhs"),
                "fund_age_years": (c["aum"] or {}).get("fund_age_years"),
                "sip_invested": sip and sip["invested"],
                "sip_value": sip and sip["current_value"],
                "typical_recovery_months": rec["typical_months"],
                "category_typical_recovery_months": rec["category_typical_months"],
                **{f"{k.lower()}_fall_pct": ev[k]["fall_pct"] for k in ev},
                **{f"{k.lower()}_recovery_months": ev[k]["recovery_months"] for k in ev},
                **{f"nse_{k}": (c["nse"] or {}).get(k) for k in NSE_COLUMNS},  # all 43 NSE fields
            }
        )
    return pd.DataFrame(rows)
