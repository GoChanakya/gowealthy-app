import { NSE_ENDPOINTS, parseMasterDownload, inspectMasterDownload } from "@gowealthy/nse-core";
import { nsePost } from "../lib/nse.js";

// The scheme master is ~13.6k rows and takes about a second to fetch and parse.
// It changes once a day, so hold it in memory (per instance) rather than
// re-pulling per request.
const SCHEME_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let schemeCache = { schemes: null, fetchedAt: 0 };

/** Raw master file text for a file_type (SCH by default). */
export async function downloadMasterRaw(file_type = "SCH") {
    const response = await nsePost(NSE_ENDPOINTS.MASTER_DOWNLOAD, { file_type });
    // response.data is the raw pipe-delimited text; stringify as a safety net.
    return typeof response.data === "string" ? response.data : JSON.stringify(response.data);
}

/** Parsed scheme master, cached for SCHEME_CACHE_TTL_MS. */
export async function getSchemeMaster({ force = false } = {}) {
    const fresh = schemeCache.schemes && (Date.now() - schemeCache.fetchedAt) < SCHEME_CACHE_TTL_MS;
    if (fresh && !force) return schemeCache.schemes;

    const rawText = await downloadMasterRaw("SCH");
    schemeCache = { schemes: parseMasterDownload(rawText), fetchedAt: Date.now() };
    console.log(`📚 [schemes] cached ${schemeCache.schemes.length} schemes from live master`);
    return schemeCache.schemes;
}

export function schemeCacheFetchedAt() {
    return new Date(schemeCache.fetchedAt).toISOString();
}

/**
 * Live tradeable scheme catalogue: AMC active, purchase allowed, and (by
 * default) SIP allowed and retail-friendly. Everything the UI needs to show a
 * fund and validate an amount comes from here.
 */
export async function listTradeableSchemes({ search, amc_code, sip_only, limit, refresh, retail_only }) {
    const all = await getSchemeMaster({ force: Boolean(refresh) });
    const term = String(search || "").trim().toUpperCase();

    const tradeable = all.filter((s) => {
        if (s.amc_active_flag !== "Y") return false;
        if (s.purchase_allowed !== "Y") return false;
        if (sip_only && s.sip_allowed !== "Y") return false;
        // "L1" settlement classes are the institutional same-day variants:
        // ~2 lakh minimums, and they cannot be redeemed or switched. They
        // duplicate every fund in the list and would only produce rejected
        // retail orders.
        if (retail_only && s.settlement_type === "L1") return false;
        if (retail_only && s.redemption_allowed !== "Y") return false;
        if (amc_code && s.amc_code !== amc_code) return false;
        if (term && !(`${s.scheme_name} ${s.scheme_code}`.toUpperCase().includes(term))) return false;
        return true;
    });

    const schemes = tradeable.slice(0, Math.min(Number(limit) || 50, 500)).map((s) => ({
        scheme_code: s.scheme_code,
        scheme_name: s.scheme_name,
        amc_code: s.amc_code,
        isin: s.isin,
        scheme_type: s.scheme_type,
        plan_type: s.plan_type,
        min_purchase: Number(s.new_purchase_min_amount) || 0,
        purchase_multiplier: Number(s.purchase_amount_multiplier) || 1,
        sip_allowed: s.sip_allowed === "Y",
        switch_allowed: s.switch_allowed === "Y",
        redemption_allowed: s.redemption_allowed === "Y",
        settlement_type: s.settlement_type,
        purchase_cutoff_time: s.purchase_cutoff_time,
        exit_load: s.exit_load,
        lock_in_period: s.lock_in_period,
    }));

    return {
        success: true,
        total_tradeable: tradeable.length,
        returned: schemes.length,
        cached_at: schemeCacheFetchedAt(),
        schemes,
    };
}

/**
 * Master download. With `inspect`, returns the raw header list, a sample row
 * and the AMC codes present. The scheme master is the only authoritative list
 * of AMCs mapped to this member. Note the two AMC code systems in the NSE spec
 * are NOT interchangeable:
 *   - long form here (e.g. AXISMUTUALFUND_MF) -> SIP/XSIP amc_code
 *   - short RTA form (e.g. AXF, MOF, ABSL)     -> EKYCREG amcCode
 */
export async function masterDownload({ file_type = "SCH", inspect = false }) {
    const rawText = await downloadMasterRaw(file_type);
    const schemes = parseMasterDownload(rawText);

    if (!inspect) {
        return { success: true, count: schemes.length };
    }

    const { headers, sampleRow } = inspectMasterDownload(rawText);
    const byAmc = new Map();
    for (const s of schemes) {
        const code = (s.amc_code || "").trim();
        if (!code) continue;
        if (!byAmc.has(code)) {
            byAmc.set(code, { amc_code: code, scheme_count: 0, sample_scheme: s.scheme_name });
        }
        byAmc.get(code).scheme_count += 1;
    }

    return {
        success: true,
        count: schemes.length,
        headers,
        sample_row: sampleRow,
        amc_codes: [...byAmc.values()].sort((a, b) => b.scheme_count - a.scheme_count),
    };
}
