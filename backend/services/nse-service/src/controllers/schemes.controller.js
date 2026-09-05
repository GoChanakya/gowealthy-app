import * as schemesService from "../services/schemes.service.js";

// SCHEME CATALOGUE - the live, tradeable fund list for the app.
// Request : { search?, amc_code?, sip_only?=true, limit?=50, refresh?=false, retail_only?=true }
export async function schemes(req, res) {
    const {
        search, amc_code, sip_only = true, limit = 50, refresh = false,
        retail_only = true,
    } = req.body || {};

    res.json(await schemesService.listTradeableSchemes({
        search, amc_code, sip_only, limit, refresh, retail_only,
    }));
}

// MASTER DOWNLOAD (count, or full inspection with { inspect: true })
export async function masterDownload(req, res) {
    console.log("hit");
    const file_type = req.body?.file_type || "SCH";
    const inspect = Boolean(req.body?.inspect);

    res.json(await schemesService.masterDownload({ file_type, inspect }));
}
