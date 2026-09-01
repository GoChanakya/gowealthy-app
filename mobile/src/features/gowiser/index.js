/**
 * GoWiser — the in-app article/story feature.
 *
 *   api/        Firestore reads + the XP payout
 *   lib/        pure helpers (CMS HTML parsing, slide deck assembly)
 *   hooks/      list state, story state, tap navigation, quiz answers
 *   components/ presentational pieces, incl. one file per slide type
 *   screens/    composition — the two things routes actually render
 *
 * Routes under app/(gowealthy)/gowiser/ are thin wrappers over these screens.
 */
export { default as ArticleListScreen } from './screens/ArticleListScreen';
export { default as ArticleStoryScreen } from './screens/ArticleStoryScreen';
