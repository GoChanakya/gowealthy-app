import { NSE_ENDPOINTS, parseMasterDownload } from "@gowealthy/nse-core";
import { nsePost } from "../lib/nse.js";
import { uploadSchemesJson } from "../lib/gcs.js";

/**
 * Pulls the scheme master from NSE, parses it and publishes the JSON to GCS.
 * Returns the number of schemes published.
 */
export async function refreshSchemeMaster(file_type = "SCH") {
    const response = await nsePost(NSE_ENDPOINTS.MASTER_DOWNLOAD, { file_type });

    // response.data is the raw pipe-delimited text; stringify as a safety net.
    const rawText = typeof response.data === "string" ? response.data : JSON.stringify(response.data);

    const schemes = parseMasterDownload(rawText);
    await uploadSchemesJson(schemes);

    return schemes.length;
}
