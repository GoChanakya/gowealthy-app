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
    fundRecommendations: Object.freeze({
        bucketName: process.env.FUND_DATA_BUCKET || "mf-data-public",
        fundCardsPath: process.env.FUND_CARDS_PATH || "backend_main_kartik/fund_cards/latest/fund_cards.json",
        schemeMasterPath: process.env.SCHEME_MASTER_PATH || "Scheme Master.csv",
        personalityScoresPath: process.env.PERSONALITY_SCORES_PATH || "personality_match/latest/scores.json",
        cacheTtlMs: Number(process.env.FUND_DATA_CACHE_TTL_MS || 5 * 60 * 1000),
        topLimit: Number(process.env.FUND_RECOMMENDATION_LIMIT || 10),
    }),
});
