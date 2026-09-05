import { ValidationError, missingFields, requireNonEmptyArray } from "../lib/http.js";
import * as bankService from "../services/bank.service.js";

const BANK_ACCOUNT_TYPES = ["SB", "CB", "NE", "NO"];

// SCREEN 6 - BANK ACCOUNT ADD/DELETE
// Request : { bank_dtl: [ { client_code, action_type, account_type, account_no, micr_no, ifsc_code, default_bank_flag } ] }
// Response: { bank_dtl: [{ ...fields, status: "SUCCESS"|"FAIL", error_remark }] }
export async function bankAdd(req, res) {
    const { bank_dtl } = req.body;
    requireNonEmptyArray(bank_dtl, "bank_dtl");

    const missing = missingFields(bank_dtl[0], [
        "client_code", "action_type", "account_type", "account_no", "ifsc_code", "default_bank_flag",
    ]);
    if (missing.length) throw new ValidationError(`Missing bank fields: ${missing.join(", ")}`);

    res.json(await bankService.bankAdd(bank_dtl));
}

// Cancelled cheque image for a client bank account (bank verification).
export async function cancelChequeUpload(req, res) {
    const body = req.body || {};
    const missing = missingFields(body, ["file_name", "client_code", "account_no", "ifsc", "account_type", "file_data"]);
    if (missing.length) throw new ValidationError(`Missing fields: ${missing.join(", ")}`);
    if (!BANK_ACCOUNT_TYPES.includes(body.account_type)) {
        throw new ValidationError("account_type must be SB, CB, NE or NO");
    }

    const { file_name, client_code, account_no, ifsc, account_type, file_data } = body;
    res.json(await bankService.cancelChequeUpload({
        file_name, client_code, account_no, ifsc, account_type, file_data, requestId: req.activityId,
    }));
}

// Bank eLog: electronic consent record for the client's bank account.
export async function bankElog(req, res) {
    const body = req.body || {};
    const missing = missingFields(body, ["client_code", "account_no", "ifsc", "beneficiary_name"]);
    if (missing.length) throw new ValidationError(`Missing fields: ${missing.join(", ")}`);

    const { client_code, account_no, ifsc, request_date, beneficiary_name } = body;
    res.json(await bankService.bankElog({
        client_code, account_no, ifsc, request_date, beneficiary_name, requestId: req.activityId,
    }));
}

// Bank verification status readback (replaces a third-party penny drop).
export async function bankStatus(req, res) {
    const { client_code } = req.body || {};
    if (!client_code) throw new ValidationError("client_code is required");

    res.json(await bankService.bankStatus({ client_code, requestId: req.activityId }));
}
