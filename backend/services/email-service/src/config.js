import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

export const config = Object.freeze({
    serviceName: "email-service",
    port: Number(process.env.PORT || 5000),
    nodeEnv: process.env.NODE_ENV || "development",
    corsOrigins: ["http://localhost:5173", "https://gowealthy.app", "https://www.gowealthy.app"],
    mailgun: Object.freeze({
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
    }),
    otp: Object.freeze({
        ttlMs: 10 * 60 * 1000,      // OTP valid for 10 minutes
        maxAttempts: 3,             // wrong guesses before the OTP is discarded
        cleanupIntervalMs: 5 * 60 * 1000,
    }),
});
