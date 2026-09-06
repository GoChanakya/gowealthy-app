// Shared badge definitions and trigger-specific metadata. The actual balance,
// ledger, duplicate protection, and verification live in xpLedger.js so badges
// and GoWiser articles use the same atomic award path.
import { serverTimestamp } from 'firebase/firestore';
import { celebrateXP } from '../components/XPCelebration';
import { awardXPOnce } from './xpLedger';

export const BADGES = {
  persona_done: {
    id: 'persona_done',
    name: 'Blueprint Unlocked',
    emoji: '🧭',
    description: 'Completed your GoPersona investment profile.',
    xp: 50,
  },
  kyc_complete: {
    id: 'kyc_complete',
    name: 'Vault Unlocked',
    emoji: '🔐',
    description: 'Completed mutual fund onboarding and activated your NSE account.',
    xp: 100,
  },
  first_investment: {
    id: 'first_investment',
    name: 'Seed Planted',
    emoji: '🌱',
    description: 'Made your first investment.',
    xp: 200,
  },
  first_gold_investment: {
    id: 'first_gold_investment',
    name: 'Midas Touch',
    emoji: '🥇',
    description: 'Invested in your first Gold fund.',
    xp: 50,
  },
  first_international_investment: {
    id: 'first_international_investment',
    name: 'Globetrotter',
    emoji: '🌍',
    description: 'Invested in your first international fund.',
    xp: 50,
  },
};

// Awards a badge (and its XP) exactly once per user. Safe to call every time
// the triggering event happens — the marker doc makes repeat calls a no-op.
export async function awardBadge(phone, badgeId, sourceId = null) {
  const badge = BADGES[badgeId];
  if (!badge || !phone) return { status: 'invalid', awarded: false, verified: false };

  try {
    const result = await awardXPOnce({
      phone,
      awardId: `badge_${badgeId}`,
      amount: badge.xp,
      source: 'badge',
      sourceId: badgeId,
      markerCollection: 'badges',
      markerId: badgeId,
      markerData: {
        badgeId,
        name: badge.name,
        emoji: badge.emoji,
        sourceId: sourceId || null,
        earnedAt: serverTimestamp(),
      },
    });

    console.log('[xpBadges] verification', {
      phone: `***${String(phone).slice(-4)}`,
      badgeId,
      status: result.status,
      verified: result.verified,
      balanceAfter: result.balanceAfter,
    });

    if (result.awarded) celebrateXP({ emoji: badge.emoji, name: badge.name, xp: badge.xp });

    return { ...result, badge };
  } catch (e) {
    console.error(`[xpBadges] award error for ${badgeId}:`, e);
    return { status: 'failed', awarded: false, verified: false, badge, error: e };
  }
}

// Dev-only visual preview — plays the exact same celebration awardBadge() would,
// but never touches Firestore, so it's safe to tap repeatedly while testing
// without writing fake XP/ledger entries for a real user.
export function previewXpCelebration(badgeId) {
  const badge = BADGES[badgeId] || Object.values(BADGES)[0];
  celebrateXP({ emoji: badge.emoji, name: badge.name, xp: badge.xp });
}

// NSE's scheme master has no category/asset-class field (see backend/nse-service
// server.js parseMasterDownload) — scheme_name text is the only signal available
// at purchase time, so gold/international detection is a name pattern match.
//
// Verified against the live tradeable catalogue (751 unique scheme names sampled
// via /api/nse/schemes, incl. targeted searches for every keyword below): "fof"
// and bare "s&p" were dropped after testing — "FOF" is now a common *domestic*
// fund-of-fund wrapper suffix (gold ETF-FOFs, multi-asset FOFs, arbitrage FOFs,
// even "ICICI PRUDENTIAL BHARAT 22 FOF"), and "S&P BSE ..." is a co-branded
// Indian index, not overseas exposure — both produced heavy false positives.
// With those removed, gold matches stayed at 103/103 correct and international
// matches went from 231 (mostly false positives) to 1 genuine hit (a US Treasury
// bond FOF). Most Indian AMCs' overseas categories have been closed to fresh
// purchases for years (RBI's industry-wide LRS cap), so real international
// funds are rare in the currently-purchasable set — recall is hard to test
// further until that reopens, but the terms below are the standard AMC naming
// tokens for the categories that do exist (US, China, Europe, Japan, EM, etc).
const GOLD_PATTERN = /\b(gold|silver)\b/i;
const INTL_PATTERN = /\b(overseas|international|global|nasdaq|hang seng|s&p 500|us treasury|us equity|emerging market|greater china|china|europe|japan|foreign|world)\b/i;

export function classifyFund(fundName = '') {
  const name = String(fundName || '');
  return {
    isGold: GOLD_PATTERN.test(name),
    isInternational: INTL_PATTERN.test(name),
  };
}
