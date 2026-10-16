/**
 * Turns the numbers in a fund card into what the card says.
 *
 * Pure functions only — no React — so the rules (thresholds, honest momentum
 * wording, stress-test copy) can be checked in isolation and reused on web.
 */
import {
  monthsText, monthsBetween, rupees, pct, signedPct, monthShort, monthYear, monthYearShort,
} from './format';

/* ── Identity ────────────────────────────────────────────────────────────── */

/**
 * Plan / option words not already in the scheme name, e.g. name
 * "HSBC Midcap Fund" + plan "Direct - Growth" → ["Direct", "Growth"].
 * If the name already reads "… Direct Plan - Growth", nothing is repeated.
 */
export function planTags(fund) {
  if (!fund.plan) return [];
  const name = fund.name.toLowerCase();
  return fund.plan
    .split(/\s*[-–—·|,/]\s*/)
    .map((p) => p.replace(/\b(plan|option)\b/gi, '').replace(/\s+/g, ' ').trim())
    .filter((p) => p && !name.includes(p.toLowerCase()));
}

const squash = (s) => String(s ?? '')
  .toLowerCase()
  .replace(/\b(the|fund|plan|direct|regular|growth|idcw)\b/g, '')
  .replace(/[^a-z0-9]/g, '');

/**
 * The fund's personality name, or null when it would only repeat the fund
 * name (some backend rows fall back to the scheme name) or is a placeholder.
 */
export function personaTitle(fund) {
  const label = fund.persona?.label;
  const p = squash(label);
  const n = squash(fund.name);
  if (!p || p.includes(n) || n.includes(p) || label === 'Data-backed fund profile') return null;
  return label;
}

/* ── Returns ─────────────────────────────────────────────────────────────── */

/** { from: "₹10,000", to: "₹11,420", gained } or null when there's no 1y return. */
export function tenK(y1) {
  if (y1 == null) return null;
  return { from: rupees(10000), to: rupees(10000 * (1 + y1 / 100)), gained: y1 >= 0 };
}

/* ── Consistency ─────────────────────────────────────────────────────────── */

/** Thresholds are 8 and 6 of 12; scaled if the window is ever not 12 months. */
export function consistency(ba) {
  const win = ba.window_months;
  const beat = ba.months_beat;
  const high = Math.round((win * 8) / 12);
  const mid = Math.round((win * 6) / 12);
  const months = ba.monthly.slice(-win);
  return {
    beat,
    win,
    tone: beat >= high ? 'good' : beat >= mid ? 'mid' : 'low',
    label: beat >= high ? 'Very consistent' : beat >= mid ? 'Fairly consistent' : 'Mixed record',
    months,
    first: monthYearShort(months[0]?.month),
    last: monthYearShort(months[months.length - 1]?.month),
  };
}

/* ── SIP value ───────────────────────────────────────────────────────────── */

export function sip(s) {
  const growth = s.current_value - s.invested;
  const years = Math.round(s.installments / 12);
  const gained = growth >= 0;
  return {
    headline: `${rupees(s.monthly_amount)} every month for the last ${years} ${years === 1 ? 'year' : 'years'}`,
    started: s.start_date
      ? `Started ${monthYear(s.start_date)} · ${s.installments} monthly instalments`
      : `${s.installments} monthly instalments`,
    invested: rupees(s.invested),
    value: rupees(s.current_value),
    growth: `${gained ? '+' : '−'}${rupees(Math.abs(growth))}`,
    growthPct: s.invested > 0 ? signedPct((growth / s.invested) * 100) : null,
    gained,
    // Bar split. On a loss the bar shows what's left of the money put in.
    investedShare: gained ? s.invested / s.current_value : s.current_value / s.invested,
  };
}

/* ── Momentum ────────────────────────────────────────────────────────────── */

const SHOWN = 6;
const LOOKBACK = 3;

/**
 * Compares the latest rank with the one LOOKBACK snapshots earlier.
 * d = then − now, so a positive d means the fund moved up. A slip is always
 * called a slip.
 */
export function momentum(rm) {
  const all = rm?.snapshots ?? [];
  if (all.length === 0) return null;

  const points = all.slice(-SHOWN).map((s) => ({ ...s, month: monthShort(s.date) }));
  const now = all[all.length - 1];
  const caption = `Ranked by 6-month returns among ${now.total} similar funds. #1 is the best — higher on the chart means a better rank.`;

  if (all.length === 1) {
    return { tone: 'flat', tag: null, now, change: 'Not enough history to show a trend yet.', caption, points };
  }

  const then = all[Math.max(0, all.length - 1 - LOOKBACK)];
  const d = then.rank - now.rank;
  const ago = `${monthsText(monthsBetween(then.date, now.date) || 1)} ago`;

  let tone, change;
  if (d >= 2) {
    tone = 'up';
    change = `Up from #${then.rank} ${ago}`;
  } else if (d <= -2) {
    tone = 'down';
    change = `Down from #${then.rank} ${ago}`;
  } else {
    tone = 'flat';
    change = d === 0 ? `Same rank as ${ago}` : `Was #${then.rank} ${ago}`;
  }

  const tag = { up: 'Moving up', flat: 'Steady', down: 'Slipping' }[tone];
  return { tone, tag, now, change, caption, points };
}

/* ── Bounce-back ─────────────────────────────────────────────────────────── */

export function bounceBack(rec) {
  const t = rec.typical_months;
  const c = rec.category_typical_months;
  if (t == null) {
    return { headline: 'Not enough past market falls to measure how quickly it bounces back.', bars: null };
  }

  let tail = '';
  if (c != null) {
    if (t <= c - 1) tail = ' — faster than most similar funds';
    else if (t >= c + 1) tail = ' — a little slower than most similar funds';
    else tail = ' — about as quick as most similar funds';
  }
  const within = Math.round(t) <= 1 ? 'within about a month' : `within about ${monthsText(t)}`;
  const max = Math.max(t, c ?? 0) || 1;

  return {
    headline: `After past market falls, it usually recovered ${within}${tail}.`,
    bars: [
      { label: 'This fund', value: `~${Math.round(t)} mo`, share: t / max, highlight: true },
      ...(c != null ? [{ label: 'Similar funds', value: `~${Math.round(c)} mo`, share: c / max, highlight: false }] : []),
    ],
  };
}

/** Right-hand side of a stress-test row. Never blank, never a fake 0. */
export function stressRow(ev) {
  switch (ev.status) {
    case 'recovered':
      return {
        fell: `Fell ${pct(ev.fall_pct)}`,
        outcome: Math.round(ev.recovery_months) < 1 ? 'Recovered within a month' : `Recovered in ${monthsText(ev.recovery_months)}`,
        done: true,
      };
    case 'recovering':
      return { fell: `Fell ${pct(ev.fall_pct)}`, outcome: `${Math.round(ev.recovered_pct)}% recovered so far`, done: false };
    default:
      return { na: 'Fund launched after this event' };
  }
}
