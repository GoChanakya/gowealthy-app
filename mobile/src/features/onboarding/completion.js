import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

/**
 * Has this user finished questionnaire-v2?
 *
 * Firestore is the source of truth, but reading it on every cold start costs a
 * round-trip and fails offline — so completion is mirrored into AsyncStorage
 * when section5 saves. Boot trusts the local flag; a background re-check keeps
 * a fresh install (new phone, cleared data) honest.
 */

const LOCAL_KEY = 'questionnaire_v2_completed';
const COLLECTION = 'gowealthy-questionaire'; // NB: typo is baked into the live data

/** Called by section5 right after its Firestore write succeeds. */
export async function markQuestionnaireCompleted() {
  try {
    await AsyncStorage.setItem(LOCAL_KEY, 'true');
  } catch (e) {
    console.error('[onboarding] could not persist completion flag:', e);
  }
}

/** Cleared on logout / delete-account so the next user re-onboards. */
export async function clearQuestionnaireCompleted() {
  try {
    await AsyncStorage.removeItem(LOCAL_KEY);
  } catch (e) {
    console.error('[onboarding] could not clear completion flag:', e);
  }
}

/** Instant, offline-safe. Use this to decide where to send someone at boot. */
export async function readLocalCompletion() {
  try {
    return (await AsyncStorage.getItem(LOCAL_KEY)) === 'true';
  } catch {
    return false;
  }
}

/**
 * Authoritative check. Slower — only worth it when the local flag says "not
 * completed", since that's the case a reinstall gets wrong. Re-mirrors locally
 * on a hit. Returns null when the answer can't be determined (offline), so
 * callers can distinguish "definitely not done" from "couldn't tell".
 */
export async function verifyCompletionRemotely(phone) {
  if (!phone) return false;

  try {
    const snap = await getDoc(doc(db, COLLECTION, phone));
    const completed = snap.exists() && snap.data()?.questionnaire_completed === true;
    if (completed) await markQuestionnaireCompleted();
    return completed;
  } catch (e) {
    console.error('[onboarding] remote completion check failed:', e);
    return null;
  }
}
