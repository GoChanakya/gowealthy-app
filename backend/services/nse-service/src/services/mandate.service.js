import { NSE_ENDPOINTS } from "@gowealthy/nse-core";
import { nsePost } from "../lib/nse.js";
import { logActivity } from "../lib/logger.js";

/**
 * Mandate registration. Doc: /nsemfdesk/api/v2/registration/product/MANDATE
 * After success call GET_LINK with productType="MANDATE_AUTH", productRefId=reg_id.
 */
export async function mandateRegister({ reg_data, requestId }) {
    const rec = reg_data[0];
    logActivity("mandate-register", "nse_request_start", {
        requestId,
        clientCode: rec.client_code,
        amount: rec.amount,
        mandateType: rec.mandate_type,
        accountLast4: String(rec.account_no).slice(-4),
        ifsc: rec.ifsc_code,
    });
    console.log(`💳 [mandate-register] UCC: ${rec.client_code}, Amount: ${rec.amount}`);

    const response = await nsePost(NSE_ENDPOINTS.MANDATE_REGISTER, { reg_data });

    const result = response.data?.reg_data?.[0];
    logActivity("mandate-register", "nse_response", {
        requestId,
        httpStatus: response.status,
        regStatus: result?.reg_status,
        regId: result?.reg_id,
        remark: result?.reg_remark,
    });
    console.log(`✅ [mandate-register] status: ${result?.reg_status}, id: ${result?.reg_id}`);
    return response.data;
}

/**
 * Mandate status: has the investor approved the eNACH, and what is its UMRN?
 * Doc: /nsemfdesk/api/v2/reports/MANDATE_STATUS
 * Per spec, from/to dates are only needed when neither id is supplied.
 */
export async function mandateStatus({ mandate_id, client_code, requestId }) {
    const response = await nsePost(NSE_ENDPOINTS.MANDATE_STATUS, {
        ...(mandate_id ? { mandate_id: String(mandate_id) } : {}),
        ...(client_code ? { client_code } : {}),
    });

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
        requestId,
        httpStatus: response.status,
        count: mandates.length,
        statuses: mandates.map((m) => m.status),
    });

    return {
        success: response.data?.response_status === "S",
        mandates,
        error_remark: response.data?.error_remark,
    };
}
