import { NSE_ENDPOINTS } from "@gowealthy/nse-core";
import { nsePost } from "../lib/nse.js";
import { logActivity } from "../lib/logger.js";

/**
 * SIP registration. Doc: /nsemfdesk/api/v2/registration/product/SIP
 * After success call GET_LINK with productType="SIP_REG", productRefId=reg_id.
 */
export async function sipRegister({ rec, requestId }) {
    console.log(`📋 [sip-register] UCC: ${rec.client_code}, Scheme: ${rec.sch_code}, Amount: ${rec.installment_amount}`);

    const response = await nsePost(NSE_ENDPOINTS.SIP_REGISTER, { reg_data: [rec] });

    const result = response.data?.reg_data?.[0];
    // NSE returns HTTP 200 even when the registration is rejected, and the
    // only explanation lives in reg_remark. Without logging it a REG_FAILED
    // is invisible and undiagnosable.
    logActivity("sip-register", "nse_response", {
        requestId,
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
        console.error(`❌ [sip-register] REG_FAILED - ${result?.reg_remark || "(no remark returned)"}`);
    } else {
        console.log(`✅ [sip-register] status: ${result?.reg_status}, id: ${result?.reg_id}`);
    }
    return response.data;
}

/**
 * Registered SIPs for a client. Doc: /nsemfdesk/api/v2/reports/SIP_REG_REPORT
 * (or XSIP_REG_REPORT when xsip is true). Per spec, passing only client_code
 * makes NSE ignore the date filters.
 */
export async function sipReport({ payload, xsip, requestId }) {
    const endpoint = xsip ? NSE_ENDPOINTS.XSIP_REG_REPORT : NSE_ENDPOINTS.SIP_REG_REPORT;
    logActivity("sip-report", "nse_request_start", {
        requestId,
        xsip: Boolean(xsip),
        clientCode: payload.client_code,
    });

    const response = await nsePost(endpoint, payload);

    logActivity("sip-report", "nse_response", {
        requestId,
        httpStatus: response.status,
        responseStatus: response.data?.response_status,
        total: response.data?.response_data_total ?? response.data?.report_data_total,
    });
    return response.data;
}

/**
 * SIP cancellation: stops all future installments. Doc: /nsemfdesk/api/v2/cancellation/SIP_CAN
 * There is no mandate cancellation API in the spec; cancelling the SIP is what
 * actually stops money moving.
 */
export async function sipCancel({ client_code, sip_reg_no, reason, requestId }) {
    logActivity("sip-cancel", "nse_request_start", {
        requestId,
        clientCode: client_code,
        sipRegNo: sip_reg_no,
        reason,
    });

    const response = await nsePost(NSE_ENDPOINTS.SIP_CANCEL, {
        can_data: [{ client_code, sip_reg_no: String(sip_reg_no), remarks: reason }],
    });

    // The spec's sample response nests this under reg_data, not can_data.
    const result = response.data?.reg_data?.[0] || response.data?.can_data?.[0];
    logActivity("sip-cancel", "nse_response", {
        requestId,
        httpStatus: response.status,
        canStatus: result?.can_status,
        remark: result?.can_remark,
    });
    if (result?.can_status === "CAN_FAILED") {
        console.error(`❌ [sip-cancel] CAN_FAILED - ${result?.can_remark || "(no remark)"}`);
    } else {
        console.log(`✅ [sip-cancel] ${result?.can_status} for SIP ${sip_reg_no}`);
    }
    return response.data;
}

/**
 * Attach an approved mandate (UMRN) to an already-registered SIP.
 * Doc: /nsemfdesk/api/v2/registration/SIPUMRN (status 100 = success, 101 = failure)
 */
export async function sipUmrn({ sip_reg_id, umrn, remark, requestId }) {
    logActivity("sip-umrn", "nse_request_start", { requestId, sipRegId: sip_reg_id });

    const response = await nsePost(NSE_ENDPOINTS.SIP_UMRN, {
        sip_reg_id: Number(sip_reg_id), umrn, remark: remark || "",
    });

    logActivity("sip-umrn", "nse_response", {
        requestId,
        httpStatus: response.status,
        status: response.data?.status,
        message: response.data?.message,
    });
    return response.data;
}
