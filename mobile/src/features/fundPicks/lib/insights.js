/**
 * Turns the numbers in a fund card into what the card says.
 *
 * Pure functions only — no React — so the rules (thresholds, honest momentum
 * wording, stress-test copy) can be checked in isolation and reused on web.
 */
import { ordinal, monthsText, monthsBetween, rupees, pct } from './format';

/* ── Returns ─────────────────────────────────────────────────────────────── */

/** "₹10,000 a year ago is ₹11,420 today", or null when there's no 1y return. */
export function tenKLine(y1) {
  if (y1 == null) return null;
  return `₹10,000 a year ago is ${rupees(10000 * (1 + y1 / 100))} today`;
}

/* ── Consistency ─────────────────────────────────────────────────────────── */

/** Thresholds are 8 and 6 of 12; scaled if the window is ever not 12 months. */
export function consistency(ba) {
  const win = ba.window_months;
  const beat = ba.months_beat;
  const high = Math.round((win * 8) / 12);
  const mid = Math.round((win * 6) / 12);
  const label = beat >= high ? 'Very consistent' : beat >= mid ? 'Fairly consistent' : 'Mixed record';
  return {
    headline: `Beat similar funds in ${beat} of the last ${win} months`,
    caption: `${label} · each dot is a month`,
    dots: ba.monthly.slice(-win).map((m) => m.beat),
  };
}

/* ── SIP value ───────────────────────────────────────────────────────────── */

export function sip(s) {
  const growth = s.current_value - s.invested;
  const years = Math.round(s.installments / 12);
  return {
    label: `${rupees(s.monthly_amount)} a month for ${years} ${years === 1 ? 'year' : 'years'}`,
    value: rupees(s.current_value),
    putIn: `${rupees(s.invested)} put in`,
    growthText: growth >= 0 ? `+${rupees(growth)} growth` : `${rupees(Math.abs(growth))} below what was put in`,
    gained: growth >= 0,
    // Bar split. On a loss the bar shows what's left of the money put in.
    investedShare: growth >= 0 ? s.invested / s.current_value : s.current_value / s.invested,
  };
}

/* ── Momentum ────────────────────────────────────────────────────────────── */

const SHOWN = 6;
const LOOKBACK = 3;

/** q = 1 − (rank−1)/(total−1): 1 is top of the category, 0 is bottom. */
export function rankQuality(rank, total) {
  if (total <= 1) return 1;
  return 1 - (rank - 1) / (total - 1);
}

export function chipTone(rank, total) {
  const q = rankQuality(rank, total);
  return q >= 0.85 ? 'strong' : q >= 0.6 ? 'good' : 'neutral';
}

/**
 * Compares the latest rank with the one LOOKBACK snapshots earlier.
 * d = then − now, so a positive d means the fund moved up. A slip is always
 * called a slip.
 */
export function momentum(rm) {
  const all = rm?.snapshots ?? [];
  if (all.length === 0) return null;

  const chips = all.slice(-SHOWN);
  const now = all[all.length - 1];
  const spanMonths = monthsBetween(chips[0].date, now.date);
  const caption = `Rank among ${now.total} similar funds by 6-month returns. 1st is best.`;

  if (all.length === 1) {
    return {
      tone: 'flat', tag: null, caption, chips, spanMonths,
      headline: `Ranked ${ordinal(now.rank)} among ${now.total} similar funds right now`,
    };
  }

  const then = all[Math.max(0, all.length - 1 - LOOKBACK)];
  const d = then.rank - now.rank;
  const m = monthsBetween(then.date, now.date) || 1;
  const among = `among ${now.total} similar funds`;

  let tone, headline;
  if (d >= 4) {
    tone = 'up';
    headline = `Jumped from ${ordinal(then.rank)} to ${ordinal(now.rank)} ${among} in ${monthsText(m)}`;
  } else if (d >= 2) {
    tone = 'up';
    headline = `Climbed from ${ordinal(then.rank)} to ${ordinal(now.rank)} ${among} in ${monthsText(m)}`;
  } else if (d <= -2) {
    tone = 'down';
    headline = `Slipped from ${ordinal(then.rank)} to ${ordinal(now.rank)} ${among} in ${monthsText(m)}`;
  } else {
    tone = 'flat';
    headline = `Held steady around ${ordinal(now.rank)} ${among} for ${monthsText(m)}`;
  }

  const tag = { up: '↑ Gaining ground', flat: '→ Holding steady', down: '↓ Losing ground lately' }[tone];
  return { tone, tag, headline, caption, chips, spanMonths };
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
    headline: `After past market falls, it usually bounced back ${within}${tail}`,
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
        main: Math.round(ev.recovery_months) < 1 ? 'Back within a month' : `Back in ${monthsText(ev.recovery_months)}`,
        sub: `Fell ${pct(ev.fall_pct)}`,
      };
    case 'recovering':
      return { main: `${Math.round(ev.recovered_pct)}% recovered`, sub: `Fell ${pct(ev.fall_pct)}` };
    default:
      return { main: null, sub: null, na: 'Not applicable — fund launched after this period' };
  }
}
