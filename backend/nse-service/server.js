
require("dotenv").config();

const express = require("express");
const { aesEncrypt } = require("./utils/encryption");
const { buildAuthHeader } = require("./utils/auth");
const morgan = require("morgan");
const nseClient = require("./clients/nseClient");

const app = express();
app.use(express.json());
app.use(morgan("dev"));

function logActivity(route, event, details = {}) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        event,
        ...details,
    }));
}

// Request-level activity log. Record body keys rather than values so sensitive
// PAN, bank-account, and credential values are not written to the console.
app.use((req, res, next) => {
    if (!req.path.startsWith("/api/nse")) return next();
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    req.activityId = requestId;
    logActivity(req.path, "request", {
        requestId,
        method: req.method,
        bodyKeys: Object.keys(req.body || {}),
    });
    res.on("finish", () => logActivity(req.path, "response", {
        requestId,
        method: req.method,
        statusCode: res.statusCode,
    }));
    next();
});
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
    const base = getRequiredEnv("NSE_BASE_URL");
    return process.env.NSE_REFERER || `${new URL(base).origin}/`;
}

// Which NSE environment this process is talking to. Derived from the host so it
// cannot drift out of sync with the URL that requests actually go to.
// Hosts per NSE MFSS spec v1.9.6, page 6.
function nseEnvironment() {
    const host = new URL(getRequiredEnv("NSE_BASE_URL")).hostname;
    if (host === "nseinvestuat.nseindia.com") return "UAT";
    if (host === "www.nseinvest.com" || host === "nseinvest.com") return "PRODUCTION";
    return `UNKNOWN (${host})`;
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
    logActivity(routeName, "nse_error", {
        httpStatus: err.response?.status || 500,
        error: err.response?.data || err.message,
    });
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
    res.json({
        ok: true,
        service: "nse-service",
        environment: nseEnvironment(),
        nseBaseUrl: process.env.NSE_BASE_URL,
        time: new Date().toISOString(),
    })
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
        console.log(`   invEmail (raw): ${JSON.stringify(invEmail)}, length: ${invEmail.length}`);
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
// NOTE: NSE verifies the account itself. After ADD the bank sits at status
//       PENDING; back it with /api/nse/cancel-cheque-upload + /api/nse/bank-elog
//       and poll /api/nse/bank-status until it reads ACTIVE. No third-party
//       penny drop is involved.
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

// ORDER ENTRY (PURCHASE / REDEMPTION)
// NSE endpoint: /nsemfdesk/api/v2/transaction/NORMAL
app.post("/api/nse/order-entry", async (req, res) => {
    const { transaction_details } = req.body || {};
    if (!Array.isArray(transaction_details) || transaction_details.length === 0) {
        return res.status(400).json({ success: false, error: "transaction_details array is required" });
    }
    if (transaction_details.length > 50) {
        return res.status(400).json({ success: false, error: "A maximum of 50 transactions is allowed" });
    }

    const requiredCommon = [
        "scheme_code", "trxn_type", "client_code", "demat_physical", "kyc_flag",
        "euin_declaration", "min_redemption_flag", "dpc_flag", "all_units",
    ];
    const errors = [];
    transaction_details.forEach((record, index) => {
        const missing = requiredCommon.filter((field) => !record?.[field] && record?.[field] !== "0");
        if (!["P", "R"].includes(record?.trxn_type)) missing.push("trxn_type (P or R)");
        if (record?.trxn_type === "P") {
            if (!record.buy_sell_type) missing.push("buy_sell_type");
            if (!record.order_amount) missing.push("order_amount");
        }
        if (record?.trxn_type === "R" && !record.order_amount && !record.redemption_units && record.all_units !== "Y") {
            missing.push("order_amount or redemption_units");
        }
        if (missing.length) errors.push(`transaction_details[${index}]: ${missing.join(", ")}`);
    });
    if (errors.length) return res.status(400).json({ success: false, error: errors.join("; ") });

    try {
        logActivity("order-entry", "nse_request_start", {
            requestId: req.activityId,
            orderCount: transaction_details.length,
            transactionType: transaction_details[0]?.trxn_type,
            clientCodes: [...new Set(transaction_details.map((record) => record.client_code))],
            schemeCodes: [...new Set(transaction_details.map((record) => record.scheme_code))],
            amount: transaction_details.reduce((sum, record) => sum + Number(record.order_amount || 0), 0),
        });
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/transaction/NORMAL",
            { transaction_details },
            { headers: buildNseHeaders() }
        );
        const result = response.data?.transaction_details?.[0];
        logActivity("order-entry", "nse_response", {
            requestId: req.activityId,
            httpStatus: response.status,
            transactionStatus: result?.trxn_status,
            transactionOrderId: result?.trxn_order_id,
            remark: result?.trxn_remark,
        });
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "order-entry");
    }
});

// PURCHASE ORDER PAYMENT
// NSE endpoint: /nsemfdesk/api/v2/payments/purchase_payment
// This pays existing NSE purchase/X-SIP order IDs; it does not create orders.
app.post("/api/nse/purchase-payment", async (req, res) => {
    const {
        payment_mode,
        client_code,
        order_ids,
        mandate_id,
        bank_account_no,
        ifsc,
        cheque_no,
        cheque_date,
        vpa,
        neft_rtgs_utr_no,
        callback_url,
    } = req.body || {};

    const mode = String(payment_mode || "").trim().toUpperCase();
    const orderList = String(order_ids || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    const allowedModes = ["MANDATE", "CHEQUE", "UPI", "NETBANKING", "NEFT", "RTGS", "RTGS/NEFT"];

    if (!allowedModes.includes(mode)) {
        return res.status(400).json({
            success: false,
            error: `Invalid payment_mode. Must be one of: ${allowedModes.join(", ")}`,
        });
    }
    if (!client_code || orderList.length === 0) {
        return res.status(400).json({ success: false, error: "client_code and order_ids are required" });
    }
    if (orderList.length > 50) {
        return res.status(400).json({ success: false, error: "A maximum of 50 order_ids is allowed" });
    }
    if (mode === "MANDATE" && !mandate_id) {
        return res.status(400).json({ success: false, error: "mandate_id is required for MANDATE payment" });
    }
    if (["CHEQUE", "UPI", "NETBANKING"].includes(mode) && (!bank_account_no || !ifsc)) {
        return res.status(400).json({ success: false, error: `bank_account_no and ifsc are required for ${mode} payment` });
    }
    if (mode === "UPI" && !vpa) {
        return res.status(400).json({ success: false, error: "vpa is required for UPI payment" });
    }
    if (mode === "CHEQUE" && (!cheque_no || !cheque_date)) {
        return res.status(400).json({ success: false, error: "cheque_no and cheque_date are required for CHEQUE payment" });
    }
    if (["NEFT", "RTGS", "RTGS/NEFT"].includes(mode) && !neft_rtgs_utr_no) {
        return res.status(400).json({ success: false, error: "neft_rtgs_utr_no is required for NEFT/RTGS payment" });
    }
    if (["UPI", "NETBANKING"].includes(mode) && !callback_url) {
        return res.status(400).json({ success: false, error: `callback_url is required for ${mode} payment` });
    }

    const paymentPayload = {
        payment_mode: mode,
        client_code,
        order_ids: orderList.join(","),
        ...(mandate_id ? { mandate_id } : {}),
        ...(bank_account_no ? { bank_account_no } : {}),
        ...(ifsc ? { ifsc } : {}),
        ...(cheque_no ? { cheque_no } : {}),
        ...(cheque_date ? { cheque_date } : {}),
        ...(vpa ? { vpa } : {}),
        ...(neft_rtgs_utr_no ? { neft_rtgs_utr_no } : {}),
        ...(callback_url ? { callback_url } : {}),
    };

    try {
        logActivity("purchase-payment", "nse_request_start", {
            requestId: req.activityId,
            clientCode: client_code,
            paymentMode: mode,
            orderCount: orderList.length,
            accountLast4: bank_account_no ? String(bank_account_no).slice(-4) : undefined,
            hasMandate: Boolean(mandate_id),
            hasCallback: Boolean(callback_url),
        });
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/payments/purchase_payment",
            paymentPayload,
            { headers: buildNseHeaders() }
        );
        logActivity("purchase-payment", "nse_response", {
            requestId: req.activityId,
            httpStatus: response.status,
            paymentStatus: response.data?.status,
            orderAmount: response.data?.order_amount,
            basketId: response.data?.basket_id,
            hasShortUrl: Boolean(response.data?.short_url),
            remark: response.data?.remark,
        });
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "purchase-payment");
    }
});


function parseMasterDownload(rawText) {
    // Split into lines, drop empty ones (NSE files often end with trailing \n or a stray blank line)
    const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length < 2) return [];

    // Header row — split on "|", trim, drop trailing empty column (file ends with a "|")
    const headers = lines[0].split("|").map(h => h.trim()).filter(h => h.length > 0);

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

    // Map to the clean shape your app actually needs
    return rows.map(r => ({
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
        reopening_date: r["REOPENING DATE"]
    }));
}


// The scheme master is ~13.6k rows and takes about a second to fetch and parse.
// It changes once a day, so hold it in memory rather than re-pulling per request.
let schemeCache = { schemes: null, fetchedAt: 0 };
const SCHEME_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

async function getSchemeMaster({ force = false } = {}) {
    const fresh = schemeCache.schemes && (Date.now() - schemeCache.fetchedAt) < SCHEME_CACHE_TTL_MS;
    if (fresh && !force) return schemeCache.schemes;

    const response = await nseClient.post(
        "/nsemfdesk/api/v2/reports/MASTER_DOWNLOAD",
        { file_type: "SCH" },
        { headers: buildNseHeaders() }
    );
    const rawText = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
    schemeCache = { schemes: parseMasterDownload(rawText), fetchedAt: Date.now() };
    console.log(`📚 [schemes] cached ${schemeCache.schemes.length} schemes from live master`);
    return schemeCache.schemes;
}

// SCHEME CATALOGUE — the live, tradeable fund list for the app.
//
// Only returns schemes this member can actually transact in: AMC active,
// purchase allowed, and (by default) SIP allowed. Everything the UI needs to
// show a fund and validate an amount comes from here, so no scheme data has to
// be hardcoded anywhere.
app.post("/api/nse/schemes", async (req, res) => {
    const {
        search, amc_code, sip_only = true, limit = 50, refresh = false,
        retail_only = true,
    } = req.body || {};

    try {
        const all = await getSchemeMaster({ force: Boolean(refresh) });
        const term = String(search || "").trim().toUpperCase();

        const tradeable = all.filter((s) => {
            if (s.amc_active_flag !== "Y") return false;
            if (s.purchase_allowed !== "Y") return false;
            if (sip_only && s.sip_allowed !== "Y") return false;
            // "L1" settlement classes are the institutional same-day variants:
            // ~2 lakh minimums, and they can't be redeemed or switched. Showing
            // them to a retail investor is just a rejected order waiting to
            // happen, and they duplicate every fund in the list.
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

        res.json({
            success: true,
            total_tradeable: tradeable.length,
            returned: schemes.length,
            cached_at: new Date(schemeCache.fetchedAt).toISOString(),
            schemes,
        });
    } catch (err) {
        handleNseError(err, res, "schemes");
    }
});

app.post("/api/nse/master-download", async (req, res) => {
    console.log("hit");
    try {
        const file_type = req.body?.file_type || "SCH";
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/reports/MASTER_DOWNLOAD",
            { file_type },
            { headers: buildNseHeaders() }
        );

        // response.data is the raw pipe-delimited text
        const rawText = typeof response.data === "string"
            ? response.data
            : JSON.stringify(response.data); // fallback safety net

        const schemes = parseMasterDownload(rawText);

        // await uploadToGCS(schemes);

        // The scheme master is the only authoritative list of AMCs actually
        // mapped to this member, so surface enough of it to pick codes from.
        // Note there are two AMC code systems in the NSE spec and they are NOT
        // interchangeable:
        //   - the long form here (e.g. AXISMUTUALFUND_MF) → SIP/XSIP amc_code
        //   - a short RTA form (e.g. AXF, MOF, ABSL)      → EKYCREG amcCode
        // `headers` is returned raw so you can see every column the live file
        // actually ships, including any short RTA code column.
        if (req.body?.inspect) {
            const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
            const headers = (lines[0] || "").split("|").map((h) => h.trim()).filter(Boolean);

            const byAmc = new Map();
            for (const s of schemes) {
                const code = (s.amc_code || "").trim();
                if (!code) continue;
                if (!byAmc.has(code)) {
                    byAmc.set(code, { amc_code: code, scheme_count: 0, sample_scheme: s.scheme_name });
                }
                byAmc.get(code).scheme_count += 1;
            }

            return res.json({
                success: true,
                count: schemes.length,
                headers,
                sample_row: lines[1] || null,
                amc_codes: [...byAmc.values()].sort((a, b) => b.scheme_count - a.scheme_count),
            });
        }

        res.json({
            success: true,
            count: schemes.length
        });
    } catch (err) {
        handleNseError(err, res, "master-download");
        console.log(err.response?.data || err.message);
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
        logActivity("mandate-register", "nse_request_start", {
            requestId: req.activityId,
            clientCode: rec.client_code,
            amount: rec.amount,
            mandateType: rec.mandate_type,
            accountLast4: String(rec.account_no).slice(-4),
            ifsc: rec.ifsc_code,
        });
        console.log(`💳 [mandate-register] UCC: ${rec.client_code}, Amount: ${rec.amount}`);
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/registration/product/MANDATE",
            { reg_data },
            { headers: buildNseHeaders() }
        );
        const result = response.data?.reg_data?.[0];
        logActivity("mandate-register", "nse_response", {
            requestId: req.activityId,
            httpStatus: response.status,
            regStatus: result?.reg_status,
            regId: result?.reg_id,
            remark: result?.reg_remark,
        });
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
        const authRow = response.data?.report_data?.[0];
        logActivity("client-auth-status", "nse_response", {
            requestId: req.activityId,
            httpStatus: response.status,
            clientCode: client_code,
            authStatus: authRow?.auth_status,
            firstHolderAuthStatus: authRow?.first_holder_auth_status,
        });
        console.log(`✅ [client-auth-status]:`, JSON.stringify(response.data));
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "client-auth-status");
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SIP REGISTRATION — verified from NSE doc pages 25-29
// URL: /nsemfdesk/api/v2/registration/product/SIP
//
// KEY MANDATORY FIELDS (Physical/non-demat retail investor):
//   amc_code          ← AMC code from scheme master e.g. "PPFASMUTUALFUND_MF"
//   sch_code          ← Scheme code e.g. "PPFCF-GR"
//   client_code       ← UCC
//   trans_mode        ← "P" (Physical)
//   dp_txn_mode       ← "P" (Physical)
//   start_date        ← DD/MM/YYYY — must be valid SIP date for the scheme
//   frequency_type    ← "MONTHLY" / "QUARTERLY" / "WEEKLY" / "DAILY"
//   frequency_allowed ← "1" (Rolling — always 1)
//   installment_amount← monthly SIP amount as decimal
//   status            ← "1" (Active)
//   member_code       ← NSE member code (from env NSE_MEMBER_CODE)
//   installment_no    ← number of installments (e.g. 36 for 3 years)
//   sip_mandate_id    ← approved mandate ID from mandate-register
//   euin_declaration  ← "N" (no EUIN for direct plans)
//   dpc_flag          ← "Y"
//   first_order_today ← "N" / "Y"
//
// Response: { reg_data: [{ reg_id, reg_status: "REG_SUCCESS"|"REG_FAILED", reg_remark }] }
// After success: call GET_LINK with productType="SIP_REG", productRefId=reg_id
// ═══════════════════════════════════════════════════════════════════════════════
app.post("/api/nse/sip-register", async (req, res) => {
    const { reg_data } = req.body;
    if (!reg_data || !Array.isArray(reg_data) || reg_data.length === 0) {
        return res.status(400).json({ success: false, error: "reg_data array is required" });
    }
    // Keep the NSE member code server-side. The mobile app should not need to
    // know or transmit this credential-level integration value.
    const rec = {
        ...reg_data[0],
        member_code: reg_data[0].member_code || process.env.NSE_MEMBER_CODE,
    };
    const required = [
        "amc_code", "sch_code", "client_code", "trans_mode", "dp_txn_mode",
        "start_date", "frequency_type", "frequency_allowed",
        "installment_amount", "status", "member_code",
        "euin_declaration", "dpc_flag", "first_order_today",
    ];
    const missing = required.filter(f => !rec[f] && rec[f] !== "0");
    if (missing.length) {
        return res.status(400).json({ success: false, error: `Missing SIP fields: ${missing.join(", ")}` });
    }
    try {
        console.log(`📋 [sip-register] UCC: ${rec.client_code}, Scheme: ${rec.sch_code}, Amount: ${rec.installment_amount}`);
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/registration/product/SIP",
            { reg_data: [rec] },
            { headers: buildNseHeaders() }
        );
        const result = response.data?.reg_data?.[0];
        // NSE returns HTTP 200 even when the registration is rejected, and the
        // only explanation lives in reg_remark. Without logging it a REG_FAILED
        // is invisible and undiagnosable.
        logActivity("sip-register", "nse_response", {
            requestId: req.activityId,
            httpStatus: response.status,
            regStatus: result?.reg_status,
            regId: result?.reg_id,
            remark: result?.reg_remark,
            schemeCode: rec.sch_code,
            startDate: rec.start_date,
            installmentNo: rec.installment_no,
            mandateId: rec.sip_mandate_id,
        });
        if (result?.reg_status === "REG_FAILED") {
            console.error(`❌ [sip-register] REG_FAILED — ${result?.reg_remark || "(no remark returned)"}`);
        } else {
            console.log(`✅ [sip-register] status: ${result?.reg_status}, id: ${result?.reg_id}`);
        }
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "sip-register");
    }
});


// SIP CANCELLATION — stops all future installments on a registered SIP.
// Doc: /nsemfdesk/api/v2/cancellation/SIP_CAN (spec p.62)
//
// remarks is mandatory and must be a two-digit reason code, or "13:(free text)".
//   01 No funds        02 Scheme not performing   03 Service issue
//   04 Load revised    05 Investing elsewhere     06 Fund manager change
//   07 Goal achieved   08 Market volatility       09 Restarting later
//   10 Bank/mandate change   11 Investing elsewhere   12 Wrong time
//   13 Others (specify)
//
// NOTE: there is no mandate cancellation API in the spec — a mandate can only be
// left unused. Cancelling the SIP is what actually stops money moving.
app.post("/api/nse/sip-cancel", async (req, res) => {
    const { client_code, sip_reg_no, remarks } = req.body || {};
    if (!client_code || !sip_reg_no) {
        return res.status(400).json({ success: false, error: "client_code and sip_reg_no are required" });
    }

    // Default to "13:(...)" — a bare free-text remark is rejected by NSE.
    const reason = remarks && /^(\d{2})(:|$)/.test(String(remarks).trim())
        ? String(remarks).trim()
        : `13:(${remarks || "Cancelled by investor"})`;

    try {
        logActivity("sip-cancel", "nse_request_start", {
            requestId: req.activityId,
            clientCode: client_code,
            sipRegNo: sip_reg_no,
            reason,
        });
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/cancellation/SIP_CAN",
            { can_data: [{ client_code, sip_reg_no: String(sip_reg_no), remarks: reason }] },
            { headers: buildNseHeaders() }
        );

        // Spec's sample response nests this under reg_data, not can_data.
        const result = response.data?.reg_data?.[0] || response.data?.can_data?.[0];
        logActivity("sip-cancel", "nse_response", {
            requestId: req.activityId,
            httpStatus: response.status,
            canStatus: result?.can_status,
            remark: result?.can_remark,
        });
        if (result?.can_status === "CAN_FAILED") {
            console.error(`❌ [sip-cancel] CAN_FAILED — ${result?.can_remark || "(no remark)"}`);
        } else {
            console.log(`✅ [sip-cancel] ${result?.can_status} for SIP ${sip_reg_no}`);
        }
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "sip-cancel");
    }
});

// MANDATE STATUS — has the investor approved the eNACH yet, and what's its UMRN?
// Doc: /nsemfdesk/api/v2/reports/MANDATE_STATUS (spec p.84)
// Approval is what turns a registered mandate into one SIP installments can debit.
app.post("/api/nse/mandate-status", async (req, res) => {
    const { mandate_id, client_code } = req.body || {};
    if (!mandate_id && !client_code) {
        return res.status(400).json({ success: false, error: "mandate_id or client_code is required" });
    }

    try {
        // Per spec, from/to dates are only needed when neither id is supplied.
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/reports/MANDATE_STATUS",
            {
                ...(mandate_id ? { mandate_id: String(mandate_id) } : {}),
                ...(client_code ? { client_code } : {}),
            },
            { headers: buildNseHeaders() }
        );

        const rows = response.data?.report_data || [];
        const mandates = rows.map((r) => ({
            mandate_id: r.mandateId,
            client_code: r.clientCode,
            status: r.status,                 // APPROVED / PENDING / REJECTED
            umrn: r.umrnNo,                   // needed to attach the mandate to a SIP
            amount: r.amount,
            bank_name: r.bankName,
            account_no: r.bankAccountNumber,
            registration_date: r.registrationDate,
            approved_date: r.approvedDate,
            start_date: r.startDate,
            end_date: r.endDate,
            remarks: r.remarks,
        }));

        logActivity("mandate-status", "nse_response", {
            requestId: req.activityId,
            httpStatus: response.status,
            count: mandates.length,
            statuses: mandates.map((m) => m.status),
        });

        res.json({
            success: response.data?.response_status === "S",
            mandates,
            error_remark: response.data?.error_remark,
        });
    } catch (err) {
        handleNseError(err, res, "mandate-status");
    }
});

// SIP ↔ MANDATE MAPPING — attach an approved mandate to an already-registered SIP.
// Doc: /nsemfdesk/api/v2/registration/SIPUMRN (spec p.77)
//
// This is what makes "register the SIP now, sort the mandate out later" work:
// the SIP is created with no mandate, the investor pays installment 1 by UPI,
// and once the eNACH is APPROVED its UMRN is mapped here so installment 2
// onwards can auto-debit.
app.post("/api/nse/sip-umrn", async (req, res) => {
    const { sip_reg_id, umrn, remark } = req.body || {};
    if (!sip_reg_id || !umrn) {
        return res.status(400).json({ success: false, error: "sip_reg_id and umrn are required" });
    }

    try {
        logActivity("sip-umrn", "nse_request_start", {
            requestId: req.activityId,
            sipRegId: sip_reg_id,
        });
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/registration/SIPUMRN",
            { sip_reg_id: Number(sip_reg_id), umrn, remark: remark || "" },
            { headers: buildNseHeaders() }
        );
        // status 100 = success, 101 = failure
        logActivity("sip-umrn", "nse_response", {
            requestId: req.activityId,
            httpStatus: response.status,
            status: response.data?.status,
            message: response.data?.message,
        });
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "sip-umrn");
    }
});

app.post("/api/nse/ucc-modify", async (req, res) => {
    const { reg_details } = req.body;
    if (!reg_details || !Array.isArray(reg_details) || reg_details.length === 0) {
        return res.status(400).json({ success: false, error: "reg_details array is required" });
    }
    const rec = reg_details[0];
    if (!rec.client_code) {
        return res.status(400).json({ success: false, error: "client_code is required" });
    }
    try {
        console.log(`✏️ [ucc-modify] UCC: ${rec.client_code}`);
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/registration/CLIENTMODIFICATION",
            { reg_details },
            { headers: buildNseHeaders() }
        );
        const result = response.data?.reg_details?.[0];
        console.log(`✅ [ucc-modify] status: ${result?.reg_status}, remark: ${result?.reg_remark}`);
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "ucc-modify");
    }
});
// ═══════════════════════════════════════════════════════════════════════════════
// BANK VERIFICATION — done by NSE, not a third-party penny drop.
//
// For a Physical (non-demat) client the bank added via CLIENTBANKDTL starts at
// status PENDING. NSE/the RTA verify it, and the outcome shows up as
// bank<N>_status / bank<N>_status_remarks in the Client Master report.
//
// Two supporting uploads back that verification (spec v1.9.6 pp. 117-118):
//   CANCELCHEQUE — cancelled-cheque image for the account
//   ELOGBANK     — electronic consent log for the account
// ═══════════════════════════════════════════════════════════════════════════════

// Cancelled cheque image for a client bank account.
// Doc: /nsemfdesk/api/v2/fileupload/CANCELCHEQUE  (spec p.117)
app.post("/api/nse/cancel-cheque-upload", async (req, res) => {
    const { file_name, client_code, account_no, ifsc, account_type, file_data } = req.body || {};
    const missing = ["file_name", "client_code", "account_no", "ifsc", "account_type", "file_data"]
        .filter((f) => !req.body?.[f]);
    if (missing.length) {
        return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
    }
    if (!["SB", "CB", "NE", "NO"].includes(account_type)) {
        return res.status(400).json({ success: false, error: "account_type must be SB, CB, NE or NO" });
    }

    try {
        logActivity("cancel-cheque-upload", "nse_request_start", {
            requestId: req.activityId,
            clientCode: client_code,
            accountLast4: String(account_no).slice(-4),
            ifsc,
            fileName: file_name,
        });
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/fileupload/CANCELCHEQUE",
            { file_name, client_code, account_no, ifsc, account_type, file_data },
            { headers: buildNseHeaders() }
        );
        // status 100 = success, 101 = failure
        logActivity("cancel-cheque-upload", "nse_response", {
            requestId: req.activityId,
            status: response.data?.status,
            message: response.data?.message,
        });
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "cancel-cheque-upload");
    }
});

// Bank eLog — electronic consent record for the client's bank account.
// Doc: /nsemfdesk/api/v2/registration/ELOGBANK  (spec p.118)
// request_date format per spec: DD-MM-YYYY HH:MM
app.post("/api/nse/bank-elog", async (req, res) => {
    const { client_code, account_no, ifsc, request_date, beneficiary_name } = req.body || {};
    const missing = ["client_code", "account_no", "ifsc", "beneficiary_name"]
        .filter((f) => !req.body?.[f]);
    if (missing.length) {
        return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
    }

    // Default to now if the caller didn't stamp it — the consent happened just now.
    const pad = (n) => String(n).padStart(2, "0");
    const now = new Date();
    const stamp = request_date ||
        `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ` +
        `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    try {
        logActivity("bank-elog", "nse_request_start", {
            requestId: req.activityId,
            clientCode: client_code,
            accountLast4: String(account_no).slice(-4),
            ifsc,
        });
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/registration/ELOGBANK",
            { client_code, account_no, ifsc, request_date: stamp, beneficiary_name },
            { headers: buildNseHeaders() }
        );
        logActivity("bank-elog", "nse_response", {
            requestId: req.activityId,
            status: response.data?.status,
            message: response.data?.message,
        });
        res.json(response.data);
    } catch (err) {
        handleNseError(err, res, "bank-elog");
    }
});

// Bank verification status readback. This is what replaces the penny drop:
// NSE tells us whether the account it holds for this UCC is ACTIVE or still
// PENDING/rejected. Doc: /nsemfdesk/api/v2/reports/client_master_report (p.202)
app.post("/api/nse/bank-status", async (req, res) => {
    const { client_code } = req.body || {};
    if (!client_code) {
        return res.status(400).json({ success: false, error: "client_code is required" });
    }

    try {
        const response = await nseClient.post(
            "/nsemfdesk/api/v2/reports/client_master_report",
            { client_code },
            { headers: buildNseHeaders() }
        );

        // Flatten the bank1..bank5 column groups into something the app can render.
        const row = response.data?.report_data?.[0] || {};
        const banks = [1, 2, 3, 4, 5]
            .map((n) => ({
                slot: n,
                account_type: (row[`account_type_${n}`] || "").trim(),
                account_no: (row[`account_no_${n}`] || "").trim(),
                ifsc: (row[`ifsc_code_${n}`] || "").trim(),
                bank_name: (row[`bank_name_${n}`] || "").trim(),
                branch: (row[`bank_branch_${n}`] || "").trim(),
                is_default: (row[`default_bank_flag_${n}`] || "").trim().toUpperCase() === "YES",
                status: (row[`bank${n}_status`] || "").trim(),
                status_remarks: (row[`bank${n}_status_remarks`] || "").trim(),
            }))
            .filter((b) => b.account_no);

        logActivity("bank-status", "nse_response", {
            requestId: req.activityId,
            clientCode: client_code,
            bankCount: banks.length,
            statuses: banks.map((b) => b.status),
        });

        res.json({
            success: response.data?.response_status === "S",
            client_code,
            ucc_status: row.ucc_status,
            banks,
            error_remark: response.data?.error_remark,
        });
    } catch (err) {
        handleNseError(err, res, "bank-status");
    }
});

// ─── START ───────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    const env = nseEnvironment();
    const banner = env === "PRODUCTION" ? "🔴 LIVE — REAL MONEY, REAL INVESTORS" : "🟢 sandbox";
    console.log(`\n🚀 nse-service running on http://localhost:${port}`);
    console.log(`\n${"═".repeat(70)}`);
    console.log(`  NSE ENVIRONMENT : ${env}  ${banner}`);
    console.log(`  BASE URL        : ${process.env.NSE_BASE_URL}`);
    console.log(`  MEMBER CODE     : ${process.env.NSE_MEMBER_CODE || "(unset)"}`);
    console.log(`${"═".repeat(70)}`);
    console.log(`\nRoutes registered:`);
    console.log(`  GET  /api/nse/health`);
    console.log(`  POST /api/nse/kyc-check          → KYC_CHECK (Screen 2)`);
    console.log(`  POST /api/nse/ekyc-register      → EKYCREG (Screen 3)`);
    console.log(`  POST /api/nse/ucc-register       → CLIENTCOMMON183 (Screen 5+6)`);
    console.log(`  POST /api/nse/fatca-upload        → FATCA (Screen 5)`);
    console.log(`  POST /api/nse/bank-add            → CLIENTBANKDTL (Screen 6)`);
    console.log(`  POST /api/nse/get-link            → GET_LINK (Screen 5 post-UCC)`);
    console.log(`  POST /api/nse/order-entry         → NORMAL purchase/redemption`);
    console.log(`  POST /api/nse/purchase-payment   → purchase_payment (existing orders)`);
    console.log(`  POST /api/nse/resend-comm         → RESEND_COMM`);
    console.log(`  POST /api/nse/mandate-register    → MANDATE (trading prep)`);
    console.log(`  POST /api/nse/client-auth-status  → client_authorization (polling)`);
    console.log(`  POST /api/nse/sip-register        → SIP registration (trading)`);
    console.log(`  POST /api/nse/schemes             → live tradeable scheme catalogue`);
    console.log(`  POST /api/nse/sip-cancel          → SIP_CAN (stop installments)`);
    console.log(`  POST /api/nse/mandate-status      → MANDATE_STATUS (approved? UMRN?)`);
    console.log(`  POST /api/nse/sip-umrn            → SIPUMRN (attach mandate to SIP)`);
    console.log(`  POST /api/nse/cancel-cheque-upload → CANCELCHEQUE (bank verification)`);
    console.log(`  POST /api/nse/bank-elog           → ELOGBANK (bank verification)`);
    console.log(`  POST /api/nse/bank-status         → client_master_report (bank status)\n`);
});
