import { NSE_ENDPOINTS } from "@gowealthy/nse-core";
import { nsePost } from "../lib/nse.js";
import { logActivity } from "../lib/logger.js";
import { formatDdMmYyyyHhMm } from "../lib/dates.js";
import { config } from "../config.js";

const RAZORPAY_VALIDATIONS_PATH = "/v1/fund_accounts/validations";
const VALID_ACCOUNT_STATUSES = new Set(["active", "valid"]);

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function razorpayConfig() {
    const { keyId, keySecret, sourceAccountNumber } = config.razorpay;
    const missing = [
        !keyId && "RAZORPAY_KEY_ID",
        !keySecret && "RAZORPAY_KEY_SECRET",
        !sourceAccountNumber && "RAZORPAYX_ACCOUNT_NUMBER",
    ].filter(Boolean);

    if (missing.length) {
        const error = new Error(`Bank verification is not configured. Missing: ${missing.join(", ")}`);
        error.statusCode = 503;
        throw error;
    }

    return config.razorpay;
}

async function razorpayRequest(path, { method = "GET", body } = {}) {
    const razorpay = razorpayConfig();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), razorpay.timeoutMs);

    try {
        const response = await fetch(`${razorpay.baseUrl.replace(/\/$/, "")}${path}`, {
            method,
            headers: {
                Authorization: `Basic ${Buffer.from(`${razorpay.keyId}:${razorpay.keySecret}`).toString("base64")}`,
                "Content-Type": "application/json",
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
            signal: controller.signal,
        });
        const text = await response.text();
        let data = {};
        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = {};
        }

        if (!response.ok) {
            const detail = data?.error?.description || data?.error?.reason || `HTTP ${response.status}`;
            const error = new Error(`Razorpay bank verification failed: ${detail}`);
            error.statusCode = response.status === 429 ? 429 : 502;
            error.upstreamStatus = response.status;
            throw error;
        }

        return data;
    } catch (error) {
        if (error.name === "AbortError") {
            const timeoutError = new Error("Razorpay bank verification timed out. Please try again.");
            timeoutError.statusCode = 504;
            throw timeoutError;
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

function publicValidationResult(data) {
    const results = data?.validation_results || data?.results || {};
    const transactionStatus = String(data?.status || "unknown").toLowerCase();
    const accountStatus = String(results?.account_status || "unknown").toLowerCase();
    const verified = transactionStatus === "completed" && VALID_ACCOUNT_STATUSES.has(accountStatus);
    const pending = ["created", "queued", "processing"].includes(transactionStatus);

    return {
        success: verified,
        verified,
        pending,
        validation_id: data?.id || null,
        status: transactionStatus,
        account_status: accountStatus,
        registered_name: results?.registered_name || null,
        name_match_score: Number.isFinite(results?.name_match_score) ? results.name_match_score : null,
        details: results?.details || data?.status_details?.description || null,
        reason: data?.status_details?.reason || null,
        utr: data?.utr || null,
    };
}

async function pollValidation(data) {
    let current = data;
    const { pollAttempts, pollIntervalMs } = config.razorpay;

    for (let attempt = 0; current?.status === "created" && attempt < pollAttempts; attempt += 1) {
        await sleep(pollIntervalMs);
        current = await razorpayRequest(`${RAZORPAY_VALIDATIONS_PATH}/${encodeURIComponent(current.id)}`);
    }

    return current;
}

/**
 * Performs a real RazorpayX penny drop and waits briefly for its final result.
 * Credentials and source account details never leave the backend.
 */
export async function verifyBankAccount({
    validationId,
    accountNumber,
    ifsc,
    name,
    contact,
    email,
    requestId,
}) {
    let validation;

    if (validationId) {
        validation = await razorpayRequest(`${RAZORPAY_VALIDATIONS_PATH}/${encodeURIComponent(validationId)}`);
    } else {
        const contactReference = `gw-${String(contact).replace(/\D/g, "").slice(-10)}-${Date.now().toString(36)}`.slice(0, 40);
        const contactDetails = {
            name,
            contact,
            type: "customer",
            reference_id: contactReference,
        };
        if (email) contactDetails.email = email;

        validation = await razorpayRequest(RAZORPAY_VALIDATIONS_PATH, {
            method: "POST",
            body: {
                source_account_number: razorpayConfig().sourceAccountNumber,
                validation_type: "pennydrop",
                reference_id: contactReference,
                notes: { purpose: "gowealthy_bank_verification" },
                fund_account: {
                    account_type: "bank_account",
                    bank_account: {
                        name,
                        ifsc,
                        account_number: accountNumber,
                    },
                    contact: contactDetails,
                },
            },
        });
    }

    validation = await pollValidation(validation);
    const result = publicValidationResult(validation);

    logActivity("bank-verify", "razorpay_response", {
        requestId,
        validationId: result.validation_id,
        transactionStatus: result.status,
        accountStatus: result.account_status,
        verified: result.verified,
        accountLast4: accountNumber ? String(accountNumber).slice(-4) : undefined,
    });

    return result;
}

/**
 * Bank account ADD/DEL. Doc: /nsemfdesk/api/v2/registration/CLIENTBANKDTL
 * NSE verifies the account itself; after ADD it sits at PENDING until the
 * cancelled-cheque + bank eLog uploads are processed.
 */
export async function bankAdd(bank_dtl) {
    const rec = bank_dtl[0];
    console.log(`🏦 [bank-add] UCC: ${rec.client_code}, Acc: ${rec.account_no}, IFSC: ${rec.ifsc_code}`);
    const response = await nsePost(NSE_ENDPOINTS.CLIENT_BANK_DETAIL, { bank_dtl });
    const result = response.data?.bank_dtl?.[0];
    console.log(`✅ [bank-add] status: ${result?.status}`);
    return response.data;
}

/** Cancelled cheque image. Doc: /nsemfdesk/api/v2/fileupload/CANCELCHEQUE (status 100 = ok, 101 = fail) */
export async function cancelChequeUpload({ file_name, client_code, account_no, ifsc, account_type, file_data, requestId }) {
    logActivity("cancel-cheque-upload", "nse_request_start", {
        requestId,
        clientCode: client_code,
        accountLast4: String(account_no).slice(-4),
        ifsc,
        fileName: file_name,
    });
    const response = await nsePost(NSE_ENDPOINTS.CANCEL_CHEQUE_UPLOAD, {
        file_name, client_code, account_no, ifsc, account_type, file_data,
    });
    logActivity("cancel-cheque-upload", "nse_response", {
        requestId,
        status: response.data?.status,
        message: response.data?.message,
    });
    return response.data;
}

/**
 * Bank eLog (electronic consent record). Doc: /nsemfdesk/api/v2/registration/ELOGBANK
 * request_date format: DD-MM-YYYY HH:MM. Defaults to now when not supplied.
 */
export async function bankElog({ client_code, account_no, ifsc, request_date, beneficiary_name, requestId }) {
    const stamp = request_date || formatDdMmYyyyHhMm(new Date());

    logActivity("bank-elog", "nse_request_start", {
        requestId,
        clientCode: client_code,
        accountLast4: String(account_no).slice(-4),
        ifsc,
    });
    const response = await nsePost(NSE_ENDPOINTS.BANK_ELOG, {
        client_code, account_no, ifsc, request_date: stamp, beneficiary_name,
    });
    logActivity("bank-elog", "nse_response", {
        requestId,
        status: response.data?.status,
        message: response.data?.message,
    });
    return response.data;
}

/**
 * Bank verification status readback from the Client Master report.
 * Doc: /nsemfdesk/api/v2/reports/client_master_report
 * Flattens bank1..bank5 column groups into a list.
 */
export async function bankStatus({ client_code, requestId }) {
    const response = await nsePost(NSE_ENDPOINTS.CLIENT_MASTER_REPORT, { client_code });

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
        requestId,
        clientCode: client_code,
        bankCount: banks.length,
        statuses: banks.map((b) => b.status),
    });

    return {
        success: response.data?.response_status === "S",
        client_code,
        ucc_status: row.ucc_status,
        banks,
        error_remark: response.data?.error_remark,
    };
}
