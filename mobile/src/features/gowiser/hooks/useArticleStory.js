import { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchArticle,
  hasCompletedArticle,
  incrementArticleViews,
  awardArticleXP,
} from '../api/articles';
import { buildSlides } from '../lib/slides';
import { celebrateXP } from '../../../components/XPCelebration';

/**
 * Loads an article, builds its slide deck, and owns the XP payout.
 *
 * XP is awarded when the reader reaches the final slide. `hasAwarded` prevents
 * repeated calls in this session; the shared Firestore transaction is the
 * authoritative cross-session and cross-device duplicate guard.
 */
export function useArticleStory(articleId) {
  const [article, setArticle] = useState(null);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [alreadyEarned, setAlreadyEarned] = useState(false);

  const hasAwarded = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (await hasCompletedArticle(articleId)) {
          if (cancelled) return;
          setAlreadyEarned(true);
          hasAwarded.current = true;
        }

        const data = await fetchArticle(articleId);
        if (cancelled || !data) return;

        setArticle(data);
        setSlides(buildSlides(data));

        // Fire-and-forget: a failed view bump shouldn't block the reader.
        incrementArticleViews(articleId).catch((e) =>
          console.error('[gowiser] view increment failed:', e)
        );
      } catch (error) {
        console.error('[gowiser] failed to fetch article:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  const awardXP = useCallback(async () => {
    if (hasAwarded.current || !article) return;
    hasAwarded.current = true;

    try {
      const awarded = await awardArticleXP({ articleId, xp: article.xp || 0 });
      if (awarded) {
        celebrateXP({
          eyebrow: 'READING REWARD',
          name: 'Article complete',
          xp: article.xp || 0,
        });
      }
    } catch (error) {
      hasAwarded.current = false;
      console.error('[gowiser] XP award failed:', error);
    }
  }, [article, articleId]);

  /** Move the deck, awarding XP the first time the last slide is reached. */
  const goToSlide = useCallback(
    (index) => {
      if (index < 0 || index >= slides.length) return;
      setCurrentSlide(index);
      if (index === slides.length - 1) awardXP();
    },
    [slides.length, awardXP]
  );

  return {
    article,
    slides,
    loading,
    currentSlide,
    goToSlide,
    alreadyEarned,
  };
}
