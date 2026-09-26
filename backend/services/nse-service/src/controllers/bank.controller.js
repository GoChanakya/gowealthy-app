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

// NSE-side bank activation status after the verified account is added to UCC.
export async function bankStatus(req, res) {
    const { client_code } = req.body || {};
    if (!client_code) throw new ValidationError("client_code is required");

    res.json(await bankService.bankStatus({ client_code, requestId: req.activityId }));
}

// RazorpayX composite Fund Account Validation. Passing validation_id polls an
// already-created penny drop instead of creating (and charging for) a new one.
export async function bankVerify(req, res) {
    const body = req.body || {};

    if (body.validation_id) {
        if (!/^fav_[A-Za-z0-9]+$/.test(body.validation_id)) {
            throw new ValidationError("validation_id is invalid");
        }
        return res.json(await bankService.verifyBankAccount({
            validationId: body.validation_id,
            requestId: req.activityId,
        }));
    }

    const missing = missingFields(body, ["account_number", "ifsc", "name", "contact"]);
    if (missing.length) throw new ValidationError(`Missing fields: ${missing.join(", ")}`);

    const accountNumber = String(body.account_number).trim();
    const ifsc = String(body.ifsc).trim().toUpperCase();
    const name = String(body.name).trim();
    const contact = String(body.contact).replace(/[^0-9+]/g, "");
    const email = body.email ? String(body.email).trim() : "";

    if (!/^[A-Za-z0-9]{5,35}$/.test(accountNumber)) {
        throw new ValidationError("account_number must be 5-35 letters or digits");
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
        throw new ValidationError("ifsc must be a valid 11-character IFSC code");
    }
    if (name.length < 3 || name.length > 120) {
        throw new ValidationError("name must be between 3 and 120 characters");
    }
    if (!/^\+?[0-9]{10,15}$/.test(contact)) {
        throw new ValidationError("contact must be a valid phone number");
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ValidationError("email must be valid");
    }

    res.json(await bankService.verifyBankAccount({
        accountNumber,
        ifsc,
        name,
        contact,
        email,
        requestId: req.activityId,
    }));
}
