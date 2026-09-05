import { createNseClient, buildNseHeaders } from "@gowealthy/nse-core";
import { config } from "../config.js";

export const nseClient = createNseClient({
    baseUrl: config.nse.baseUrl,
    timeoutMs: config.nse.timeoutMs,
});

export function nsePost(path, body) {
    return nseClient.post(path, body, { headers: buildNseHeaders(config.nse) });
}
