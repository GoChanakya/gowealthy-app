// src/lib/payment.js
// ─────────────────────────────────────────────────────────────────────────────
// Paying an NSE purchase order.
//
// order-entry only CREATES an order; it does not fund it. An unpaid order is
// dropped by NSE at settlement cut-off, so every purchase needs a payment step.
//
// We fund the first SIP installment with an NSE-hosted payment link
// (GET_LINK productType "PUR"). The investor picks UPI / netbanking on NSE's
// own page, which means we never handle their bank credentials and need no
// public callback URL — unlike purchase-payment with UPI/NETBANKING, which
// requires a publicly reachable callback_url NSE can POST to.
//
// Installments 2+ are auto-debited by NSE against the approved mandate, so they
// need no app-side payment call at all. See src/lib/mandate.js.
// ─────────────────────────────────────────────────────────────────────────────

import { NSE_SERVICE_URL } from '../config/services';

export const PAYMENT_STATUS = {
  PAID: 'PAID',
  PENDING: 'PENDING',   // link issued, investor has not completed payment
  FAILED: 'FAILED',
  UNKNOWN: 'UNKNOWN',
};

/**
 * NSE-hosted payment link for a purchase order.
 * @param {string} orderId  trxn_order_id returned by order-entry
 * @returns {Promise<string>} firstHolderLink
 */
export async function getPurchasePaymentLink(orderId) {
  console.log('[MF][Payment] requesting payment link', { orderId });
  const res = await fetch(`${NSE_SERVICE_URL}/api/nse/get-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType: 'PUR', productRefId: String(orderId) }),
  });
  const data = await res.json().catch(() => ({}));
  const link = data?.firstHolderLink || '';
  console.log('[MF][Payment] payment link result', {
    httpStatus: res.status,
    ok: res.ok,
    hasLink: Boolean(link),
    error: data?.errorMessage || data?.error,
  });
  if (!res.ok || !link) {
    throw new Error(data?.errorMessage || data?.error || 'NSE did not return a payment link.');
  }
  return link;
}

/**
 * Pay one or more purchase orders against an APPROVED mandate.
 * Only valid once the mandate is approved; NSE rejects a pending mandate.
 * @param {{clientCode: string, orderIds: string[]|string, mandateId: string}} args
 */
export async function payOrdersWithMandate({ clientCode, orderIds, mandateId }) {
  const ids = Array.isArray(orderIds) ? orderIds.join(',') : String(orderIds);
  console.log('[MF][Payment] paying with mandate', { clientCode, orderIds: ids, mandateId });
  const res = await fetch(`${NSE_SERVICE_URL}/api/nse/purchase-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payment_mode: 'MANDATE',
      client_code: clientCode,
      order_ids: ids,
      mandate_id: String(mandateId),
    }),
  });
  const data = await res.json().catch(() => ({}));
  const ok = res.ok && String(data?.status || '').toLowerCase() === 'success';
  console.log('[MF][Payment] mandate payment result', {
    httpStatus: res.status,
    status: data?.status,
    remark: data?.remark || data?.error,
  });
  if (!ok) throw new Error(data?.remark || data?.error || 'Mandate payment failed.');
  return { shortUrl: data?.short_url || '', basketId: data?.basket_id || '', amount: data?.order_amount };
}

/**
 * Cancel a purchase order that was never funded.
 * Only possible before NSE's settlement cut-off for that order.
 * @param {{clientCode: string, orderNo: string, remarks?: string}} args
 */
export async function cancelPurchaseOrder({ clientCode, orderNo, remarks }) {
  console.log('[MF][Payment] cancelling order', { clientCode, orderNo });
  const res = await fetch(`${NSE_SERVICE_URL}/api/nse/order-cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_code: clientCode,
      order_no: String(orderNo),
      remarks: remarks || 'Duplicate order cancelled by investor',
    }),
  });
  const data = await res.json().catch(() => ({}));
  const row = data?.reg_data?.[0] || data?.can_data?.[0];
  // Spec p.40: can_status is "CAN SUCCESS" / "CAN FAILED".
  const ok = res.ok && String(row?.can_status || '').toUpperCase().includes('SUCCESS');
  console.log('[MF][Payment] cancel result', {
    httpStatus: res.status,
    canStatus: row?.can_status,
    remark: row?.can_remark,
  });
  if (!ok) throw new Error(row?.can_remark || data?.error || 'Order cancellation failed.');
  return { orderNo, remark: row?.can_remark || '' };
}

/**
 * Orders for a client over the last 7 days (NSE's maximum range).
 * Use this to find orders whose ids were never persisted locally.
 * @param {{clientCode: string, orderIds?: string}} args
 */
export async function listRecentOrders({ clientCode, orderIds }) {
  const res = await fetch(`${NSE_SERVICE_URL}/api/nse/order-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_code: clientCode,
      ...(orderIds ? { order_ids: orderIds } : {}),
    }),
  });
  const data = await res.json().catch(() => ({}));
  const rows = Array.isArray(data?.report_data) ? data.report_data : [];
  console.log('[MF][Payment] recent orders', { clientCode, count: rows.length });
  return rows;
}

/**
 * Poll a UPI payment initiated through purchase-payment.
 * @param {{upiRefNo: string, clientCode: string}} args
 * @returns {Promise<{status, raw}>} status is one of PAYMENT_STATUS
 */
export async function checkUpiPaymentStatus({ upiRefNo, clientCode }) {
  try {
    const res = await fetch(`${NSE_SERVICE_URL}/api/nse/upi-payment-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nse_upi_ref_no: String(upiRefNo), client_code: clientCode }),
    });
    const data = await res.json().catch(() => ({}));
    const raw = String(data?.status || '').toUpperCase();
    const status =
      raw === 'SUCCESS' ? PAYMENT_STATUS.PAID
        : ['FAILED', 'EXPIRED', 'REJECTED'].includes(raw) ? PAYMENT_STATUS.FAILED
          : raw === 'PENDING' ? PAYMENT_STATUS.PENDING
            : PAYMENT_STATUS.UNKNOWN;
    console.log('[MF][Payment] UPI status', { upiRefNo, raw, status });
    return { status, raw, data };
  } catch (e) {
    console.log('[MF][Payment] UPI status check failed', { error: e.message });
    return { status: PAYMENT_STATUS.UNKNOWN, error: e.message };
  }
}
