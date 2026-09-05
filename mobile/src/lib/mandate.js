// src/lib/mandate.js
// ─────────────────────────────────────────────────────────────────────────────
// Mandate approval tracking, and attaching an approved mandate to a SIP.
//
// A SIP is registered with sip_mandate_id blank, because at that moment the
// eNACH mandate is seconds old and still PENDING — NSE rejects a SIP that
// references an unapproved mandate. The mandate is approved later, out of band,
// when the investor completes the NSE authorization page.
//
// Nothing tells the app when that happens, so we pull:
//   refreshMandateStatus(phone)  → MANDATE_STATUS report, persists status + UMRN
//   attachMandateToSips(phone)   → SIPUMRN, links the approved UMRN to each SIP
//   reconcileSipMandates(phone)  → both, safe to call on any screen load
//
// Until the UMRN is attached, installments 2+ have nothing to debit.
// ─────────────────────────────────────────────────────────────────────────────

import { NSE_SERVICE_URL } from '../config/services';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const MANDATE_STATUS = {
  APPROVED: 'APPROVED',   // usable — installments can be auto-debited
  PENDING: 'PENDING',     // registered, awaiting investor authorization
  REJECTED: 'REJECTED',
  NOT_FOUND: 'NOT_FOUND',
  ERROR: 'ERROR',
};

// NSE reports these (upper-cased) once the bank has accepted the eNACH.
const APPROVED_VALUES = ['APPROVED', 'ACTIVE', 'SUCCESS', 'COMPLETED'];
const REJECTED_VALUES = ['REJECTED', 'FAILED', 'CANCELLED'];

// The mandate report is slow, and screens poll it. Share one in-flight request
// per mandate so ticks cannot stack up, matching the guard in src/lib/ucc.js.
const inFlight = new Map();

/**
 * Ask NSE for a mandate's approval status and UMRN.
 * @param {{mandateId?: string, clientCode?: string}} args
 * @returns {Promise<{status, approved, umrn, row?, error?}>}
 */
export async function checkMandateStatus({ mandateId, clientCode }) {
  const key = mandateId || clientCode;
  if (!key) return { status: MANDATE_STATUS.NOT_FOUND, approved: false, umrn: '' };
  if (inFlight.has(key)) return inFlight.get(key);

  const request = performMandateCheck({ mandateId, clientCode })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}

async function performMandateCheck({ mandateId, clientCode }) {
  console.log('[MF][Mandate] status check started', { mandateId, clientCode });
  try {
    const res = await fetch(`${NSE_SERVICE_URL}/api/nse/mandate-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(mandateId ? { mandate_id: String(mandateId) } : {}),
        ...(clientCode ? { client_code: clientCode } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));

    // The backend flattens the report into { success, mandates: [...] }.
    const list = Array.isArray(data?.mandates) ? data.mandates : [];
    const row = mandateId
      ? list.find((m) => String(m.mandate_id) === String(mandateId)) || list[0]
      : list[0];

    if (!row) {
      console.log('[MF][Mandate] no mandate row returned', { httpStatus: res.status, mandateId });
      return { status: MANDATE_STATUS.NOT_FOUND, approved: false, umrn: '', raw: data };
    }

    const statusRaw = String(row.status || '').toUpperCase().trim();
    const umrn = String(row.umrn || '').trim();
    // A UMRN is only issued on approval, so treat its presence as approval too.
    const approved = APPROVED_VALUES.includes(statusRaw) || Boolean(umrn);
    const status = approved
      ? MANDATE_STATUS.APPROVED
      : REJECTED_VALUES.includes(statusRaw) ? MANDATE_STATUS.REJECTED : MANDATE_STATUS.PENDING;

    console.log('[MF][Mandate] status check completed', { mandateId, statusRaw, status, hasUmrn: Boolean(umrn) });
    return { status, approved, umrn, statusRaw, row };
  } catch (e) {
    console.log('[MF][Mandate] status check failed', { mandateId, error: e.message });
    return { status: MANDATE_STATUS.ERROR, approved: false, umrn: '', error: e.message };
  }
}

/**
 * Check the user's mandate and persist status + UMRN to Firestore.
 * @param {string} phone  Firestore doc id under mf_onboarding
 */
export async function refreshMandateStatus(phone) {
  const ref = doc(db, 'mf_onboarding', phone);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { status: MANDATE_STATUS.NOT_FOUND, approved: false, umrn: '' };

  const data = snap.data();
  const mandateId = data.mandate_id;
  if (!mandateId) return { status: MANDATE_STATUS.NOT_FOUND, approved: false, umrn: '' };

  const result = await checkMandateStatus({ mandateId, clientCode: data.ucc_code });

  // Only write when something actually changed, to avoid pointless writes on every poll tick.
  const changed = data.mandate_status !== result.status || (result.umrn && data.mandate_umrn !== result.umrn);
  if (changed && result.status !== MANDATE_STATUS.ERROR) {
    await updateDoc(ref, {
      mandate_status: result.status,
      ...(result.umrn ? { mandate_umrn: result.umrn } : {}),
      ...(result.approved ? { mandate_approved_at: new Date().toISOString() } : {}),
    });
    console.log('[MF][Mandate] Firestore updated', { mandateId, status: result.status });
  }

  return { mandateId, ...result };
}

/**
 * Attach the approved mandate's UMRN to every registered SIP that is still
 * missing one. This is what lets installments 2+ auto-debit.
 *
 * Idempotent: SIPs already linked are skipped, so it is safe to call on load.
 * @param {string} phone
 * @returns {Promise<{linked: string[], skipped: number, failed: {sipRegId, error}[]}>}
 */
export async function attachMandateToSips(phone) {
  const ref = doc(db, 'mf_onboarding', phone);
  const snap = await getDoc(ref);
  const result = { linked: [], skipped: 0, failed: [] };
  if (!snap.exists()) return result;

  const data = snap.data();
  const umrn = String(data.mandate_umrn || '').trim();
  const sips = data.sip_mandates || {};
  if (!umrn) {
    console.log('[MF][Mandate] no UMRN yet, nothing to attach');
    return result;
  }

  for (const [sipRegId, sip] of Object.entries(sips)) {
    if (sip?.umrn_linked) { result.skipped++; continue; }

    try {
      console.log('[MF][Mandate] attaching UMRN to SIP', { sipRegId });
      const res = await fetch(`${NSE_SERVICE_URL}/api/nse/sip-umrn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sip_reg_id: sipRegId,
          umrn,
          remark: 'Mandate approved, linking to SIP',
        }),
      });
      const body = await res.json().catch(() => ({}));
      // Spec p.77: status 100 = success, 101 = failure.
      const ok = res.ok && String(body?.status) === '100';
      if (!ok) throw new Error(body?.message || body?.error || 'SIPUMRN mapping failed.');

      await updateDoc(ref, {
        [`sip_mandates.${sipRegId}.umrn`]: umrn,
        [`sip_mandates.${sipRegId}.umrn_linked`]: true,
        [`sip_mandates.${sipRegId}.umrn_linked_at`]: new Date().toISOString(),
        [`sip_mandates.${sipRegId}.status`]: 'ACTIVE',
      });
      result.linked.push(sipRegId);
      console.log('[MF][Mandate] UMRN attached', { sipRegId });
    } catch (e) {
      result.failed.push({ sipRegId, error: e.message });
      console.log('[MF][Mandate] UMRN attach failed', { sipRegId, error: e.message });
    }
  }

  return result;
}

/**
 * Refresh mandate approval and link any SIPs waiting on it.
 * Safe to fire-and-forget on screen load; never throws.
 * @param {string} phone
 */
export async function reconcileSipMandates(phone) {
  try {
    const status = await refreshMandateStatus(phone);
    if (!status.approved) return { ...status, linked: [] };
    const attach = await attachMandateToSips(phone);
    return { ...status, ...attach };
  } catch (e) {
    console.log('[MF][Mandate] reconcile failed', { error: e.message });
    return { status: MANDATE_STATUS.ERROR, approved: false, error: e.message, linked: [] };
  }
}
