// src/lib/schemes.js
// ─────────────────────────────────────────────────────────────────────────────
// Live scheme catalogue.
//
// Every scheme shown in the app comes from NSE's daily master file via
// /api/nse/schemes — nothing here is hardcoded. That matters: the previous
// hardcoded list carried "IIFLMUTUALFUND_MF", an AMC that no longer exists
// after the 360 ONE rename, and every SIP registration failed with
// "AMC DOES NOT EXISTS" until it was noticed.
//
// The backend already filters to schemes this member can actually transact in
// (AMC active, purchase allowed, SIP allowed, retail settlement classes only).
// ─────────────────────────────────────────────────────────────────────────────

import { NSE_SERVICE_URL } from '../config/services';

// A starter set of large, well-known AMCs for the default view. These are search
// terms, not scheme codes — the real codes always come back from NSE, so this
// list can never go stale the way a hardcoded catalogue does.
export const FEATURED_AMCS = [
  'HDFC', 'ICICI', 'SBI', 'AXIS', 'NIPPON',
  'KOTAK', 'ADITYA BIRLA', 'UTI', 'DSP', 'MIRAE',
];

export async function fetchSchemes({ search = '', limit = 50, amcCode = '' } = {}) {
  const response = await fetch(`${NSE_SERVICE_URL}/api/nse/schemes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ search, limit, ...(amcCode ? { amc_code: amcCode } : {}) }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Could not load schemes from NSE.');
  }
  return data;
}

// One scheme per AMC for the default "featured" view, so the first screen isn't
// 500 near-identical rows from whichever AMC happens to sort first.
export async function fetchFeaturedSchemes() {
  const results = await Promise.all(
    FEATURED_AMCS.map(async (amc) => {
      try {
        const { schemes } = await fetchSchemes({ search: amc, limit: 1 });
        return schemes[0] || null;
      } catch {
        return null; // one AMC failing shouldn't empty the whole screen
      }
    })
  );
  return results.filter(Boolean);
}

// NSE ships scheme names in ALL CAPS with doubled spaces — readable enough in a
// log, ugly in a list.
export function prettySchemeName(name = '') {
  return name
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\b(Sip|Idcw|Nav|Amc|Etf|Fof)\b/gi, (m) => m.toUpperCase());
}

// Short badge text for a scheme card — first word of the AMC code.
export function amcInitials(amcCode = '') {
  return (amcCode.split('_')[0] || '?').slice(0, 4).toUpperCase();
}
