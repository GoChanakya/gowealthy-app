import dotenv from "dotenv";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

// Local dev uses a service-account key file next to the service; on GCP the
// default credentials of the Cloud Run service account are used instead.
const defaultKeyFile = fileURLToPath(new URL("../service-account-key.json", import.meta.url));
const keyFilename = process.env.GCS_KEY_FILE || (fs.existsSync(defaultKeyFile) ? defaultKeyFile : undefined);

export const config = Object.freeze({
    serviceName: "upload-service",
    port: Number(process.env.PORT || 3001),
    gcs: Object.freeze({
        projectId: process.env.GCP_PROJECT_ID || "gowealthy-app",
        bucketName: process.env.UPLOAD_BUCKET || "document-ocr203",
        keyFilename,
        signedPolicyTtlMs: 15 * 60 * 1000,
    }),
});
