import { createNseClient, buildNseHeaders } from "@gowealthy/nse-core";
import { config } from "../config.js";

export const nseClient = createNseClient({
    baseUrl: config.nse.baseUrl,
    timeoutMs: config.nse.timeoutMs,
});

/**
 * POST to an NSE endpoint with a freshly built auth header set.
 * Returns the full axios response so callers can read status and data.
 */
export function nsePost(path, body) {
    return nseClient.post(path, body, { headers: buildNseHeaders(config.nse) });
}
