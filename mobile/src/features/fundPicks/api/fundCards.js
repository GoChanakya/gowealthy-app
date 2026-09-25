import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../../../config/services';
import { fetchSchemes } from '../../../lib/schemes';
import sample from '../contract/fund_cards.sample.json';

/**
 * Every network call for fund picks lives here. Screens and hooks only ever
 * see the v1.0 contract shape (contract/fund_card.schema.json).
 *
 * ── Going live ─────────────────────────────────────────────────────────────
 *   1. Backend serves the two endpoints below on BACKEND_URL (port 3001).
 *   2. Set EXPO_PUBLIC_FUND_PICKS_SOURCE=api in .env (or flip USE_MOCK).
 *   Nothing else in the app changes.
 *
 *   GET /api/mf/recommendations?phone={phone}
 *       → the full response: { schema_version, as_of_date, user, funds[] }
 *
 *   GET /api/mf/fund-cards/{scheme_code}?phone={phone}
 *       → one `fund` object (same shape as funds[i]). Used when the user
 *         switches to an alternate or swaps one in from search, since
 *         alternates[] only carries a summary. personality_match must be
 *         scored for this phone.
 *
 *   Errors: any non-2xx; a JSON body of { error: "..." } is shown in dev logs.
 */
export const USE_MOCK = process.env.EXPO_PUBLIC_FUND_PICKS_SOURCE !== 'api';

const SUPPORTED_MAJOR = '1';

const getPhone = () => AsyncStorage.getItem('user_phone');

async function getJson(path) {
  const res = await fetch(`${BACKEND_URL}${path}`, { headers: { Accept: 'application/json' } });
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status}) for ${path}`);
  }
  return body;
}

/* ── Contract guards ─────────────────────────────────────────────────────────
 * Not a full JSON Schema validator — just enough that a malformed fund is
 * dropped with a dev warning instead of crashing the whole list. */

const REQUIRED = ['scheme_code', 'name', 'amc', 'category', 'nav', 'returns_pct', 'personality_match',
  'persona', 'batting_average', 'sip_3y', 'rank_momentum', 'recovery', 'alternates'];

function normalizeFund(fund) {
  const missing = REQUIRED.filter((k) => fund?.[k] == null);
  if (missing.length) {
    if (__DEV__) console.warn(`[fundPicks] dropping ${fund?.scheme_code ?? '?'}: missing ${missing.join(', ')}`);
    return null;
  }
  return {
    ...fund,
    // Contract says oldest → newest; sort anyway so a backend slip can't
    // reverse the momentum story.
    rank_momentum: {
      ...fund.rank_momentum,
      snapshots: [...(fund.rank_momentum.snapshots ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
    },
    alternates: fund.alternates ?? [],
  };
}

function normalizeResponse(data) {
  const major = String(data?.schema_version ?? '').split('.')[0];
  if (major !== SUPPORTED_MAJOR) {
    throw new Error(`Unsupported fund cards schema_version "${data?.schema_version}" (app expects ${SUPPORTED_MAJOR}.x)`);
  }
  const funds = (data.funds ?? []).map(normalizeFund).filter(Boolean);
  return { asOfDate: data.as_of_date, user: data.user ?? null, funds };
}

/* ── Public API ──────────────────────────────────────────────────────────── */

export async function fetchFundPicks() {
  if (USE_MOCK) return normalizeResponse(sample);
  const phone = await getPhone();
  return normalizeResponse(await getJson(`/api/mf/recommendations?phone=${encodeURIComponent(phone ?? '')}`));
}

/**
 * Full card for one scheme — used by Switch and Swap in.
 * `hint` is the alternate's summary row plus its parent card; only the mock
 * uses it.
 */
export async function fetchFundCard(schemeCode, hint) {
  if (USE_MOCK) return mockCardFor(schemeCode, hint);
  const phone = await getPhone();
  const fund = normalizeFund(
    await getJson(`/api/mf/fund-cards/${encodeURIComponent(schemeCode)}?phone=${encodeURIComponent(phone ?? '')}`),
  );
  if (!fund) throw new Error(`Fund card ${schemeCode} did not match the contract`);
  return fund;
}

/**
 * Finds the NSE scheme behind a card so fund-detail can place real orders.
 * Matches on ISIN — the one identifier AMFI and NSE share. Returns null when
 * the fund isn't tradeable on NSE (or, with sample data, doesn't exist).
 */
export async function resolveNseScheme(fund) {
  if (!fund.isin) return null;
  const byIsin = (list) => list.find((s) => s.isin === fund.isin) ?? null;

  const { schemes } = await fetchSchemes({ search: fund.isin, limit: 5 });
  const direct = byIsin(schemes);
  if (direct) return direct;

  // Older nse-service builds only search scheme_name/scheme_code, so fall
  // back to the fund's name and pick the exact ISIN out of the results.
  const term = fund.name.replace(/\bfund\b/i, '').trim();
  const { schemes: byName } = await fetchSchemes({ search: term, limit: 100 });
  return byIsin(byName);
}

/* ── Mock only ───────────────────────────────────────────────────────────── */

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * The sample file has full cards for 2 funds only. Alternates get a card built
 * from their parent so switching can be exercised end to end; the numbers
 * are placeholders, not real data.
 */
async function mockCardFor(schemeCode, hint) {
  await delay(250);
  const existing = sample.funds.find((f) => f.scheme_code === schemeCode);
  if (existing) return normalizeFund(existing);

  const { alt, parent } = hint ?? {};
  if (!alt || !parent) throw new Error(`No sample card for ${schemeCode}`);
  const y1 = alt.returns_1y_pct;
  return normalizeFund({
    ...parent,
    scheme_code: alt.scheme_code,
    isin: undefined,
    name: alt.name,
    amc: { code: alt.amc_short_name.toUpperCase(), name: alt.amc_short_name, short_name: alt.amc_short_name },
    personality_match: { score: alt.personality_match },
    returns_pct: { ...parent.returns_pct, y1 },
    alternates: [
      { scheme_code: parent.scheme_code, name: parent.name, amc_short_name: parent.amc.short_name,
        personality_match: parent.personality_match.score, returns_1y_pct: parent.returns_pct.y1 },
      ...parent.alternates.filter((a) => a.scheme_code !== alt.scheme_code),
    ],
  });
}
