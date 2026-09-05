import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

function requireEnv(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

// This job may run against UAT when no base URL is configured, unlike
// nse-service which refuses to start without one.
const baseUrl = process.env.NSE_BASE_URL || "https://nseinvestuat.nseindia.com";

export const config = Object.freeze({
    serviceName: "scheme-job",
    port: Number(process.env.PORT || 8080),
    nse: Object.freeze({
        loginId: requireEnv("NSE_LOGIN_ID"),
        apiSecret: requireEnv("NSE_API_SECRET"),
        memberApiKey: requireEnv("NSE_MEMBER_API_KEY"),
        memberCode: requireEnv("NSE_MEMBER_CODE"),
        baseUrl,
        referer: process.env.NSE_REFERER,
        origin: process.env.NSE_ORIGIN,
        userAgent: process.env.NSE_USER_AGENT,
        timeoutMs: Number(process.env.NSE_TIMEOUT_MS || 60000),
    }),
    gcs: Object.freeze({
        // Must match SCHEMES_BUCKET / SCHEMES_PATH in mobile/src/config/services.js
        bucketName: process.env.SCHEMES_BUCKET || "mf-data-public",
        objectPath: process.env.SCHEMES_PATH || "nse-schemes/funds.json",
    }),
});
