import axios from "axios";
import https from "https";

const httpsAgent = new https.Agent({
    keepAlive: true,

    // NSE currently requires TLS 1.3
    minVersion: "TLSv1.3",
    maxVersion: "TLSv1.3",

    ciphers:
        "TLS_AES_256_GCM_SHA384:" +
        "TLS_CHACHA20_POLY1305_SHA256:" +
        "TLS_AES_128_GCM_SHA256"
});

const nseClient = axios.create({
    baseURL:
        process.env.NSE_BASE_URL ||
        "https://nseinvestuat.nseindia.com",

    httpsAgent,

    timeout: Number(process.env.NSE_TIMEOUT_MS || 60000),

    headers: {
        "Content-Type": "application/json"
    }
});

export default nseClient;