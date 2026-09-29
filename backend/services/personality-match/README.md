# Personality Match service

This service implements the three-stage GoWealthy fund matching pipeline:

1. `pm_batch.py` filters the fund universe, computes reusable features and writes all eight persona scores.
2. `pm_lookup.py` blends those scores with age, living situation, EMI load,
   spouse income, non-earning dependents, emergency fund, health insurance,
   investment horizon and crash reaction; `rank_funds(...)` returns the sorted
   listing.
3. `pm_basket.py` turns the adjusted listing into a diversified monthly SIP basket.

The bundled `scheme_config_master.yaml` is the source of truth for weights, thresholds, caps, labels and reason text.

## Local run

```bash
pip install -r requirements.txt
python -m pm_batch \
  --as-of 2026-09-26 \
  --input "gs://mf-data-public/backend_main_kartik/fund_cards/latest/fund_cards.json" \
  --scheme-master "gs://mf-data-public/Scheme Master.csv" \
  --output "gs://mf-data-public"
pytest
```

`--input` accepts a JSON file, a directory of JSON files, or `gs://bucket/prefix`.
The job writes both Parquet audit artifacts and the Node-readable
`personality_match/latest/scores.json`. The upload service reads that JSON on
each cache refresh. That JSON also carries the versioned user-adjustment rules,
so the live Node lookup uses the same thresholds as this Python engine rather
than maintaining a second hard-coded rule table.

For Cloud Run, configure:

```text
PM_INPUT_URI=gs://mf-data-public/backend_main_kartik/fund_cards/latest/fund_cards.json
PM_SCHEME_MASTER_URI=gs://mf-data-public/Scheme Master.csv
PM_OUTPUT_BUCKET=mf-data-public
PM_CALIBRATION_URI=/app/live_calibration.yaml
```

This is a batch job, not an HTTP server. Run it after the fund-card generation
pipeline or on a monthly schedule; the process exits after publishing scores.

## Cloud Run Job

```bash
gcloud run jobs deploy personality-match \
  --source . \
  --region asia-south1 \
  --project gochanakya-main \
  --service-account personality-match-runner@gochanakya-main.iam.gserviceaccount.com \
  --set-env-vars "PM_INPUT_URI=gs://mf-data-public/backend_main_kartik/fund_cards/latest/fund_cards.json,PM_SCHEME_MASTER_URI=gs://mf-data-public/Scheme Master.csv,PM_OUTPUT_BUCKET=mf-data-public,PM_CALIBRATION_URI=/app/live_calibration.yaml" \
  --memory 1Gi --cpu 1 --task-timeout 15m --max-retries 1
```

Unknown backend fields described as `TODO(confirm)` in the product spec are read through configurable aliases and logged when absent. They are never fabricated.
