# Recommendation service

Runs on port `3002` locally (Cloud Run sets `PORT`). Serves persona-matched
mutual-fund picks built from the personality-match engine output.

| Endpoint | Use |
| --- | --- |
| `POST /api/mf/recommendations` | App "Picked for you": one card per basket position for the user's persona and SIP, with 2 switch alternates each |
| `POST /api/mf/fund-cards/:schemeCode` | Full card for one scheme (switch / swap-in), scored for the user's persona |
| `GET /api/mf/recommendations?persona_code=LHL` | Persona-only preview |
| `GET /api/mf/fund-cards/:schemeCode?persona_code=LHL` | Persona-only card |
| `GET /api/health` | Health check |

Request body for the POST endpoints:

```json
{ "profile": { "persona_code": "LHL", "age": 42, "living": "own_emi", "monthly_amount": 10000, "loss_reaction": "stick_to_plan" } }
```

`age` and `living` are required for personalized scoring. Optional fields:
`emi_ratio_pct`, `spouse_income`, `dependents_non_earning`, `emergency_fund`,
`health_insurance`, `horizon_years`. `loss_reaction: "sell"` lowers the allowed
risk grade. `monthly_amount` picks the basket size (number of positions).
Persona codes: `LLL`, `LHL`, `HLL`, `HHL`, `LHH`, `LLH`, `HLH`, `HHH`.

## Data

Read from GCS and cached in memory for 5 minutes (overrides in `.env.example`):

- `gs://mf-data-public/backend_main_kartik/fund_cards/latest/fund_cards.json`
- `gs://mf-data-public/Scheme Master.csv`
- `gs://mf-data-public/personality_match/latest/scores.json` (written by `services/personality-match`)

A new engine run shows up within 5 minutes; no redeploy needed.

## Run

```bash
npm run dev:recommendation        # from backend/, port 3002
npm test --workspace=services/recommendation-service
./deploy/deploy.sh recommendation-service
```

Local dev reads `service-account-key.json` next to the service (gitignored). On
Cloud Run no key is deployed: grant the service identity `roles/storage.objectViewer`
on `mf-data-public`.
