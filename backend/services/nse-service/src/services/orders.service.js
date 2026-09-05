import { NSE_ENDPOINTS } from "@gowealthy/nse-core";
import { nsePost } from "../lib/nse.js";
import { logActivity } from "../lib/logger.js";

/** Purchase / redemption order entry. Doc: /nsemfdesk/api/v2/transaction/NORMAL */
export async function orderEntry({ transaction_details, requestId }) {
    logActivity("order-entry", "nse_request_start", {
        requestId,
        orderCount: transaction_details.length,
        transactionType: transaction_details[0]?.trxn_type,
        clientCodes: [...new Set(transaction_details.map((record) => record.client_code))],
        schemeCodes: [...new Set(transaction_details.map((record) => record.scheme_code))],
        amount: transaction_details.reduce((sum, record) => sum + Number(record.order_amount || 0), 0),
    });

    const response = await nsePost(NSE_ENDPOINTS.ORDER_NORMAL, { transaction_details });

    const result = response.data?.transaction_details?.[0];
    logActivity("order-entry", "nse_response", {
        requestId,
        httpStatus: response.status,
        transactionStatus: result?.trxn_status,
        transactionOrderId: result?.trxn_order_id,
        remark: result?.trxn_remark,
    });
    return response.data;
}

/**
 * Pay existing purchase / XSIP order ids. Doc: /nsemfdesk/api/v2/payments/purchase_payment
 * This pays orders that already exist; it does not create them.
 */
export async function purchasePayment({ payload, requestId }) {
    logActivity("purchase-payment", "nse_request_start", {
        requestId,
        clientCode: payload.client_code,
        paymentMode: payload.payment_mode,
        orderCount: payload.order_ids.split(",").length,
        accountLast4: payload.bank_account_no ? String(payload.bank_account_no).slice(-4) : undefined,
        hasMandate: Boolean(payload.mandate_id),
        hasCallback: Boolean(payload.callback_url),
    });

    const response = await nsePost(NSE_ENDPOINTS.PURCHASE_PAYMENT, payload);

    logActivity("purchase-payment", "nse_response", {
        requestId,
        httpStatus: response.status,
        paymentStatus: response.data?.status,
        orderAmount: response.data?.order_amount,
        basketId: response.data?.basket_id,
        hasShortUrl: Boolean(response.data?.short_url),
        remark: response.data?.remark,
    });
    return response.data;
}

/**
 * Cancel a purchase / redemption / switch order.
 * Doc: /nsemfdesk/api/v2/cancellation/ORDER_CAN
 * Only works while the order is still cancellable (before settlement cut-off).
 * can_status values per spec: "CAN SUCCESS" / "CAN FAILED".
 */
export async function orderCancel({ can_data, requestId }) {
    logActivity("order-cancel", "nse_request_start", {
        requestId,
        orderCount: can_data.length,
        orderNos: can_data.map((r) => r.order_no),
        clientCodes: [...new Set(can_data.map((r) => r.client_code))],
    });

    const response = await nsePost(NSE_ENDPOINTS.ORDER_CANCEL, { can_data });

    // The spec's sample response nests this under reg_data, not can_data.
    const rows = response.data?.reg_data || response.data?.can_data || [];
    logActivity("order-cancel", "nse_response", {
        requestId,
        httpStatus: response.status,
        statuses: rows.map((r) => r?.can_status),
        remarks: rows.map((r) => r?.can_remark),
    });
    return response.data;
}

/**
 * Order status / provisional order report.
 * Doc: /nsemfdesk/api/v2/reports/ORDER_STATUS and .../PROV_ORDERS
 * Date range is capped at 7 days by NSE and formatted YYYY-MM-DD.
 */
export async function orderStatus({ payload, provisional, requestId }) {
    const endpoint = provisional ? NSE_ENDPOINTS.PROV_ORDERS : NSE_ENDPOINTS.ORDER_STATUS;
    logActivity("order-status", "nse_request_start", {
        requestId,
        provisional: Boolean(provisional),
        clientCode: payload.client_code,
        fromDate: payload.from_date,
        toDate: payload.to_date,
    });

    const response = await nsePost(endpoint, payload);

    logActivity("order-status", "nse_response", {
        requestId,
        httpStatus: response.status,
        responseStatus: response.data?.response_status,
        total: response.data?.report_data_total,
        errorRemark: response.data?.error_remark,
    });
    return response.data;
}

/**
 * UPI payment status. Doc: /nsemfdesk/api/v2/payments/upi_status_check
 * status values: SUCCESS, FAILED, PENDING, EXPIRED, REJECTED.
 * This is the pull equivalent of the callback NSE posts to callback_url, and
 * is what confirms an installment actually got paid.
 */
export async function upiPaymentStatus({ nse_upi_ref_no, client_code, requestId }) {
    logActivity("upi-payment-status", "nse_request_start", {
        requestId,
        clientCode: client_code,
        upiRefNo: nse_upi_ref_no,
    });

    const response = await nsePost(NSE_ENDPOINTS.UPI_STATUS_CHECK, { nse_upi_ref_no, client_code });

    logActivity("upi-payment-status", "nse_response", {
        requestId,
        httpStatus: response.status,
        paymentStatus: response.data?.status,
        orderAmount: response.data?.order_amount,
        upiTranRefId: response.data?.upi_tran_ref_id,
        remark: response.data?.remark,
    });
    return response.data;
}
