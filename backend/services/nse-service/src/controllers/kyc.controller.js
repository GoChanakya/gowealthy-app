import { ValidationError } from "../lib/http.js";
import * as kycService from "../services/kyc.service.js";

// SCREEN 2 - KYC CHECK
// Request  : { pan_no: "ABCDE1234F" }
// Response : { pan, name, status_date, entry_date, modification_date,
//              kyc_status: "S"|"F", kyc_status_remark, kra_name }
export async function kycCheck(req, res) {
    const { pan_no } = req.body;
    if (!pan_no) throw new ValidationError("pan_no is required");

    res.json(await kycService.kycCheck({ pan_no }));
}

// SCREEN 3 - FRESH EKYC REGISTRATION (only if KYC status = "F")
// Request  : { amcCode, panNo, mobileNo, invEmail }
// Response : { link, message }
export async function ekycRegister(req, res) {
    const { amcCode, panNo, mobileNo, invEmail } = req.body;

    const missing = [];
    if (!amcCode) missing.push("amcCode");
    if (!panNo) missing.push("panNo");
    if (!mobileNo) missing.push("mobileNo");
    if (!invEmail) missing.push("invEmail");
    if (missing.length) throw new ValidationError(`Missing fields: ${missing.join(", ")}`);

    res.json(await kycService.ekycRegister({ amcCode, panNo, mobileNo, invEmail }));
}
