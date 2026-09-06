import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../config/firebase';
import { awardXPOnce } from '../../../lib/xpLedger';

/**
 * Every Firestore read/write for GoWiser lives here, so screens and hooks never
 * hard-code collection paths.
 *
 *   products/gowiser/articles/{articleId}
 *   questionnaire_submissions/{phone}/blogsRead/{articleId}
 *   questionnaire_submissions/{phone}/xpLedger/blog_read_{articleId}
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
 * Awards an article's XP exactly once. The shared transaction creates the
 * deterministic ledger record, completion marker, and balance update together.
 * Returns true only when this call performed the award.
 */
export async function awardArticleXP({ articleId, xp = 0 }) {
  const phone = await getCurrentPhone();
  if (!phone) return false;

  const result = await awardXPOnce({
    phone,
    awardId: `blog_read_${articleId}`,
    amount: xp,
    source: 'blog_read',
    sourceId: articleId,
    markerCollection: 'blogsRead',
    markerId: articleId,
    markerData: {
      completedAt: serverTimestamp(),
      completed: true,
    },
  });

  return result.awarded;
}
