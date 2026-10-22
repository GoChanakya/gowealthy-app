# Deploys the backend-main Cloud Run service (region asia-south1) and its daily 01:00 IST schedule.
# Output goes to gs://mf-data-public/backend_main_kartik/<dataset>/; missing folders are created on the
# first run. Safe to re-run: every step checks before creating.
$ErrorActionPreference = "Stop"

$PROJECT = "gochanakya-main"
$REGION  = "asia-south1"
$SERVICE = "backend-main"
$BUCKET  = "mf-data-public"
$SA      = "backend-main-runner@$PROJECT.iam.gserviceaccount.com"

function Invoke-Gcloud { gcloud @args; if ($LASTEXITCODE -ne 0) { throw "gcloud $($args -join ' ') failed" } }
function Invoke-GcloudRetry {  # IAM steps: a just-created service account can take a minute to be usable
    for ($i = 1; $i -le 8; $i++) {
        $ErrorActionPreference = "Continue"; gcloud @args 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { return }
        Write-Host "  waiting for the service account to be ready (attempt $i of 8)..."; Start-Sleep -Seconds 15
    }
    throw "gcloud $($args -join ' ') failed after retries"
}
function Test-Gcloud   {  # "does it exist?" check; a not-found error must not stop the script
    $ErrorActionPreference = "Continue"; gcloud @args 2>$null | Out-Null; return ($LASTEXITCODE -eq 0)
}

Invoke-Gcloud config set project $PROJECT
Invoke-Gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com cloudscheduler.googleapis.com iam.googleapis.com

# 1. Service account: read + write objects in mf-data-public only
if (-not (Test-Gcloud iam service-accounts describe $SA)) {
    Invoke-Gcloud iam service-accounts create backend-main-runner --display-name="backend-main datasets"
}
Invoke-GcloudRetry storage buckets add-iam-policy-binding "gs://$BUCKET" --member="serviceAccount:$SA" --role=roles/storage.objectAdmin

# 2. Private Cloud Run service (Dockerfile build), one run at a time
Invoke-Gcloud run deploy $SERVICE --source . --region $REGION --service-account $SA `
    --no-allow-unauthenticated --cpu 1 --memory 4Gi --timeout 900 --concurrency 1 --max-instances 1 --quiet
$URL = (gcloud run services describe $SERVICE --region $REGION --format="value(status.url)").Trim()
Invoke-GcloudRetry run services add-iam-policy-binding $SERVICE --region $REGION --member="serviceAccount:$SA" --role=roles/run.invoker

# 3. Let Cloud Scheduler mint an OIDC token as this service account
$PROJECT_NUM = (gcloud projects describe $PROJECT --format="value(projectNumber)").Trim()
Invoke-GcloudRetry iam service-accounts add-iam-policy-binding $SA `
    --member="serviceAccount:service-$PROJECT_NUM@gcp-sa-cloudscheduler.iam.gserviceaccount.com" `
    --role=roles/iam.serviceAccountTokenCreator --condition=None --quiet

# 4. Daily at 01:00 IST, after nav-daily (00:15 IST) refreshes nav_history.parquet
$sched = @("--location", $REGION, "--schedule", "0 1 * * *", "--time-zone", "Asia/Kolkata", "--http-method", "POST",
           "--uri", "$URL/run", "--oidc-service-account-email", $SA, "--oidc-token-audience", $URL, "--attempt-deadline", "900s")
if (Test-Gcloud scheduler jobs describe "$SERVICE-daily" --location $REGION) {
    Invoke-Gcloud scheduler jobs update http "$SERVICE-daily" @sched
} else {
    Invoke-Gcloud scheduler jobs create http "$SERVICE-daily" @sched
}

Write-Host "`nDeployed $URL"
Write-Host "Run it once now:  gcloud scheduler jobs run $SERVICE-daily --location $REGION"
