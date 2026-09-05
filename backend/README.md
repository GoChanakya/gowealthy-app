# GoWealthy backend

npm-workspaces monorepo. Four independently deployable Cloud Run services plus one shared package.

```
backend/
├── package.json              workspace root (scripts: dev:*, start:*)
├── packages/
│   └── nse-core/             shared NSE MFSS client: AES auth, headers, endpoints, master parser
├── services/
│   ├── nse-service/          app <-> NSE gateway            (local :3000)
│   ├── upload-service/       signed GCS upload policies     (local :3001)
│   ├── email-service/        email OTP via Mailgun          (local :5000)
│   └── scheme-job/           scheme master -> public GCS    (local :8080)
├── deploy/                   cloudbuild.yaml + deploy.sh (Cloud Run)
├── docker-compose.yml        run the whole stack locally
├── docs/                     NSE MFSS API spec v1.9.6
└── scripts/lan-ip.js         prints the LAN IP the phone should use
```

Every service follows the same layout:

```
src/
├── index.js        listen() + startup banner
├── app.js          createApp(): middleware + routes (no listen, testable)
├── config.js       env loading + validation, frozen config object
├── lib/            infrastructure (nse client, logger, gcs, mailer, helpers)
├── middleware/     cors, activity log, error handler
├── routes/         express routers: path -> controller
├── controllers/    request validation + response shaping
└── services/       the actual NSE / GCS / Mailgun calls
```

## Public API (unchanged from v1)

| Service | Route | NSE endpoint |
| --- | --- | --- |
| nse-service | `GET  /api/nse/health` | - |
| nse-service | `POST /api/nse/kyc-check` | `utility/KYC_CHECK` |
| nse-service | `POST /api/nse/ekyc-register` | `EKYC/EKYCREG` |
| nse-service | `POST /api/nse/ucc-register` | `registration/CLIENTCOMMON183` |
| nse-service | `POST /api/nse/ucc-modify` | `registration/CLIENTMODIFICATION` |
| nse-service | `POST /api/nse/fatca-upload` | `registration/FATCA` |
| nse-service | `POST /api/nse/bank-add` | `registration/CLIENTBANKDTL` |
| nse-service | `POST /api/nse/cancel-cheque-upload` | `fileupload/CANCELCHEQUE` |
| nse-service | `POST /api/nse/bank-elog` | `registration/ELOGBANK` |
| nse-service | `POST /api/nse/bank-status` | `reports/client_master_report` |
| nse-service | `POST /api/nse/get-link` | `reports/GET_LINK` |
| nse-service | `POST /api/nse/resend-comm` | `registration/RESEND_COMM` |
| nse-service | `POST /api/nse/client-auth-status` | `reports/client_authorization` |
| nse-service | `POST /api/nse/order-entry` | `transaction/NORMAL` |
| nse-service | `POST /api/nse/purchase-payment` | `payments/purchase_payment` |
| nse-service | `POST /api/nse/schemes` | `reports/MASTER_DOWNLOAD` (cached 6h) |
| nse-service | `POST /api/nse/master-download` | `reports/MASTER_DOWNLOAD` |
| nse-service | `POST /api/nse/mandate-register` | `registration/product/MANDATE` |
| nse-service | `POST /api/nse/mandate-status` | `reports/MANDATE_STATUS` |
| nse-service | `POST /api/nse/sip-register` | `registration/product/SIP` |
| nse-service | `POST /api/nse/sip-cancel` | `cancellation/SIP_CAN` |
| nse-service | `POST /api/nse/sip-umrn` | `registration/SIPUMRN` |
| email-service | `POST /api/send-otp`, `POST /api/verify-otp`, `GET /api/health` | - |
| upload-service | `POST /api/generate-upload-url`, `GET /api/health` | - |
| scheme-job | `POST /api/nse/master-download`, `GET /api/health` | `reports/MASTER_DOWNLOAD` |

Request/response shapes and validation messages are identical to the previous single-file services.

## Local development

```bash
cd backend
npm install                       # installs every workspace once
cp services/nse-service/.env.example services/nse-service/.env   # and fill in (same for the others)

npm run dev:nse                   # :3000  (node --watch)
npm run dev:upload                # :3001
npm run dev:email                 # :5000
npm run dev:scheme-job            # :8080
npm run lan-ip                    # IP to point the phone at
```

Or the whole stack in containers: `docker compose up --build`.

## Deploy to GCP (Cloud Run)

One-time setup:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
gcloud artifacts repositories create gowealthy --repository-format=docker --location=asia-south1
for s in NSE_LOGIN_ID NSE_API_SECRET NSE_MEMBER_API_KEY NSE_MEMBER_CODE MAILGUN_API_KEY MAILGUN_DOMAIN; do
  printf '%s' "$VALUE" | gcloud secrets create "$s" --data-file=-
done
```

Then per service:

```bash
./deploy/deploy.sh nse-service
./deploy/deploy.sh upload-service
./deploy/deploy.sh email-service
./deploy/deploy.sh scheme-job
```

`deploy.sh` runs `deploy/cloudbuild.yaml` (build from the monorepo root with the service's Dockerfile, push to Artifact Registry, `gcloud run deploy`) and then attaches env vars and secrets.

Notes:

- Cloud Run injects `PORT=8080`; every service reads `PORT` so no code change is needed.
- `upload-service` and `scheme-job` use the Cloud Run service account for GCS (grant `roles/storage.objectAdmin` on the buckets). The local `service-account-key.json` is only for dev and is git-ignored.
- `nse-service` must have NSE's IP whitelist updated with the Cloud Run egress IP. Use a Serverless VPC connector + Cloud NAT with a static IP so the address is stable.
- `email-service` keeps OTPs in memory, so it is pinned to `max-instances=1`. To scale it out, replace `src/lib/otpStore.js` with a Firestore/Redis-backed store using the same `get/set/delete/cleanup` contract.
- `scheme-job` is meant to be hit by Cloud Scheduler once a day: `POST https://<scheme-job-url>/api/nse/master-download`.
- After deploying, point `FALLBACK_IP`/service URLs in `mobile/src/config/services.js` at the Cloud Run URLs.
