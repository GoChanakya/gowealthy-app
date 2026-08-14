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
const AUTHORIZED_VALUES = ['SUCCESS', 'AUTHORIZED', 'APPROVED', 'AUTH_SUCCESS'];

/**
 * Query NSE for a UCC's authorization status.
 * @param {string} uccCode
 * @returns {Promise<{status, authorized, authStatusRaw?, name?, email?, authDatetime?, emailSent?, row?, raw?, error?}>}
 */
export async function checkUccStatus(uccCode) {
  if (!uccCode) return { status: UCC_STATUS.NOT_FOUND, authorized: false };
  try {
    const res = await fetch(`${NSE_SERVICE_URL}/api/nse/client-auth-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_code: uccCode }),
    });
    const data = await res.json().catch(() => ({}));
    const row = data?.report_data?.[0];
    if (!row) return { status: UCC_STATUS.NOT_FOUND, authorized: false, raw: data };

    const authStatusRaw = String(row.auth_status || row.first_holder_auth_status || '')
      .toUpperCase().trim();
    const authorized = AUTHORIZED_VALUES.includes(authStatusRaw);

    return {
      status: authorized ? UCC_STATUS.ACTIVE : UCC_STATUS.PENDING,
      authorized,
      authStatusRaw,
      name: (row.primary_holder_name || '').trim(),
      email: (row.first_holder_email || '').trim(),
      authDatetime: (row.first_holder_auth_datetime || '').trim(),
      emailSent: row.auth_email_sent === 'Y',
      row,
    };
  } catch (e) {
    return { status: UCC_STATUS.ERROR, authorized: false, error: e.message };
  }
}

/**
 * Check the logged-in user's UCC and, if ACTIVE, mark it authorized in Firestore.
 * @param {string} phone  Firestore doc id under mf_onboarding
 * @returns {Promise<{ucc, ...status}>}
 */
export async function refreshUccActivation(phone) {
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
  return { ucc, ...result };
}
