import { config } from "../config.js";
import { ValidationError, missingFields, requireNonEmptyArray } from "../lib/http.js";
import * as sipService from "../services/sip.service.js";

const SIP_REQUIRED_FIELDS = [
    "amc_code", "sch_code", "client_code", "trans_mode", "dp_txn_mode",
    "start_date", "frequency_type", "frequency_allowed",
    "installment_amount", "status", "member_code",
    "euin_declaration", "dpc_flag", "first_order_today",
];

// SIP REGISTRATION (spec pp. 25-29)
// Request : { reg_data: [ { amc_code, sch_code, client_code, trans_mode, dp_txn_mode, start_date,
//             frequency_type, frequency_allowed, installment_amount, status, installment_no,
//             sip_mandate_id?, euin_declaration, dpc_flag, first_order_today, ... } ] }
export async function sipRegister(req, res) {
    const { reg_data } = req.body;
    requireNonEmptyArray(reg_data, "reg_data");

    // Keep the NSE member code server-side. The mobile app should not need to
    // know or transmit this credential-level integration value.
    const rec = {
        ...reg_data[0],
        member_code: reg_data[0].member_code || config.nse.memberCode,
    };

    const missing = missingFields(rec, SIP_REQUIRED_FIELDS, { allowZero: true });
    if (missing.length) throw new ValidationError(`Missing SIP fields: ${missing.join(", ")}`);

    res.json(await sipService.sipRegister({ rec, requestId: req.activityId }));
}

// SIP REGISTRATION REPORT
// Request : { client_code?, sip_reg_id?, from_date?, to_date?, xsip? }
// Passing only client_code lists every SIP for that client.
export async function sipReport(req, res) {
    const body = req.body || {};
    if (!body.client_code && !body.sip_reg_id && !(body.from_date && body.to_date)) {
        throw new ValidationError("client_code, sip_reg_id, or a from_date/to_date range is required");
    }

    const payload = {
        ...(body.sip_reg_id ? { sip_reg_id: String(body.sip_reg_id) } : {}),
        ...(body.client_code ? { client_code: body.client_code } : {}),
        ...(body.from_date ? { from_date: body.from_date } : {}),
        ...(body.to_date ? { to_date: body.to_date } : {}),
    };

    res.json(await sipService.sipReport({ payload, xsip: Boolean(body.xsip), requestId: req.activityId }));
}

// SIP CANCELLATION
// remarks must be a two-digit reason code (01..13) or "13:(free text)".
//   01 No funds        02 Scheme not performing   03 Service issue
//   04 Load revised    05 Investing elsewhere     06 Fund manager change
//   07 Goal achieved   08 Market volatility       09 Restarting later
//   10 Bank/mandate change   11 Investing elsewhere   12 Wrong time
//   13 Others (specify)
export async function sipCancel(req, res) {
    const { client_code, sip_reg_no, remarks } = req.body || {};
    if (!client_code || !sip_reg_no) {
        throw new ValidationError("client_code and sip_reg_no are required");
    }

    // Default to "13:(...)": a bare free-text remark is rejected by NSE.
    const reason = remarks && /^(\d{2})(:|$)/.test(String(remarks).trim())
        ? String(remarks).trim()
        : `13:(${remarks || "Cancelled by investor"})`;

    res.json(await sipService.sipCancel({ client_code, sip_reg_no, reason, requestId: req.activityId }));
}

// SIP <-> MANDATE MAPPING (attach an approved mandate to a registered SIP)
export async function sipUmrn(req, res) {
    const { sip_reg_id, umrn, remark } = req.body || {};
    if (!sip_reg_id || !umrn) {
        throw new ValidationError("sip_reg_id and umrn are required");
    }

    res.json(await sipService.sipUmrn({ sip_reg_id, umrn, remark, requestId: req.activityId }));
}
