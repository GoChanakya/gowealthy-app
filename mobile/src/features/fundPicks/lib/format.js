/**
 * Number and date formatting. The API sends raw numbers only; everything the
 * user reads is shaped here so web and mobile can share the same rules.
 *
 * Hermes ships without full Intl on some Android builds, so Indian digit
 * grouping (1,80,000) is done by hand rather than via toLocaleString('en-IN').
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function groupIndian(intStr) {
  if (intStr.length <= 3) return intStr;
  const last3 = intStr.slice(-3);
  const rest = intStr.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

/** 234600 → "₹2,34,600". Pass decimals for NAV-style values. */
export function rupees(value, decimals = 0) {
  if (value == null || !Number.isFinite(value)) return '—';
  const neg = value < 0;
  const [int, frac] = Math.abs(value).toFixed(decimals).split('.');
  return `${neg ? '−' : ''}₹${groupIndian(int)}${frac ? `.${frac}` : ''}`;
}

/** 14.2 → "+14.2%", -3 → "−3.0%", null → "—". */
export function signedPct(value, decimals = 1) {
  if (value == null || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toFixed(decimals)}%`;
}

/** 9.8 → "9.8%" (no sign). */
export function pct(value, decimals = 1) {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${Number(value).toFixed(decimals)}%`;
}

/** 1 → "1st", 22 → "22nd", 13 → "13th". */
export function ordinal(n) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

/** "2026-02-25" → "25 Feb 2026". Parsed by hand to avoid timezone shifts. */
export function shortDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Whole months between two ISO dates, rounded to the nearest month. */
export function monthsBetween(fromIso, toIso) {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  return Math.max(0, Math.round((y2 - y1) * 12 + (m2 - m1) + (d2 - d1) / 30));
}

/** 3 → "3 months", 1 → "1 month". Rounds halves (2.5 → "3 months"). */
export function monthsText(n) {
  const r = Math.round(n);
  return `${r} ${r === 1 ? 'month' : 'months'}`;
}
