import axios from "axios";
import https from "https";

/**
 * Creates an axios instance pointed at the NSE MFSS API.
 *
 * NSE currently requires TLS 1.3 with a restricted cipher set, so the agent is
 * pinned accordingly and kept alive across requests.
 *
 * @param {{ baseUrl: string, timeoutMs?: number }} options
 */
export function createNseClient({ baseUrl, timeoutMs = 60000 }) {
    if (!baseUrl) {
        throw new Error("createNseClient: baseUrl is required");
    }

    const httpsAgent = new https.Agent({
        keepAlive: true,
        minVersion: "TLSv1.3",
        maxVersion: "TLSv1.3",
        ciphers:
            "TLS_AES_256_GCM_SHA384:" +
            "TLS_CHACHA20_POLY1305_SHA256:" +
            "TLS_AES_128_GCM_SHA256",
    });

    return axios.create({
        baseURL: baseUrl,
        httpsAgent,
        timeout: Number(timeoutMs),
    });
}
