// require("dotenv").config();

// const express = require("express");

// const { aesEncrypt } =
//     require("./utils/encryption");

// const { buildAuthHeader } =
//     require("./utils/auth");

// const nseClient =
//     require("./clients/nseClient");

// const app = express();

// app.use(express.json());

// // Lightweight CORS for mobile/web clients (no extra dependency)
// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader(
//         "Access-Control-Allow-Headers",
//         "Content-Type, Authorization"
//     );
//     res.setHeader(
//         "Access-Control-Allow-Methods",
//         "GET,POST,PUT,DELETE,OPTIONS"
//     );
//     if (req.method === "OPTIONS") return res.sendStatus(204);
//     next();
// });

// function getRequiredEnv(name) {
//     const v = process.env[name];
//     if (!v) throw new Error(`Missing env var: ${name}`);
//     return v;
// }

// function buildNseAuthHeader() {
//     const enc = aesEncrypt(
//         getRequiredEnv("NSE_API_SECRET"),
//         getRequiredEnv("NSE_MEMBER_API_KEY")
//     );
//     return buildAuthHeader(
//         getRequiredEnv("NSE_LOGIN_ID"),
//         enc.encryptedPassword
//     );
// }

// /**
//  * NSE UAT/PROD sits behind Akamai. Referer must match the same host as NSE_BASE_URL
//  * (see `nse/postman/nse-collection-pre-request.js`: Referer = url + '/').
//  * A production login Referer against the UAT host often returns edgesuite HTML errors.
//  */
// function nseReferer() {
//     const base =
//         process.env.NSE_BASE_URL ||
//         "https://nseinvestuat.nseindia.com";
//     if (process.env.NSE_REFERER) {
//         return process.env.NSE_REFERER;
//     }
//     return `${new URL(base).origin}/`;
// }

// function buildNseHeaders() {
//     const referer = nseReferer();
//     const ua =
//         process.env.NSE_USER_AGENT ||
//         "PostmanRuntime/7.51.1";

//     const headers = {
//         Authorization: buildNseAuthHeader(),
//         memberId: getRequiredEnv("NSE_MEMBER_CODE"),
//         "Content-Type": "application/json; charset=utf-8",
//         "User-Agent": ua,
//         Accept: "*/*",
//         "Accept-Encoding": "gzip, deflate, br",
//         "Accept-Language": "en-US",
//         Connection: "keep-alive",
//         Referer: referer
//     };
//     if (process.env.NSE_ORIGIN) {
//         headers.Origin = process.env.NSE_ORIGIN;
//     }
//     return headers;
// }

// app.get("/", (req, res) => {

//     res.send(
//         "NSE Node working"
//     );

// });

// app.get("/api/nse/health", (req, res) => {
//     res.json({
//         ok: true,
//         service: "nse-service",
//         time: new Date().toISOString()
//     });
// });

// app.post("/api/nse/master-download", async (req, res) => {
//     try {
//         const file_type = req.body?.file_type || "SCH";
//         const response = await nseClient.post(
//             "/nsemfdesk/api/v2/reports/MASTER_DOWNLOAD",
//             { file_type },
//             { headers: buildNseHeaders() }
//         );
//         res.json(response.data);
//     } catch (err) {
//         res.status(500).json({
//             error: err.response?.data || err.message
//         });
//     }
// });

// // Example from `nse/_postman_summary.txt`
// app.post("/api/nse/kyc-check", async (req, res) => {
//     try {
//         const response = await nseClient.post(
//             "/nsemfdesk/api/v2/utility/KYC_CHECK",
//             req.body || {},
//             { headers: buildNseHeaders() }
//         );
//         res.json(response.data);
//     } catch (err) {
//         res.status(500).json({
//             error: err.response?.data || err.message
//         });
//     }
// });

// // Backwards-compatible proof route
// app.post("/test-master", async (req, res) => {
//     try {
//         const file_type = req.body?.file_type || "SCH";
//         const response = await nseClient.post(
//             "/nsemfdesk/api/v2/reports/MASTER_DOWNLOAD",
//             { file_type },
//             { headers: buildNseHeaders() }
//         );
//         res.json(response.data);
//     } catch (err) {
//         res.status(500).json({
//             error: err.response?.data || err.message
//         });
//     }
// });

// const port = Number(process.env.PORT || 3000);
// app.listen(port, () => {
//     console.log(`nse-service running on http://localhost:${port}`);
// });
require("dotenv").config();

const express = require("express");
const { aesEncrypt } = require("./utils/encryption");
const { buildAuthHeader } = require("./utils/auth");
const nseClient = require("./clients/nseClient");

const app = express();
app.use(express.json());

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getRequiredEnv(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

function buildNseAuthHeader() {
    const enc = aesEncrypt(
        getRequiredEnv("NSE_API_SECRET"),
        getRequiredEnv("NSE_MEMBER_API_KEY")
    );
    return buildAuthHeader(getRequiredEnv("NSE_LOGIN_ID"), enc.encryptedPassword);
}

function nseReferer() {
    const base = process.env.NSE_BASE_URL || "https://nseinvestuat.nseindia.com";
    return process.env.NSE_REFERER || `${new URL(base).origin}/`;
}

function buildNseHeaders() {
    const headers = {
        Authorization: buildNseAuthHeader(),
        memberId: getRequiredEnv("NSE_MEMBER_CODE"),
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": process.env.NSE_USER_AGENT || "PostmanRuntime/7.51.1",
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US",
        Connection: "keep-alive",
        Referer: nseReferer(),
    };
    if (process.env.NSE_ORIGIN) headers.Origin = process.env.NSE_ORIGIN;
    return headers;
}

// Shared NSE error handler — logs + returns clean JSON to the frontend
function handleNseError(err, res, routeName) {
    console.error(`❌ [${routeName}]`, err.response?.data || err.message);
    const status = err.response?.status || 500;
    res.status(status).json({
        success: false,
        route: routeName,
        error: err.response?.data || err.message,
    });
}

// ─── HEALTH ──────────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("NSE Node working"));

app.get("/api/nse/health", (req, res) =>
    res.json({ ok: true, service: "nse-service", time: new Date().toISOString() })
);

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 2 — KYC CHECK
// Doc: /nsemfdesk/api/v2/utility/KYC_CHECK
//
// Request  : { pan_no: "ABCDE1234F" }
// Response : { pan, name, status_date, entry_date, modification_date,
//              kyc_status: "S"|"F", kyc_status_remark, kra_name }
//
// kyc_status "S" → KYC found  → route to Screen 4
// kyc_status "F" → KYC absent → route to Screen 3 (fresh EKYC)
// ═══════════════════════════════════════════════════════════════════════════════
app.post("/api/nse/kyc-check", async (req, res) => {
    const { pan_no } = req.body;
    if (!pan_no) return res.status(400).json({ success: false, error: "pan_no is required" });

    try {
        console.log(`🔍 [kyc-check] PAN: ${pan_no}`);
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/utility/KYC_CHECK",
            { pan_no },
            { headers: buildNseHeaders() }
        );
        console.log(`✅ [kyc-check] status: ${response.data?.kyc_status}`);
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "kyc-check");
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 3 — FRESH EKYC REGISTRATION (only if KYC status = "F")
// Doc: /nsemfdesk/api/v1/EKYC/EKYCREG
//
// Request  : { amcCode, panNo, mobileNo, invEmail }
// Response : { link: "https://nseinvestuat...", message: "EKYC FRESH REGISTRATION REQUEST RECEVIED" }
//
// After success: store the returned `link` in Firestore aadhaar_data.ekyc_link
// User opens the link → completes eKYC on NSE page → comes back to Screen 4
// ═══════════════════════════════════════════════════════════════════════════════
app.post("/api/nse/ekyc-register", async (req, res) => {
    const { amcCode, panNo, mobileNo, invEmail } = req.body;

    const missing = [];
    if (!amcCode) missing.push("amcCode");
    if (!panNo) missing.push("panNo");
    if (!mobileNo) missing.push("mobileNo");
    if (!invEmail) missing.push("invEmail");
    if (missing.length) {
        return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
    }

    try {
        console.log(`📝 [ekyc-register] PAN: ${panNo}, Mobile: ${mobileNo}`);
        const response = await nseClient.post(
            "/nsemfdesk/api/v1/EKYC/EKYCREG",
            { amcCode, panNo, mobileNo, invEmail },
            { headers: buildNseHeaders() }
        );
        console.log(`✅ [ekyc-register] message: ${response.data?.message}`);
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "ekyc-register");
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 5+6 — UCC REGISTRATION (183-column API)
// Doc: /nsemfdesk/api/v2/registration/CLIENTCOMMON183
//
// Request: { reg_details: [ { ...183 fields... } ] }
//
// KEY MANDATORY FIELDS for a single Indian retail investor (SINGLE holding):
//   client_code                      ← UCC from Firestore (e.g. "HAGO8705")
//   primary_holder_first_name        ← from PAN OCR
//   primary_holder_last_name         ← from PAN OCR (optional but send if available)
//   tax_status                       ← "INDIVIDUAL"
//   gender                           ← "M" / "F" / "O" — collected in Screen 5
//   primary_holder_dob_incorporation ← DD/MM/YYYY from Aadhaar OCR
//   occupation_code                  ← "BUSINESS" / "SERVICE" etc — Screen 5
//   holding_nature                   ← "SI" (single) / "JO" (joint)
//   primary_holder_pan_exempt        ← "N" (we have PAN)
//   primary_holder_pan               ← from PAN OCR
//   client_type                      ← "P" (Physical / non-demat)
//   account_type_1                   ← "SB" (savings bank) — from Screen 6
//   account_no_1                     ← bank account number — Screen 6
//   ifsc_code_1                      ← IFSC — Screen 6
//   default_bank_flag_1              ← "Y"
//   div_pay_mode                     ← "03" (ECS/NEFT)
//   address_1 / city / state / pincode / country ← from Aadhaar OCR
//   email                            ← verified in Screen 4
//   communication_mode               ← "E" (Electronic)
//   indian_mobile_no                 ← phone from AsyncStorage (10 digits, no +91)
//   primary_holder_kyc_type          ← "K" (KRA compliant) if kyc_status=S, "E" (Aadhaar eKYC) if fresh
//   aadhaar_updated                  ← "Y"
//   paperless_flag                   ← "Z" (Paperless)
//   mobile_declaration_flag          ← "Self"
//   email_declaration_flag           ← "Self"
//   nomination_opt                   ← "N" (no nomination for now)
//   nomination_authentication        ← "V" (video — required when nomination_opt = N)
//
// Response: { reg_details: [{ ...all_fields..., reg_id, reg_status: "REG_SUCCESS"|"REG_FAILED", reg_remark }] }
// On SUCCESS: store reg_id in Firestore as ucc_reg_id, set ucc_registered: true
// Then call GET_LINK with productType="CL_ACT", productRefId=client_code for investor auth email
// ═══════════════════════════════════════════════════════════════════════════════
app.post("/api/nse/ucc-register", async (req, res) => {
    const { reg_details } = req.body;

    if (!reg_details || !Array.isArray(reg_details) || reg_details.length === 0) {
        return res.status(400).json({ success: false, error: "reg_details array is required" });
    }

    // Validate the minimum mandatory fields on the first record
    const rec = reg_details[0];
    const requiredFields = [
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

    const missing = requiredFields.filter((f) => !rec[f] && rec[f] !== "0");
    if (missing.length) {
        return res.status(400).json({
            success: false,
            error: `Missing mandatory fields in reg_details[0]: ${missing.join(", ")}`,
        });
    }

    try {
        console.log(`📝 [ucc-register] UCC: ${rec.client_code}, PAN: ${rec.primary_holder_pan}`);
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/registration/CLIENTCOMMON183",
            { reg_details },
            { headers: buildNseHeaders() }
        );
        const result = response.data?.reg_details?.[0];
        console.log(`✅ [ucc-register] status: ${result?.reg_status}, id: ${result?.reg_id}`);
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "ucc-register");
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 5 — FATCA UPLOAD (Individual investors only)
// Doc: /nsemfdesk/api/v2/registration/FATCA
//
// Request: { reg_details: [ { ...fatca fields... } ] }
//
// KEY MANDATORY FIELDS for a resident individual Indian investor:
//   pan_rp        ← PAN number (from Firestore pan_data.pan_number)
//   inv_name      ← Investor full name
//   dob           ← DD/MM/YYYY
//   tax_status    ← "01" (Individual)
//   data_src      ← "E" (Electronic) if we have digital data, "P" if paper
//   addr_type     ← "1" (Residential or Business)
//   po_bir_inc    ← City of birth — collected in Screen 5
//   co_bir_inc    ← "IN" (Country of birth — India)
//   tax_res1      ← "IN" (Tax residency country — India)
//   tpin1         ← PAN number (for Indian residents, PAN = Tax ID)
//   id1_type      ← "C" (PAN card)
//   srce_wealt    ← Source of wealth code — collected in Screen 5
//                   "01"=Salary "02"=Business "03"=Gift "04"=Ancestral property
//                   "05"=Rental income "06"=Prize money "07"=Royalty "08"=Others
//   inc_slab      ← Income range code — collected in Screen 5
//                   "31"=< 1 Lac "32"=1-5 Lacs "33"=5-10 Lacs "34"=10-25 Lacs
//                   "35"=>25 Lacs-1Cr "36"=>1Cr
//   pep_flag      ← "N" (not politically exposed — default for retail)
//   occ_code      ← Occupation code — collected in Screen 5
//                   "01"=Pvt Sector "02"=Pub Sector "03"=Business "04"=Professional
//                   "05"=Agriculture "06"=Retired "07"=Housewife "08"=Student "99"=Others
//   occ_type      ← "S"=Service / "B"=Business / "O"=Others
//   exch_name     ← "O" (Others — always for retail)
//   ubo_appl      ← "N" (no UBO for individual)
//   ubo_df        ← "N"
//   sdf_flag      ← "Y"
//   log_name      ← Investor full name (required when data_src = "E")
//
// Response: { reg_details: [{ ..., reg_id, reg_status: "REG_SUCCESS"|"REG_FAILED" }] }
// ═══════════════════════════════════════════════════════════════════════════════
app.post("/api/nse/fatca-upload", async (req, res) => {
    const { reg_details } = req.body;

    if (!reg_details || !Array.isArray(reg_details) || reg_details.length === 0) {
        return res.status(400).json({ success: false, error: "reg_details array is required" });
    }

    const rec = reg_details[0];
    const requiredFields = [
        "pan_rp", "inv_name", "tax_status", "data_src",
        "addr_type", "po_bir_inc", "co_bir_inc",
        "tax_res1", "tpin1", "id1_type",
        "srce_wealt", "inc_slab", "pep_flag",
        "occ_code", "occ_type", "exch_name",
        "ubo_appl", "ubo_df", "sdf_flag",
    ];

    const missing = requiredFields.filter((f) => !rec[f] && rec[f] !== "0");
    if (missing.length) {
        return res.status(400).json({
            success: false,
            error: `Missing mandatory FATCA fields: ${missing.join(", ")}`,
        });
    }

    // Enforce log_name when data_src is "E"
    if (rec.data_src === "E" && !rec.log_name) {
        return res.status(400).json({
            success: false,
            error: "log_name is mandatory when data_src is 'E'",
        });
    }

    try {
        console.log(`📝 [fatca-upload] PAN: ${rec.pan_rp}, Name: ${rec.inv_name}`);
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/registration/FATCA",
            { reg_details },
            { headers: buildNseHeaders() }
        );
        const result = response.data?.reg_details?.[0];
        console.log(`✅ [fatca-upload] status: ${result?.reg_status}, id: ${result?.reg_id}`);
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "fatca-upload");
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 6 — BANK ACCOUNT ADD/DELETE
// Doc: /nsemfdesk/api/v2/registration/CLIENTBANKDTL
//
// Request: { bank_dtl: [ { client_code, action_type, account_type, account_no,
//                           micr_no, ifsc_code, default_bank_flag } ] }
//
// KEY FIELDS:
//   client_code      ← UCC from Firestore
//   action_type      ← "ADD" (always for onboarding)
//   account_type     ← "SB" (savings) / "CB" (current) / "NE" / "NO"
//   account_no       ← bank account number — collected in Screen 6
//   micr_no          ← optional
//   ifsc_code        ← 11-char IFSC — collected in Screen 6
//   default_bank_flag← "Y" (making it default)
//
// Response: { bank_dtl: [{ ...fields, status: "SUCCESS"|"FAIL", error_remark }] }
//
// NOTE: For UAT, skip real penny drop — just use a known valid test account.
//       For PROD, do penny drop via Razorpay/Cashfree BEFORE calling this API.
// ═══════════════════════════════════════════════════════════════════════════════
app.post("/api/nse/bank-add", async (req, res) => {
    const { bank_dtl } = req.body;

    if (!bank_dtl || !Array.isArray(bank_dtl) || bank_dtl.length === 0) {
        return res.status(400).json({ success: false, error: "bank_dtl array is required" });
    }

    const rec = bank_dtl[0];
    const requiredFields = ["client_code", "action_type", "account_type", "account_no", "ifsc_code", "default_bank_flag"];
    const missing = requiredFields.filter((f) => !rec[f]);
    if (missing.length) {
        return res.status(400).json({
            success: false,
            error: `Missing bank fields: ${missing.join(", ")}`,
        });
    }

    try {
        console.log(`🏦 [bank-add] UCC: ${rec.client_code}, Acc: ${rec.account_no}, IFSC: ${rec.ifsc_code}`);
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/registration/CLIENTBANKDTL",
            { bank_dtl },
            { headers: buildNseHeaders() }
        );
        const result = response.data?.bank_dtl?.[0];
        console.log(`✅ [bank-add] status: ${result?.status}`);
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "bank-add");
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 5 (POST UCC REG) — GET SHORT LINK
// Doc: /nsemfdesk/api/v2/reports/GET_LINK
//
// Request: { productType, productRefId }
//
// ONBOARDING USE CASES:
//   productType="CL_ACT",      productRefId=<client_code>  → UCC auth link (send after UCC reg)
//   productType="MANDATE_AUTH", productRefId=<mandate_id>  → Mandate auth link (after mandate reg)
//
// TRADING USE CASES (for later):
//   productType="PUR",         productRefId=<order_id>     → Purchase payment link
//   productType="SIP_REG",     productRefId=<sip_reg_id>   → SIP auth link
//   productType="XSIP_REG",    productRefId=<xsip_reg_id>  → XSIP auth link
//   productType="RED",         productRefId=<order_id>     → Redemption auth link
//
// Response: { productType, productRefId, firstHolderLink, secondHolderLink, thirdHolderLink, errorMessage }
// Store firstHolderLink in Firestore → show "Open to authorize" button in app
// ═══════════════════════════════════════════════════════════════════════════════
app.post("/api/nse/get-link", async (req, res) => {
    const { productType, productRefId } = req.body;

    if (!productType || !productRefId) {
        return res.status(400).json({ success: false, error: "productType and productRefId are required" });
    }

    const validProductTypes = [
        "PUR", "RED", "SWH_REG", "SIP_REG", "XSIP_REG", "XSIP_CAN",
        "STP_REG", "STP_CAN", "SWP_REG", "SWP_CAN",
        "CL_ACT", "SIP_CAN", "MANDATE_AUTH", "SIP_TOPUP",
    ];

    if (!validProductTypes.includes(productType)) {
        return res.status(400).json({
            success: false,
            error: `Invalid productType. Must be one of: ${validProductTypes.join(", ")}`,
        });
    }

    try {
        console.log(`🔗 [get-link] type: ${productType}, refId: ${productRefId}`);
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/reports/GET_LINK",
            { productType, productRefId },
            { headers: buildNseHeaders() }
        );
        console.log(`✅ [get-link] link: ${response.data?.firstHolderLink}`);
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "get-link");
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// RESEND COMMUNICATION (Email / SMS re-trigger for auth links)
// Doc: /nsemfdesk/api/v2/registration/RESEND_COMM
//
// Request: { productType, productRefId }
// Response: { productType, productRefId, response_status: "S"|"F", error_remark }
//
// USE CASE: User didn't receive/open the auth email → tap "Resend" in app
// ═══════════════════════════════════════════════════════════════════════════════
app.post("/api/nse/resend-comm", async (req, res) => {
    const { productType, productRefId } = req.body;

    if (!productType || !productRefId) {
        return res.status(400).json({ success: false, error: "productType and productRefId are required" });
    }

    try {
        console.log(`📨 [resend-comm] type: ${productType}, refId: ${productRefId}`);
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/registration/RESEND_COMM",
            { productType, productRefId },
            { headers: buildNseHeaders() }
        );
        console.log(`✅ [resend-comm] status: ${response.data?.response_status}`);
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "resend-comm");
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// MANDATE REGISTRATION (needed before SIP orders with mandate payment)
// Doc: /nsemfdesk/api/v2/registration/product/MANDATE
//
// Request: { reg_data: [ { client_code, amount, mandate_type, account_no,
//                           ac_type, ifsc_code, micr_no, start_date, end_date } ] }
//
// KEY FIELDS:
//   client_code    ← UCC
//   amount         ← max debit amount (e.g. "100000" for ₹1 lakh per installment)
//   mandate_type   ← "E" (eNACH — digital, preferred) / "X" (Physical/Scan)
//   account_no     ← bank account number
//   ac_type        ← "SB" savings
//   ifsc_code      ← IFSC
//   start_date     ← DD/MM/YYYY (today or future)
//   end_date       ← DD/MM/YYYY (typically 30 years ahead e.g. 31/12/2099)
//
// Response: { reg_data: [{ ..., reg_id: "mandate_id", reg_status: "REG_SUCCESS" }] }
// After success: call GET_LINK with productType="MANDATE_AUTH", productRefId=reg_id
// NOTE: For UAT only — mandate registration is part of trading flow, not onboarding.
//       Building here now so it's ready.
// ═══════════════════════════════════════════════════════════════════════════════
app.post("/api/nse/mandate-register", async (req, res) => {
    const { reg_data } = req.body;

    if (!reg_data || !Array.isArray(reg_data) || reg_data.length === 0) {
        return res.status(400).json({ success: false, error: "reg_data array is required" });
    }

    const rec = reg_data[0];
    const requiredFields = ["client_code", "amount", "mandate_type", "account_no", "ac_type", "ifsc_code", "start_date", "end_date"];
    const missing = requiredFields.filter((f) => !rec[f]);
    if (missing.length) {
        return res.status(400).json({
            success: false,
            error: `Missing mandate fields: ${missing.join(", ")}`,
        });
    }

    try {
        console.log(`💳 [mandate-register] UCC: ${rec.client_code}, Amount: ${rec.amount}`);
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/registration/product/MANDATE",
            { reg_data },
            { headers: buildNseHeaders() }
        );
        const result = response.data?.reg_data?.[0];
        console.log(`✅ [mandate-register] status: ${result?.reg_status}, id: ${result?.reg_id}`);
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "mandate-register");
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT AUTH STATUS CHECK  (Poll after sending CL_ACT link)
// Doc: /nsemfdesk/api/v2/reports/CLIENT_AUTH_REPORT
//
// Request:  { client_code }
// Response: { report_data: [ { auth_status, first_holder_auth_status,
//              first_holder_auth_datetime, first_holder_fatca_exists,
//              first_holder_aof_exists, ... } ] }
//
// Poll this every 30s after UCC reg link is sent to check if investor
// has authorized → when auth_status="SUCCESS" → mark ucc_authorized=true in Firestore
// ═══════════════════════════════════════════════════════════════════════════════
app.post("/api/nse/client-auth-status", async (req, res) => {
    const { client_code } = req.body;
    if (!client_code) {
        return res.status(400).json({ success: false, error: "client_code is required" });
    }

    try {
        console.log(`📊 [client-auth-status] UCC: ${client_code}`);

        // Build date range — from 7 days ago to today
        const today = new Date();
        const from  = new Date(today);
        from.setDate(from.getDate() - 7);
        const fmt = (d) =>
            `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;

        const response = await nseClient.post(
            "/nsemfdesk/api/v2/reports/client_authorization",  // ← correct URL
            {
                from_date:   fmt(from),
                to_date:     fmt(today),
                client_code: client_code,
                date_type:   "AUTH_SENT_DATE",
            },
            { headers: buildNseHeaders() }
        );
        console.log(`✅ [client-auth-status]:`, JSON.stringify(response.data));
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "client-auth-status");
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXISTING ROUTES (unchanged)
// ═══════════════════════════════════════════════════════════════════════════════
app.post("/api/nse/master-download", async (req, res) => {
    try {
        const file_type = req.body?.file_type || "SCH";
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/reports/MASTER_DOWNLOAD",
            { file_type },
            { headers: buildNseHeaders() }
        );
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "master-download");
    }
});

app.post("/test-master", async (req, res) => {
    try {
        const file_type = req.body?.file_type || "SCH";
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/reports/MASTER_DOWNLOAD",
            { file_type },
            { headers: buildNseHeaders() }
        );
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "test-master");
    }
});

// ─── START ───────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    console.log(`\n🚀 nse-service running on http://localhost:${port}`);
    console.log(`\nRoutes registered:`);
    console.log(`  GET  /api/nse/health`);
    console.log(`  POST /api/nse/kyc-check          → KYC_CHECK (Screen 2)`);
    console.log(`  POST /api/nse/ekyc-register      → EKYCREG (Screen 3)`);
    console.log(`  POST /api/nse/ucc-register       → CLIENTCOMMON183 (Screen 5+6)`);
    console.log(`  POST /api/nse/fatca-upload        → FATCA (Screen 5)`);
    console.log(`  POST /api/nse/bank-add            → CLIENTBANKDTL (Screen 6)`);
    console.log(`  POST /api/nse/get-link            → GET_LINK (Screen 5 post-UCC)`);
    console.log(`  POST /api/nse/resend-comm         → RESEND_COMM`);
    console.log(`  POST /api/nse/mandate-register    → MANDATE (trading prep)`);
    console.log(`  POST /api/nse/client-auth-status  → CLIENT_AUTH_REPORT (polling)`);
    console.log(`  POST /api/nse/master-download     → MASTER_DOWNLOAD\n`);
});