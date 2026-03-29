require("dotenv").config();

const express = require("express");

const { aesEncrypt } =
    require("./utils/encryption");

const { buildAuthHeader } =
    require("./utils/auth");

const nseClient =
    require("./clients/nseClient");

const app = express();

app.use(express.json());

// Lightweight CORS for mobile/web clients (no extra dependency)
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,OPTIONS"
    );
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

function getRequiredEnv(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

function buildNseAuthHeader() {
    const enc = aesEncrypt(
        getRequiredEnv("NSE_API_SECRET"),
        getRequiredEnv("NSE_MEMBER_API_KEY")
    );
    return buildAuthHeader(
        getRequiredEnv("NSE_LOGIN_ID"),
        enc.encryptedPassword
    );
}

/**
 * NSE UAT/PROD sits behind Akamai. Referer must match the same host as NSE_BASE_URL
 * (see `nse/postman/nse-collection-pre-request.js`: Referer = url + '/').
 * A production login Referer against the UAT host often returns edgesuite HTML errors.
 */
function nseReferer() {
    const base =
        process.env.NSE_BASE_URL ||
        "https://nseinvestuat.nseindia.com";
    if (process.env.NSE_REFERER) {
        return process.env.NSE_REFERER;
    }
    return `${new URL(base).origin}/`;
}

function buildNseHeaders() {
    const referer = nseReferer();
    const ua =
        process.env.NSE_USER_AGENT ||
        "PostmanRuntime/7.51.1";

    const headers = {
        Authorization: buildNseAuthHeader(),
        memberId: getRequiredEnv("NSE_MEMBER_CODE"),
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": ua,
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US",
        Connection: "keep-alive",
        Referer: referer
    };
    if (process.env.NSE_ORIGIN) {
        headers.Origin = process.env.NSE_ORIGIN;
    }
    return headers;
}

app.get("/", (req, res) => {

    res.send(
        "NSE Node working"
    );

});

app.get("/api/nse/health", (req, res) => {
    res.json({
        ok: true,
        service: "nse-service",
        time: new Date().toISOString()
    });
});

app.post("/api/nse/master-download", async (req, res) => {
    try {
        const file_type = req.body?.file_type || "SCH";
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/reports/MASTER_DOWNLOAD",
            { file_type },
            { headers: buildNseHeaders() }
        );
        res.json(response.data);
    } catch (err) {
        res.status(500).json({
            error: err.response?.data || err.message
        });
    }
});

// Example from `nse/_postman_summary.txt`
app.post("/api/nse/kyc-check", async (req, res) => {
    try {
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/utility/KYC_CHECK",
            req.body || {},
            { headers: buildNseHeaders() }
        );
        res.json(response.data);
    } catch (err) {
        res.status(500).json({
            error: err.response?.data || err.message
        });
    }
});

// Backwards-compatible proof route
app.post("/test-master", async (req, res) => {
    try {
        const file_type = req.body?.file_type || "SCH";
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/reports/MASTER_DOWNLOAD",
            { file_type },
            { headers: buildNseHeaders() }
        );
        res.json(response.data);
    } catch (err) {
        res.status(500).json({
            error: err.response?.data || err.message
        });
    }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    console.log(`nse-service running on http://localhost:${port}`);
});