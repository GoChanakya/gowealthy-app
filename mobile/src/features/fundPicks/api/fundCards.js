import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { BACKEND_URL } from '../../../config/services';
import { db } from '../../../config/firebase';
import { fetchSchemes } from '../../../lib/schemes';
import sample from '../contract/fund_cards.sample.json';

/**
 * Every network call for fund picks lives here. Screens and hooks only ever
 * see the backward-compatible v1.x contract shape (contract/fund_card.schema.json).
 *
 * ── Going live ─────────────────────────────────────────────────────────────
 *   1. Backend serves the two endpoints below on BACKEND_URL (port 3001).
 *   2. Set EXPO_PUBLIC_FUND_PICKS_SOURCE=mock only when sample data is wanted.
 *   Nothing else in the app changes.
 *
 *   POST /api/mf/recommendations  { profile: { persona_code, age, living, ... } }
 *       → the full response: { schema_version, as_of_date, user, funds[] }
 *
 *   POST /api/mf/fund-cards/{scheme_code}  { profile: { persona_code, age, living, ... } }
 *       → one `fund` object (same shape as funds[i]). Used when the user
 *         switches to an alternate or swaps one in from search, since
 *         alternates[] only carries a summary. personality_match must be
 *         scored for this persona.
 *
 *   Errors: any non-2xx; a JSON body of { error: "..." } is shown in dev logs.
 */
export const USE_MOCK = process.env.EXPO_PUBLIC_FUND_PICKS_SOURCE === 'mock';

const SUPPORTED_MAJOR = '1';

const LIVING_CODES = ['family', 'renting', 'own_emi'];

function optionalNumber(value) {
  if (value == null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function lossReaction(answers) {
  const crash = (answers ?? []).find((answer) => String(answer.tag).startsWith('Scenario 5'));
  const label = String(crash?.label ?? '').toLowerCase();
  if (label.includes('sell before')) return 'sell';
  if (label.includes('time to value')) return 'value_it';
  if (label.includes('buying opportunity')) return 'buy_more';
  if (label.includes('stick to the plan')) return 'stick_to_plan';
  return null;
}

async function getRecommendationProfile() {
  const phone = await AsyncStorage.getItem('user_phone');
  if (!phone) throw new Error('Please complete the questionnaire before viewing fund picks.');

  const snapshot = await getDoc(doc(db, 'gowealthy-questionaire', phone));
  const plan = snapshot.data();
  const personaCode = plan?.persona?.code;
  if (!personaCode) throw new Error('No GoPersona is saved for this user. Please complete the questionnaire.');
  const livingIndex = Number(plan?.living?.index ?? plan?.living);
  const living = LIVING_CODES[livingIndex];
  if (!Number.isFinite(Number(plan?.age)) || !living) {
    throw new Error('Age or living situation is missing. Please complete the questionnaire.');
  }

  return {
    persona_code: personaCode,
    age: Number(plan.age),
    living,
    monthly_amount: Number(plan.monthlyInvestment) || undefined,
    loss_reaction: lossReaction(plan.persona?.answers),
    emi_ratio_pct: optionalNumber(plan.emi_ratio_pct ?? plan.emiRatioPct),
    spouse_income: optionalBoolean(plan.spouse_income ?? plan.spouseIncome),
    dependents_non_earning: optionalNumber(
      plan.dependents_non_earning ?? plan.dependentsNonEarning,
    ),
    emergency_fund: plan.emergency_fund ?? plan.emergencyFund ?? undefined,
    health_insurance: optionalBoolean(plan.health_insurance ?? plan.healthInsurance),
    horizon_years: optionalNumber(plan.horizon_years ?? plan.horizonYears),
    h: Number(plan.persona?.scores?.h),
    c: Number(plan.persona?.scores?.c),
    o: Number(plan.persona?.scores?.o),
  };
}

async function getJson(path, options = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: { Accept: 'application/json', ...options.headers },
  });
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
  const profile = await getRecommendationProfile();
  return normalizeResponse(await getJson('/api/mf/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile }),
  }));
}

/**
 * Full card for one scheme — used by Switch and Swap in.
 * `hint` is the alternate's summary row plus its parent card; only the mock
 * uses it.
 */
export async function fetchFundCard(schemeCode, hint) {
  if (USE_MOCK) return mockCardFor(schemeCode, hint);
  const profile = await getRecommendationProfile();
  const fund = normalizeFund(
    await getJson(`/api/mf/fund-cards/${encodeURIComponent(schemeCode)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    }),
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
