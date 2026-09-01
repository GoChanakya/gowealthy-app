import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../config/firebase';

/**
 * Every Firestore read/write for GoWiser lives here, so screens and hooks never
 * hard-code collection paths.
 *
 *   products/gowiser/articles/{articleId}
 *   questionnaire_submissions/{phone}/blogsRead/{articleId}
 *   questionnaire_submissions/{phone}/xpLedger/{autoId}
 */

const ARTICLES_PATH = ['products', 'gowiser', 'articles'];
const USERS = 'questionnaire_submissions';

const articlesRef = () => collection(db, ...ARTICLES_PATH);
const articleRef = (articleId) => doc(db, ...ARTICLES_PATH, articleId);

export const getCurrentPhone = () => AsyncStorage.getItem('user_phone');

/** Published articles, newest first. */
export async function fetchPublishedArticles() {
  const snapshot = await getDocs(query(articlesRef(), where('published', '==', true)));

  const articles = [];
  snapshot.forEach((d) => articles.push({ id: d.id, ...d.data() }));

  return articles.sort((a, b) => {
    const dateA = a.publishedAt?.toDate?.() || new Date(0);
    const dateB = b.publishedAt?.toDate?.() || new Date(0);
    return dateB - dateA;
  });
}

export async function fetchArticle(articleId) {
  const snap = await getDoc(articleRef(articleId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Ids of articles this user has finished. Empty when signed out. */
export async function fetchCompletedArticleIds() {
  const phone = await getCurrentPhone();
  if (!phone) return [];

  const snap = await getDocs(collection(db, USERS, phone, 'blogsRead'));
  const ids = [];
  snap.forEach((d) => ids.push(d.id));
  return ids;
}

export async function hasCompletedArticle(articleId) {
  const phone = await getCurrentPhone();
  if (!phone) return false;

  const snap = await getDoc(doc(db, USERS, phone, 'blogsRead', articleId));
  return snap.exists();
}

export function incrementArticleViews(articleId) {
  return updateDoc(articleRef(articleId), { views: increment(1) });
}

/**
 * Pay out an article's XP: append a ledger entry, mark the article read, and
 * bump the user's balance. Callers must guard against double-award — see
 * `hasCompletedArticle`. Returns false when there's no signed-in user.
 */
export async function awardArticleXP({ articleId, xp = 0 }) {
  const phone = await getCurrentPhone();
  if (!phone) return false;

  const userRef = doc(db, USERS, phone);
  const userSnap = await getDoc(userRef);
  const balanceBefore = userSnap.exists() ? userSnap.data()?.xp?.balance || 0 : 0;

  const ledgerDoc = await addDoc(collection(db, USERS, phone, 'xpLedger'), {
    type: 'earn',
    amount: xp,
    balanceBefore,
    balanceAfter: balanceBefore + xp,
    source: 'blog_read',
    sourceId: articleId,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, USERS, phone, 'blogsRead', articleId), {
    completedAt: serverTimestamp(),
    xpEarned: xp,
    ledgerRef: ledgerDoc.id,
    completed: true,
  });

  await updateDoc(userRef, {
    'xp.balance': increment(xp),
    'xp.totalEarned': increment(xp),
    'xp.lastUpdated': serverTimestamp(),
  });

  return true;
}
