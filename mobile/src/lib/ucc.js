// src/lib/ucc.js
// ─────────────────────────────────────────────────────────────────────────────
// UCC status / activation helper.
//
// A UCC goes: registered  →  (investor authorizes via CL_ACT link)  →  ACTIVE.
// Only an ACTIVE UCC can place mandates / SIPs / orders.
//
// checkUccStatus(ucc)        → asks NSE (CLIENT_AUTH_REPORT), returns a normalized status.
// refreshUccActivation(phone)→ looks up the user's UCC, checks status, and if ACTIVE
//                              persists ucc_authorized:true in Firestore.
// ─────────────────────────────────────────────────────────────────────────────

import { NSE_SERVICE_URL } from '../config/services';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const UCC_STATUS = {
  ACTIVE: 'ACTIVE',       // investor authorized — can transact
  PENDING: 'PENDING',     // registered, waiting for authorization
  NOT_FOUND: 'NOT_FOUND', // no auth record yet (still propagating / not registered)
  ERROR: 'ERROR',         // network / service error
};

// NSE reports these (upper-cased) once the first holder has authorized.
const AUTHORIZED_VALUES = [
  'SUCCESS', 'AUTHORIZED', 'APPROVED', 'AUTH_SUCCESS',
  'ACTIVE', 'COMPLETED', 'COMPLETE', 'YES', 'Y',
];

/**
 * Query NSE for a UCC's authorization status.
 * @param {string} uccCode
 * @returns {Promise<{status, authorized, authStatusRaw?, name?, email?, authDatetime?, emailSent?, row?, raw?, error?}>}
 */
export async function checkUccStatus(uccCode) {
  if (!uccCode) return { status: UCC_STATUS.NOT_FOUND, authorized: false };
  console.log('[MF][UCC] status check started', { clientCode: uccCode });
  try {
    const res = await fetch(`${NSE_SERVICE_URL}/api/nse/client-auth-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_code: uccCode }),
    });
    const data = await res.json().catch(() => ({}));
    const row = data?.report_data?.[0];
    if (!row) {
      console.log('[MF][UCC] status check returned no report row', { httpStatus: res.status, clientCode: uccCode });
      return { status: UCC_STATUS.NOT_FOUND, authorized: false, raw: data };
    }

    const authStatusValues = [
      row.auth_status,
      row.first_holder_auth_status,
      row.first_holder_authentication_status,
      row.client_status,
      row.status,
    ]
      .map((value) => String(value ?? '').toUpperCase().trim())
      .filter(Boolean);
    const authStatusRaw = authStatusValues.join(' | ');
    const authDatetime = String(row.first_holder_auth_datetime || '').trim();
    const authorized = authStatusValues.some((value) => AUTHORIZED_VALUES.includes(value)) || Boolean(authDatetime);

    const result = {
      status: authorized ? UCC_STATUS.ACTIVE : UCC_STATUS.PENDING,
      authorized,
      authStatusRaw,
      name: (row.primary_holder_name || '').trim(),
      email: (row.first_holder_email || '').trim(),
      authDatetime,
      emailSent: row.auth_email_sent === 'Y',
      row,
    };
    console.log('[MF][UCC] status check completed', {
      httpStatus: res.status,
      clientCode: uccCode,
      status: result.status,
      authStatusRaw,
      authorized,
    });
    return result;
  } catch (e) {
    console.log('[MF][UCC] status check failed', { clientCode: uccCode, error: e.message });
    return { status: UCC_STATUS.ERROR, authorized: false, error: e.message };
  }
}

/**
 * Check the logged-in user's UCC and, if ACTIVE, mark it authorized in Firestore.
 * @param {string} phone  Firestore doc id under mf_onboarding
 * @returns {Promise<{ucc, ...status}>}
 */
export async function refreshUccActivation(phone) {
  console.log('[MF][UCC] loading Firestore onboarding record', { phone: String(phone).slice(-4) });
  const ref = doc(db, 'mf_onboarding', phone);
  const snap = await getDoc(ref);
  const ucc = snap.data()?.ucc_code || null;

  const result = await checkUccStatus(ucc);

  if (result.authorized) {
    await updateDoc(ref, {
      ucc_authorized: true,
      ucc_authorized_at: new Date().toISOString(),
      onboarding_complete: true,
    });
  }
  console.log('[MF][UCC] activation refresh completed', { clientCode: ucc, status: result.status, authorized: result.authorized });
  return { ucc, ...result };
}
