import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const USERS = 'questionnaire_submissions';

/**
 * Atomically awards XP once for one user/source pair.
 *
 * `awardId` is also the deterministic xpLedger document id. `markerCollection`
 * and `markerId` preserve the feature-specific read models (`badges` and
 * `blogsRead`) while the balance and ledger logic stays in one place.
 */
export async function awardXPOnce({
  phone,
  awardId,
  amount,
  source,
  sourceId,
  markerCollection,
  markerId,
  markerData = {},
}) {
  const numericAmount = Number(amount);
  const requiredIds = [phone, awardId, source, sourceId, markerCollection, markerId];

  if (
    requiredIds.some((value) => !String(value || '').trim())
    || !Number.isFinite(numericAmount)
    || numericAmount <= 0
  ) {
    return { status: 'invalid', awarded: false, verified: false };
  }

  const userRef = doc(db, USERS, String(phone));
  const ledgerRef = doc(db, USERS, String(phone), 'xpLedger', String(awardId));
  const markerRef = doc(
    db,
    USERS,
    String(phone),
    String(markerCollection),
    String(markerId)
  );

  const result = await runTransaction(db, async (transaction) => {
    const [userSnap, ledgerSnap, markerSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(ledgerRef),
      transaction.get(markerRef),
    ]);

    const currentBalance = Number(userSnap.data()?.xp?.balance || 0);
    const currentTotal = Number(userSnap.data()?.xp?.totalEarned || 0);
    if (!Number.isFinite(currentBalance) || !Number.isFinite(currentTotal)) {
      throw new Error('Stored XP values are invalid.');
    }

    // The feature marker also protects users who earned article XP before
    // deterministic ledger ids were introduced.
    if (ledgerSnap.exists() || markerSnap.exists()) {
      // Repair a missing feature marker without crediting XP a second time.
      if (!markerSnap.exists()) {
        transaction.set(markerRef, {
          ...markerData,
          xpEarned: numericAmount,
          ledgerRef: ledgerRef.id,
        });
      }

      return {
        status: 'already_awarded',
        awarded: false,
        balanceAfter: currentBalance,
        totalAfter: currentTotal,
      };
    }

    const balanceAfter = currentBalance + numericAmount;
    const totalAfter = currentTotal + numericAmount;

    transaction.set(ledgerRef, {
      type: 'earn',
      amount: numericAmount,
      balanceBefore: currentBalance,
      balanceAfter,
      source,
      sourceId,
      createdAt: serverTimestamp(),
    });
    transaction.set(markerRef, {
      ...markerData,
      xpEarned: numericAmount,
      ledgerRef: ledgerRef.id,
    });
    transaction.set(userRef, {
      xp: {
        balance: balanceAfter,
        totalEarned: totalAfter,
        lastUpdated: serverTimestamp(),
      },
    }, { merge: true });

    return { status: 'awarded', awarded: true, balanceAfter, totalAfter };
  });

  const [verifiedUser, verifiedLedger, verifiedMarker] = await Promise.all([
    getDoc(userRef),
    getDoc(ledgerRef),
    getDoc(markerRef),
  ]);
  const storedBalance = Number(verifiedUser.data()?.xp?.balance || 0);
  const storedTotal = Number(verifiedUser.data()?.xp?.totalEarned || 0);

  const verified = result.awarded
    ? verifiedLedger.exists()
      && verifiedMarker.exists()
      && Number(verifiedLedger.data()?.amount) === numericAmount
      && Number(verifiedMarker.data()?.xpEarned) === numericAmount
      && storedTotal >= result.totalAfter
    : verifiedLedger.exists() || verifiedMarker.exists();

  if (!verified) throw new Error('XP write could not be verified.');

  return {
    ...result,
    verified: true,
    balanceAfter: storedBalance,
    ledgerId: ledgerRef.id,
  };
}
