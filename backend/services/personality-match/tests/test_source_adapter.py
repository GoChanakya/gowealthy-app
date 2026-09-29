import pandas as pd

from pm_batch import adapt_source_documents
from pm_config import load_config


def test_combined_fund_card_is_enriched_from_scheme_master():
    document = {
        "scheme_code": "100033",
        "category": {"goc_short_code": "EQS-LMF"},
        "returns_pct": {"y1": 4.02},
        "batting_average": {
            "window_months": 12,
            "months_beat": 8,
            "last_36": {"months_available": 36, "comparable_months": 36, "months_beat": 14},
        },
    }
    master = pd.DataFrame([{
        "Code": "100033",
        "isprimary_v1": "Y",
        "rootPrimary_v1": "",
        "Launch Date": "1995-02-10",
        "MinAmount": "500",
    }])

    adapted = adapt_source_documents([document], master, load_config())[0]

    assert adapted["isprimary_v1"] == "Y"
    assert adapted["inception_date"] == "1995-02-10"
    assert adapted["min_sip_amount"] == "500"
    assert adapted["batting_36m"] == {"window_months": 36, "months_beat": 14}
