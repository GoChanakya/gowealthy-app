import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { nseEnvironment } from "@gowealthy/nse-core";

// Load the service-local .env when present (local dev). On Cloud Run the
// variables come from the service configuration / Secret Manager instead.
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

function requireEnv(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

// No default base URL. A silent fallback to UAT means live orders quietly go
// nowhere, which is near-impossible to spot from the app side. Fail loudly at
// startup.
if (!process.env.NSE_BASE_URL) {
    throw new Error(
        "NSE_BASE_URL is not set. Set it explicitly in backend/services/nse-service/.env. " +
        "Per NSE MFSS spec v1.9.6 p.6 - UAT: https://nseinvestuat.nseindia.com, " +
        "PROD: https://www.nseinvest.com"
    );
}

const nse = Object.freeze({
    loginId: requireEnv("NSE_LOGIN_ID"),
    apiSecret: requireEnv("NSE_API_SECRET"),
    memberApiKey: requireEnv("NSE_MEMBER_API_KEY"),
    memberCode: requireEnv("NSE_MEMBER_CODE"),
    baseUrl: requireEnv("NSE_BASE_URL"),
    referer: process.env.NSE_REFERER,
    origin: process.env.NSE_ORIGIN,
    userAgent: process.env.NSE_USER_AGENT,
    timeoutMs: Number(process.env.NSE_TIMEOUT_MS || 60000),
});

export const config = Object.freeze({
    serviceName: "nse-service",
    port: Number(process.env.PORT || 3000),
    nse,
    nseEnvironment: nseEnvironment(nse.baseUrl),
});
