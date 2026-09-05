import { NSE_ENDPOINTS } from "@gowealthy/nse-core";
import { nsePost } from "../lib/nse.js";
import { logActivity } from "../lib/logger.js";
import { formatDdMmYyyyHhMm } from "../lib/dates.js";

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
