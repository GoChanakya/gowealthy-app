# Upload and fund-recommendation service

This service runs on port `3001`. In addition to signed document uploads, it
serves persona-matched mutual-fund recommendations:

- `GET /api/mf/recommendations?persona_code=LHL`
- `GET /api/mf/fund-cards/100033?persona_code=LHL`

The GET endpoints are useful for a simple persona-only preview. The mobile app
uses the personalized endpoints:

```text
POST /api/mf/recommendations
POST /api/mf/fund-cards/100033
```

with this request shape:

```json
{
  "profile": {
    "persona_code": "LHL",
    "age": 42,
    "living": "own_emi",
    "monthly_amount": 10000,
    "loss_reaction": "stick_to_plan"
  }
}
```

`age` and `living` are required for personalized scoring. The engine also
accepts `emi_ratio_pct`, `spouse_income`, `dependents_non_earning`,
`emergency_fund`, `health_insurance`, and `horizon_years`. Missing optional
fields are neutral. `loss_reaction: "sell"` lowers the user's allowed risk
grade. `monthly_amount` is reserved for basket sizing and does not inflate a
fund's match score.

The eight accepted persona codes are `LLL`, `LHL`, `HLL`, `HHL`, `LHH`,
`LLH`, `HLH`, and `HHH`.

## Fund data

By default, the service reads:

- `gs://mf-data-public/backend_main_kartik/fund_cards/latest/fund_cards.json`
- `gs://mf-data-public/Scheme Master.csv`
- `gs://mf-data-public/personality_match/latest/scores.json`

The data is cached in memory for five minutes. See `.env.example` for the
configuration overrides.

For local development, place a rotated service-account key at
`backend/services/upload-service/service-account-key.json`. This file is
gitignored. The account needs read access to the two fund-data paths and the
existing permissions needed for signed document uploads.

On Cloud Run, do not deploy a JSON key. Assign the same IAM permissions to the
Cloud Run service identity; Application Default Credentials are used
automatically.

The mobile app reads the questionnaire document from
`gowealthy-questionaire/{phone}` in Firestore. It currently sends persona,
age, living situation, monthly amount, and the saved crash answer. Optional
financial-capacity fields are supported by the API and will start affecting
the result when the questionnaire or dashboard begins saving them. Set
`EXPO_PUBLIC_FUND_PICKS_SOURCE=mock` only when bundled sample cards are wanted.
