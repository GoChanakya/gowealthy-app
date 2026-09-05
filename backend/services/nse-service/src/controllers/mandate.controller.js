import { ValidationError, missingFields, requireNonEmptyArray } from "../lib/http.js";
import * as mandateService from "../services/mandate.service.js";

const MANDATE_REQUIRED_FIELDS = [
    "client_code", "amount", "mandate_type", "account_no", "ac_type", "ifsc_code", "start_date", "end_date",
];

// MANDATE REGISTRATION (needed before SIP orders with mandate payment)
// Request : { reg_data: [ { client_code, amount, mandate_type: "E"|"X", account_no, ac_type, ifsc_code, micr_no?, start_date, end_date } ] }
// Response: { reg_data: [{ ..., reg_id, reg_status: "REG_SUCCESS"|"REG_FAILED", reg_remark }] }
export async function mandateRegister(req, res) {
    const { reg_data } = req.body;
    requireNonEmptyArray(reg_data, "reg_data");

    const missing = missingFields(reg_data[0], MANDATE_REQUIRED_FIELDS);
    if (missing.length) throw new ValidationError(`Missing mandate fields: ${missing.join(", ")}`);

    res.json(await mandateService.mandateRegister({ reg_data, requestId: req.activityId }));
}

// MANDATE STATUS (approved? UMRN?)
// Request : { mandate_id? , client_code? }  (at least one)
export async function mandateStatus(req, res) {
    const { mandate_id, client_code } = req.body || {};
    if (!mandate_id && !client_code) {
        throw new ValidationError("mandate_id or client_code is required");
    }

    res.json(await mandateService.mandateStatus({ mandate_id, client_code, requestId: req.activityId }));
}
