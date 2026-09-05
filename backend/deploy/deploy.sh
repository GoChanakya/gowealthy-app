#!/usr/bin/env bash
# One-shot deploy of a backend service to Cloud Run.
#
#   ./deploy/deploy.sh nse-service
#   ./deploy/deploy.sh email-service
#   ./deploy/deploy.sh upload-service
#   ./deploy/deploy.sh scheme-job
#
# Required env: GCP_PROJECT (defaults to the active gcloud project)
# Optional env: REGION (asia-south1), REPO (gowealthy)
#
# Before first deploy, create the secrets once:
#   gcloud secrets create NSE_LOGIN_ID --data-file=- <<< "$NSE_LOGIN_ID"
#   ... (NSE_API_SECRET, NSE_MEMBER_API_KEY, NSE_MEMBER_CODE, MAILGUN_API_KEY, MAILGUN_DOMAIN)
# and grant the Cloud Run service account roles/secretmanager.secretAccessor.
set -euo pipefail

SERVICE="${1:?usage: deploy.sh <nse-service|email-service|upload-service|scheme-job>}"
PROJECT="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${REGION:-asia-south1}"
REPO="${REPO:-gowealthy}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}/${SERVICE}"

cd "$(dirname "$0")/.."

echo ">> Building ${SERVICE} -> ${IMAGE}"
# Built via the explicit config: `builds submit --tag` only understands a
# Dockerfile at the build-context root, and each service has its own.
gcloud builds submit --project "$PROJECT" --config deploy/cloudbuild.yaml \
  --substitutions="_SERVICE=${SERVICE},_REGION=${REGION},_REPO=${REPO}" .

# Per-service runtime configuration.
COMMON_FLAGS=(--project "$PROJECT" --region "$REGION" --platform managed --allow-unauthenticated)

case "$SERVICE" in
  nse-service)
    gcloud run services update "$SERVICE" "${COMMON_FLAGS[@]}" \
      --set-env-vars "NSE_BASE_URL=${NSE_BASE_URL:-https://nseinvestuat.nseindia.com}" \
      --set-secrets "NSE_LOGIN_ID=NSE_LOGIN_ID:latest,NSE_API_SECRET=NSE_API_SECRET:latest,NSE_MEMBER_API_KEY=NSE_MEMBER_API_KEY:latest,NSE_MEMBER_CODE=NSE_MEMBER_CODE:latest" \
      --min-instances 1 --max-instances 10 --concurrency 80 --timeout 120
    ;;
  email-service)
    # In-memory OTP store: keep to a single instance until a shared store is wired in.
    gcloud run services update "$SERVICE" "${COMMON_FLAGS[@]}" \
      --set-secrets "MAILGUN_API_KEY=MAILGUN_API_KEY:latest,MAILGUN_DOMAIN=MAILGUN_DOMAIN:latest" \
      --min-instances 1 --max-instances 1
    ;;
  upload-service)
    gcloud run services update "$SERVICE" "${COMMON_FLAGS[@]}" \
      --set-env-vars "GCP_PROJECT_ID=${PROJECT},UPLOAD_BUCKET=${UPLOAD_BUCKET:-document-ocr203}" \
      --max-instances 10
    ;;
  scheme-job)
    gcloud run services update "$SERVICE" "${COMMON_FLAGS[@]}" \
      --set-env-vars "NSE_BASE_URL=${NSE_BASE_URL:-https://nseinvestuat.nseindia.com},SCHEMES_BUCKET=${SCHEMES_BUCKET:-mf-data-public},SCHEMES_PATH=${SCHEMES_PATH:-nse-schemes/funds.json}" \
      --set-secrets "NSE_LOGIN_ID=NSE_LOGIN_ID:latest,NSE_API_SECRET=NSE_API_SECRET:latest,NSE_MEMBER_API_KEY=NSE_MEMBER_API_KEY:latest,NSE_MEMBER_CODE=NSE_MEMBER_CODE:latest" \
      --max-instances 1 --timeout 300
    ;;
esac

gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format='value(status.url)'
