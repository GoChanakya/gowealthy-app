# Personality Match service

Monthly batch job for GoWealthy fund matching:

1. **Screen** — read the latest `fund_cards.parquet` (one row per scheme) and keep only
   schemes that pass the hard filters: category universe, NSE purchase allowed = Y, and
   top half of category by latest rank momentum.
2. **Score** — run the persona-match engine on that shortlist only, enriched from the
   other `backend_main_kartik/*/latest` tables.
3. **Publish** — write the persona-scored shortlist to `gs://mf-data-public/shortlisted_schemes/`.

`pm_lookup.py` (per-user score adjustment and listing) and `pm_basket.py` (SIP basket
plus buffer) read that published shortlist. `scheme_config_master.yaml` is the source of
truth for every weight, threshold, slot template, source URI and output path.

## Modules

| File | Role |
| --- | --- |
| `pm_sources.py` | Loads sources in parallel, screens fund cards, builds scoring inputs for the shortlist |
| `pm_batch.py` | Features, the 8 persona suitability scores, buffer score, outputs, CLI |
| `pm_lookup.py` | Capacity tier, user-adjusted score, `rank_funds(...)` listing |
| `pm_basket.py` | Slot-based SIP basket and DES-LIQ buffer SIP |
| `pm_config.py` | Config load and fail-fast validation |

## Data sources (`sources` in the config)

| Source | Used for |
| --- | --- |
| `fund_cards/latest/fund_cards.parquet` (required) | Master list, category, rank now, NSE purchase/SIP flags, min investment, 12m batting, returns, SIP value, recovery months |
| `rank_momentum/latest/rank_momentum.parquet` | 12-month rank history: stability, trend, turnaround |
| `batting_average/latest/batting_average.parquet` | 36-month batting average |
| `stress_events/latest/stress_events.parquet` | Downside participation and unrecovered penalty |
| `recovery_speed/latest/recovery_speed.parquet` | Typical vs category recovery months |
| `aum/latest/aum.parquet` | AUM (lakhs) and launch date / fund age |
| `returns/latest/returns.parquet`, `sip_3y/latest/sip_3y.parquet` | Optional overrides of the card's 1Y return and SIP value |
| `Scheme Master.csv` | Launch-date fallback for funds missing from the AUM table |

Optional sources that fail to load are skipped with a warning. Override any URI with
`--source NAME=URI` or env `PM_SRC_<NAME>`; an empty value skips that source.

## Outputs

```text
shortlisted_schemes/
  latest/                    shortlisted_schemes.parquet | .json, screening.parquet
  as_of=YYYY-MM-DD/          same files + audit.parquet
personality_match/latest/    scores.json | .parquet  (legacy copy for the Node upload
                             service; set outputs.legacy_scores_prefix: null to stop)
```

`screening.parquet` lists every fund card with its `screen_reason`
(`OUT_OF_UNIVERSE`, `PURCHASE_NOT_ALLOWED`, `BOTTOM_HALF_RANK`, `NO_RANK`, or blank
when shortlisted). Shortlist `status` is `SCORED`, `BUFFER` (DES-LIQ),
`AGE_UNKNOWN` (no launch date anywhere) or `TOO_NEW` (under 6 months).

## Guardrails

- Universe: EQS* and HYB* schemes, plus OTH-EQS (index) and COM-FFD (gold FoF) for
  basket slots and DES-LIQ for the buffer only. ELSS and ETFs never.
- Only funds with latest-month AUM are scored (status `NO_AUM` otherwise).
- Suitability: 5 components (consistency, rank momentum, resilience, AUM, age), each a
  percentile within the fund's own GOC short code, weighted per persona (`personas.*.suitability`).
  Rank momentum = 50% x (1 - avg of last 3 ranks / total) + 50% x (oldest - latest rank) / total.
- Minimum fund age: 24 months for Large, Large & Mid and Flexi, 36 for Small Cap, otherwise
  24 months for Realistic Guardian / Prudent Treasurer, 18 for
  every other persona, 24 for the buffer.
- Fund count by monthly SIP: under 1k = 1, 1k-5k = 2, 5k-10k = 3, 10k-20k = 5,
  20k-35k = 6, 35k+ = 7; persona templates live in `basket.personas`.
- Each slot takes the fund of its own category with the best persona suitability; baskets are
  ordered by `basket.risk_order` and smaller tiers keep the lowest-risk slots;
  momentum is the latest category-rank percentile on rolling 6-month return.
- 1 fund per AMC in every basket; repeated slots
  from different AMCs; sectoral picks from different sectors.
- Equal split rounded to Rs 100; a fund is eligible only when its minimum investment
  fits its share and NSE SIP is allowed. Baskets are goal-agnostic.

## Local run

```bash
pip install -r requirements.txt
python -m pm_batch --as-of 2026-10-02 --output ./out \
  --source fund_cards=./fund_cards.parquet --source aum=./aum.parquet \
  --source rank_momentum=./rank_momentum.parquet --source batting_average=./batting_average.parquet \
  --source stress_events=./stress_events.parquet --source recovery_speed=./recovery_speed.parquet \
  --source returns= --source sip_3y= --source scheme_master=
pytest
```


## Cloud Run Job

All source URIs default to the GCS paths in the config, so no input flags are needed.

```bash
gcloud run jobs deploy personality-match \
  --source . \
  --region asia-south1 \
  --project gochanakya-main \
  --service-account personality-match-runner@gochanakya-main.iam.gserviceaccount.com \
  --set-env-vars "PM_OUTPUT_BUCKET=mf-data-public" \
  --memory 1Gi --cpu 1 --task-timeout 15m --max-retries 1
```

Run it after the fund-card pipeline refreshes `backend_main_kartik/*/latest`, or on a
monthly schedule. The service account needs read access to `backend_main_kartik/` and
`Scheme Master.csv`, and write access to `shortlisted_schemes/` and `personality_match/`.
