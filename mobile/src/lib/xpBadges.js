// Shared XP + badge award logic. Mirrors the pattern already used for Gowiser
// article reads (mobile/app/(gowealthy)/gowiser/[articleId].jsx `awardXP`):
// a per-badge marker doc under questionnaire_submissions/{phone}/badges/{badgeId}
// makes the award idempotent, an xpLedger entry keeps an audit trail, and
// xp.balance/xp.totalEarned on the root user doc stay in sync via increment().
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { celebrateXP } from '../components/XPCelebration';

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
    description: 'Your KYC is verified with NSE.',
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
  if (!badge || !phone) return { awarded: false };

  try {
    const markerRef = doc(db, 'questionnaire_submissions', phone, 'badges', badgeId);
    const markerSnap = await getDoc(markerRef);
    if (markerSnap.exists()) return { awarded: false, badge };

    const userRef = doc(db, 'questionnaire_submissions', phone);
    const userSnap = await getDoc(userRef);
    const currentBalance = userSnap.exists() ? (userSnap.data()?.xp?.balance || 0) : 0;

    const ledgerRef = collection(db, 'questionnaire_submissions', phone, 'xpLedger');
    const ledgerDoc = await addDoc(ledgerRef, {
      type: 'earn',
      amount: badge.xp,
      balanceBefore: currentBalance,
      balanceAfter: currentBalance + badge.xp,
      source: 'badge',
      sourceId: badgeId,
      createdAt: serverTimestamp(),
    });

    await setDoc(markerRef, {
      badgeId,
      name: badge.name,
      emoji: badge.emoji,
      xpEarned: badge.xp,
      sourceId: sourceId || null,
      ledgerRef: ledgerDoc.id,
      earnedAt: serverTimestamp(),
    });

    await updateDoc(userRef, {
      'xp.balance': increment(badge.xp),
      'xp.totalEarned': increment(badge.xp),
      'xp.lastUpdated': serverTimestamp(),
    });

    celebrateXP({ emoji: badge.emoji, name: badge.name, xp: badge.xp });

    return { awarded: true, badge };
  } catch (e) {
    console.error(`[xpBadges] award error for ${badgeId}:`, e);
    return { awarded: false, badge, error: e };
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
