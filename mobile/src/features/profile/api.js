import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { clearQuestionnaireCompleted } from '../onboarding/completion';

/**
 * Profile data spans two collections, a legacy split worth knowing about:
 *
 *   gowealthy-questionaire/{phone}    — name + the questionnaire blueprint
 *   questionnaire_submissions/{phone} — GoWiser XP, xpLedger, blogsRead
 *
 * Until those are consolidated, the profile reads both.
 */
const PLAN = 'gowealthy-questionaire';
const ENGAGEMENT = 'questionnaire_submissions';

const AUTH_KEYS = ['auth_token', 'user_phone', 'auth_timestamp', 'user_name'];

export async function fetchProfile() {
  const phone = await AsyncStorage.getItem('user_phone');
  if (!phone) return null;

  const [planSnap, engagementSnap] = await Promise.all([
    getDoc(doc(db, PLAN, phone)).catch(() => null),
    getDoc(doc(db, ENGAGEMENT, phone)).catch(() => null),
  ]);

  const plan = planSnap?.exists() ? planSnap.data() : {};
  const engagement = engagementSnap?.exists() ? engagementSnap.data() : {};

  return {
    phone,
    name: plan.name || (await AsyncStorage.getItem('user_name')) || 'Investor',
    personaCode: plan.persona?.code || null,
    completedAt: plan.completedAt?.toDate?.() || null,
    xpBalance: engagement.xp?.balance || 0,
    xpTotalEarned: engagement.xp?.totalEarned || 0,
  };
}

/** Clears the session so the boot gate sends the user back to auth. */
export async function logout() {
  await AsyncStorage.multiRemove(AUTH_KEYS);
  await clearQuestionnaireCompleted();
}

/**
 * Delete the user's data and sign them out.
 *
 * Caveat worth knowing: the Firestore client SDK cannot recursively delete
 * subcollections, so `xpLedger` and `blogsRead` documents survive this call and
 * are orphaned under a deleted parent. A Cloud Function (or the
 * firebase-admin recursiveDelete) is the correct fix before this is offered on
 * a Play Store listing, where full deletion is a hard requirement. Until then
 * the parent docs carry a `deleted` tombstone so they can be swept server-side.
 */
export async function deleteAccount() {
  const phone = await AsyncStorage.getItem('user_phone');

  if (phone) {
    await setDoc(
      doc(db, ENGAGEMENT, phone),
      { deleted: true, deletedAt: serverTimestamp() },
      { merge: true }
    ).catch((e) => console.error('[profile] tombstone failed:', e));

    await deleteDoc(doc(db, PLAN, phone)).catch((e) =>
      console.error('[profile] plan delete failed:', e)
    );
  }

  await logout();
}
