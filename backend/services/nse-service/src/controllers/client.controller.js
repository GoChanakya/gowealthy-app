import { ValidationError, missingFields, requireNonEmptyArray } from "../lib/http.js";
import * as clientService from "../services/client.service.js";

// Minimum mandatory UCC fields for a single Indian retail investor (SINGLE holding).
const UCC_REQUIRED_FIELDS = [
    "client_code",
    "primary_holder_first_name",
    "tax_status",
    "primary_holder_dob_incorporation",
    "occupation_code",
    "holding_nature",
    "primary_holder_pan_exempt",
    "primary_holder_pan",
    "client_type",
    "account_type_1",
    "account_no_1",
    "ifsc_code_1",
    "default_bank_flag_1",
    "div_pay_mode",
    "address_1",
    "city",
    "state",
    "pincode",
    "country",
    "email",
    "communication_mode",
    "indian_mobile_no",
    "primary_holder_kyc_type",
    "paperless_flag",
    "mobile_declaration_flag",
    "email_declaration_flag",
    "nomination_opt",
    "nomination_authentication",
];

// Mandatory FATCA fields for a resident individual Indian investor.
const FATCA_REQUIRED_FIELDS = [
    "pan_rp", "inv_name", "tax_status", "data_src",
    "addr_type", "po_bir_inc", "co_bir_inc",
    "tax_res1", "tpin1", "id1_type",
    "srce_wealt", "inc_slab", "pep_flag",
    "occ_code", "occ_type", "exch_name",
    "ubo_appl", "ubo_df", "sdf_flag",
];

// SCREEN 5+6 - UCC REGISTRATION (183-column API)
// Request : { reg_details: [ { ...183 fields... } ] }
// Response: { reg_details: [{ ..., reg_id, reg_status: "REG_SUCCESS"|"REG_FAILED", reg_remark }] }
export async function uccRegister(req, res) {
    const { reg_details } = req.body;
    requireNonEmptyArray(reg_details, "reg_details");

    const missing = missingFields(reg_details[0], UCC_REQUIRED_FIELDS, { allowZero: true });
    if (missing.length) {
        throw new ValidationError(`Missing mandatory fields in reg_details[0]: ${missing.join(", ")}`);
    }

    res.json(await clientService.uccRegister(reg_details));
}

// UCC MODIFICATION
export async function uccModify(req, res) {
    const { reg_details } = req.body;
    requireNonEmptyArray(reg_details, "reg_details");
    if (!reg_details[0].client_code) throw new ValidationError("client_code is required");

    res.json(await clientService.uccModify(reg_details));
}

// SCREEN 5 - FATCA UPLOAD (Individual investors only)
// Request : { reg_details: [ { ...fatca fields... } ] }
// Response: { reg_details: [{ ..., reg_id, reg_status: "REG_SUCCESS"|"REG_FAILED" }] }
export async function fatcaUpload(req, res) {
    const { reg_details } = req.body;
    requireNonEmptyArray(reg_details, "reg_details");

    const rec = reg_details[0];
    const missing = missingFields(rec, FATCA_REQUIRED_FIELDS, { allowZero: true });
    if (missing.length) {
        throw new ValidationError(`Missing mandatory FATCA fields: ${missing.join(", ")}`);
    }
    // log_name is mandatory when data is sourced electronically.
    if (rec.data_src === "E" && !rec.log_name) {
        throw new ValidationError("log_name is mandatory when data_src is 'E'");
    }

    res.json(await clientService.fatcaUpload(reg_details));
}

// CLIENT AUTH STATUS CHECK (poll after sending CL_ACT link)
// Request : { client_code }
// Response: { report_data: [ { auth_status, first_holder_auth_status, ... } ] }
export async function clientAuthStatus(req, res) {
    const { client_code } = req.body;
    if (!client_code) throw new ValidationError("client_code is required");

    res.json(await clientService.clientAuthStatus({ client_code, requestId: req.activityId }));
}
