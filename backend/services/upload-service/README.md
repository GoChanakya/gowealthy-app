# Upload service

Runs on port `3001`. Issues signed Google Cloud Storage POST policies so the app
can upload KYC documents straight to the bucket.

- `POST /api/generate-upload-url`  `{ fileName, contentType, userId, docType }`
- `GET /api/health`

Fund recommendations moved to `services/recommendation-service` (port `3002`).

For local development, place a rotated service-account key at
`backend/services/upload-service/service-account-key.json` (gitignored). On Cloud
Run, do not deploy a JSON key: give the Cloud Run service identity the upload
bucket permissions; Application Default Credentials are used automatically.
