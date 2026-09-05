import { ValidationError, missingFields, requireNonEmptyArray } from "../lib/http.js";
import { formatIsoDate, lastDaysRange } from "../lib/dates.js";
import * as ordersService from "../services/orders.service.js";

const MAX_BATCH = 50;

const ORDER_REQUIRED_COMMON = [
    "scheme_code", "trxn_type", "client_code", "demat_physical", "kyc_flag",
    "euin_declaration", "min_redemption_flag", "dpc_flag", "all_units",
];

const PAYMENT_MODES = ["MANDATE", "CHEQUE", "UPI", "NETBANKING", "NEFT", "RTGS", "RTGS/NEFT"];
const BANK_BACKED_MODES = ["CHEQUE", "UPI", "NETBANKING"];
const UTR_MODES = ["NEFT", "RTGS", "RTGS/NEFT"];
const CALLBACK_MODES = ["UPI", "NETBANKING"];

// ORDER ENTRY (PURCHASE / REDEMPTION)
// Request : { transaction_details: [ { scheme_code, trxn_type: "P"|"R", ... } ] }  (max 50)
export async function orderEntry(req, res) {
    const { transaction_details } = req.body || {};
    if (!Array.isArray(transaction_details) || transaction_details.length === 0) {
        throw new ValidationError("transaction_details array is required");
    }
    if (transaction_details.length > MAX_BATCH) {
        throw new ValidationError("A maximum of 50 transactions is allowed");
    }

    const errors = [];
    transaction_details.forEach((record, index) => {
        const missing = missingFields(record, ORDER_REQUIRED_COMMON, { allowZero: true });
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
    if (errors.length) throw new ValidationError(errors.join("; "));

    res.json(await ordersService.orderEntry({ transaction_details, requestId: req.activityId }));
}

// PURCHASE ORDER PAYMENT
// Request : { payment_mode, client_code, order_ids, mandate_id?, bank_account_no?, ifsc?,
//             cheque_no?, cheque_date?, vpa?, neft_rtgs_utr_no?, callback_url? }
export async function purchasePayment(req, res) {
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

    if (!PAYMENT_MODES.includes(mode)) {
        throw new ValidationError(`Invalid payment_mode. Must be one of: ${PAYMENT_MODES.join(", ")}`);
    }
    if (!client_code || orderList.length === 0) {
        throw new ValidationError("client_code and order_ids are required");
    }
    if (orderList.length > MAX_BATCH) {
        throw new ValidationError("A maximum of 50 order_ids is allowed");
    }
    if (mode === "MANDATE" && !mandate_id) {
        throw new ValidationError("mandate_id is required for MANDATE payment");
    }
    if (BANK_BACKED_MODES.includes(mode) && (!bank_account_no || !ifsc)) {
        throw new ValidationError(`bank_account_no and ifsc are required for ${mode} payment`);
    }
    if (mode === "UPI" && !vpa) {
        throw new ValidationError("vpa is required for UPI payment");
    }
    if (mode === "CHEQUE" && (!cheque_no || !cheque_date)) {
        throw new ValidationError("cheque_no and cheque_date are required for CHEQUE payment");
    }
    if (UTR_MODES.includes(mode) && !neft_rtgs_utr_no) {
        throw new ValidationError("neft_rtgs_utr_no is required for NEFT/RTGS payment");
    }
    if (CALLBACK_MODES.includes(mode) && !callback_url) {
        throw new ValidationError(`callback_url is required for ${mode} payment`);
    }

    const payload = {
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

    res.json(await ordersService.purchasePayment({ payload, requestId: req.activityId }));
}

// ORDER CANCELLATION (Normal / Switch)
// Accepts either a single { client_code, order_no, remarks } or a
// { can_data: [...] } batch, so cancelling one stray order is a one-liner.
export async function orderCancel(req, res) {
    const body = req.body || {};
    const can_data = Array.isArray(body.can_data)
        ? body.can_data
        : (body.client_code && body.order_no ? [body] : null);

    requireNonEmptyArray(can_data, "can_data");
    if (can_data.length > MAX_BATCH) {
        throw new ValidationError("A maximum of 50 orders is allowed");
    }

    const errors = [];
    const records = can_data.map((record, index) => {
        const missing = missingFields(record, ["client_code", "order_no"]);
        if (missing.length) errors.push(`can_data[${index}]: ${missing.join(", ")}`);
        return {
            client_code: record.client_code,
            order_no: String(record.order_no),
            remarks: record.remarks || "Cancelled by investor",
        };
    });
    if (errors.length) throw new ValidationError(errors.join("; "));

    res.json(await ordersService.orderCancel({ can_data: records, requestId: req.activityId }));
}

// ORDER STATUS REPORT
// Request : { client_code?, order_ids?, from_date?, to_date?, provisional?, ... }
// NSE caps the range at 7 days and rejects a from/to difference of exactly 7
// ("Maximum Difference between from_date to to_date should be 7 days"), so the
// default looks back 6 days — a full 7-day window counting both ends.
export async function orderStatus(req, res) {
    const body = req.body || {};
    const { from, to } = lastDaysRange(6);

    const payload = {
        from_date: body.from_date || formatIsoDate(from),
        to_date: body.to_date || formatIsoDate(to),
        trans_type: body.trans_type || "ALL",
        order_type: body.order_type || "ALL",
        sub_order_type: body.sub_order_type || "ALL",
        client_code: body.client_code || "",
        order_status: body.order_status || "",
        settlement_type: body.settlement_type || "",
        order_ids: body.order_ids || "",
        member_unique_ids: body.member_unique_ids || "",
        date_type: body.date_type || "REQUEST DATE",
    };

    res.json(await ordersService.orderStatus({
        payload, provisional: Boolean(body.provisional), requestId: req.activityId,
    }));
}

// UPI PAYMENT STATUS CHECK
// Request : { nse_upi_ref_no, client_code }
// Response: { status: SUCCESS|FAILED|PENDING|EXPIRED|REJECTED, order_amount, upi_tran_ref_id, cust_ref_no, ... }
export async function upiPaymentStatus(req, res) {
    const { nse_upi_ref_no, client_code } = req.body || {};
    if (!nse_upi_ref_no || !client_code) {
        throw new ValidationError("nse_upi_ref_no and client_code are required");
    }

    res.json(await ordersService.upiPaymentStatus({
        nse_upi_ref_no, client_code, requestId: req.activityId,
    }));
}
