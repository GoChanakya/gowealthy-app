/**
 * Parses the pipe-delimited scheme master returned by
 * /nsemfdesk/api/v2/reports/MASTER_DOWNLOAD (file_type = "SCH") into the
 * clean row shape used across the app.
 *
 * @param {string} rawText
 * @returns {object[]}
 */
export function parseMasterDownload(rawText) {
    // Split into lines, drop empty ones (NSE files often end with a trailing newline or a stray blank line)
    const lines = rawText.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length < 2) return [];

    // Header row: split on "|", trim, drop trailing empty column (file ends with a "|")
    const headers = lines[0].split("|").map((h) => h.trim()).filter((h) => h.length > 0);

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split("|");
        if (cols.length < 2) continue; // skip junk/blank lines

        const row = {};
        headers.forEach((h, idx) => {
            row[h] = (cols[idx] ?? "").trim();
        });
        rows.push(row);
    }

    return rows.map((r) => ({
        unique_sr_no: r["UNIQUE SR NO"],
        scheme_code: r["SCHEME CODE"],
        rta_scheme_code: r["RTA SCHEME CODE"],
        amc_scheme_code: r["AMC SCHEME CODE"],
        isin: r["ISIN"],
        amc_code: r["AMC CODE"],
        scheme_type: r["SCHEME TYPE"],
        plan_type: r["PLAN TYPE"],
        scheme_name: r["SCHEME NAME"],

        purchase_allowed: r["PURCHASE ALLOWED"],
        purchase_transaction_mode: r["PURCHASE TRANSACTION MODE"],
        new_purchase_min_amount: r["NEW PURCHASE MIN AMOUNT"],
        additional_purchase_min_amount: r["ADDITIONAL PURCHASE MIN AMOUNT"],
        additional_purchase_max_amount: r["ADDITIONAL PURCHASE MAX AMOUNT"],
        purchase_amount_multiplier: r["PURCHASE AMOUNT MULTIPLIER"],
        purchase_cutoff_time: r["PURCHASE CUTOFF TIME"],

        redemption_allowed: r["REDEMPTION ALLOWED"],
        redemption_transaction_mode: r["REDEMPTION TRANSACTION MODE"],
        redemption_min_qty: r["REDEMPTION MIN QTY"],
        redemption_qty_multiplier: r["REDEMPTION QTY MULTIPLIER"],
        redemption_max_qty: r["REDEMPTION MAX QTY"],
        redemption_min_amount: r["REDEMPTION MIN AMOUNT"],
        redemption_max_amount: r["REDEMPTION MAX AMOUNT"],
        redemption_amount_multiplier: r["REDEMPTION AMOUNT MULTIPLIER"],
        redemption_cutoff_time: r["REDEMPTION CUTOFF TIME"],

        rta_agent_code: r["RTA AGENT CODE"],
        amc_active_flag: r["AMC ACTIVE FLAG"],
        div_reinvest_flag: r["DIV REINVEST FLAG"],

        sip_allowed: r["SIP ALLOWED"],
        stp_enabled: r["STP ENABLED"],
        swp_enabled: r["SWP ENABLED"],
        switch_allowed: r["SWITCH ALLOWED"],

        settlement_type: r["SETTLEMENT TYPE"],
        amc_ind: r["AMC IND"],

        face_value: r["FACE VALUE"],
        scheme_start_date: r["SCHEME START DATE"],
        maturity_date: r["MATURITY DATE"],

        exit_load_flag: r["EXIT LOAD FLAG"],
        exit_load: r["EXIT LOAD"],

        lock_in_period_flag: r["LOCK IN PERIOD_FLAG"],
        lock_in_period: r["LOCK IN PERIOD"],

        channel_partner_code: r["CHANNEL PARTNER CODE"],
        reopening_date: r["REOPENING DATE"],
    }));
}

/** Header names and one sample row from a raw master file (inspection helper). */
export function inspectMasterDownload(rawText) {
    const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const headers = (lines[0] || "").split("|").map((h) => h.trim()).filter(Boolean);
    return { headers, sampleRow: lines[1] || null };
}
