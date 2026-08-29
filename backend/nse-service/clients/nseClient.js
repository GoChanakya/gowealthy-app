const axios = require("axios");
const https = require("https");

const httpsAgent =
    new https.Agent({

        keepAlive: true,

        minVersion: "TLSv1.3",

        maxVersion: "TLSv1.3",

        ciphers:
            "TLS_AES_256_GCM_SHA384:" +
            "TLS_CHACHA20_POLY1305_SHA256:" +
            "TLS_AES_128_GCM_SHA256"
    });

// No default. A silent fallback to UAT means live orders quietly go nowhere,
// which is near-impossible to spot from the app side. Fail loudly at startup.
if (!process.env.NSE_BASE_URL) {
    throw new Error(
        "NSE_BASE_URL is not set. Set it explicitly in backend/nse-service/.env. " +
        "Per NSE MFSS spec v1.9.6 p.6 — UAT: https://nseinvestuat.nseindia.com, " +
        "PROD: https://www.nseinvest.com"
    );
}

const client =
    axios.create({

        baseURL: process.env.NSE_BASE_URL,

        httpsAgent,

        timeout: Number(process.env.NSE_TIMEOUT_MS || 60000)
    });

module.exports = client;