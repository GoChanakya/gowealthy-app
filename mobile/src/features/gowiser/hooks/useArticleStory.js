import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import {
  fetchArticle,
  hasCompletedArticle,
  incrementArticleViews,
  awardArticleXP,
} from '../api/articles';
import { buildSlides } from '../lib/slides';

/**
 * Loads an article, builds its slide deck, and owns the XP payout.
 *
 * XP is awarded once, when the reader reaches the final slide — guarded by both
 * `alreadyEarned` (persisted) and `hasAwarded` (this session) so a back-and-
 * forward tap can't double-pay.
 */
export function useArticleStory(articleId) {
  const [article, setArticle] = useState(null);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [alreadyEarned, setAlreadyEarned] = useState(false);
  const [showXPAnimation, setShowXPAnimation] = useState(false);

  const hasAwarded = useRef(false);
  const xpScale = useRef(new Animated.Value(0)).current;

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

  const playXPAnimation = useCallback(() => {
    setShowXPAnimation(true);
    Animated.sequence([
      Animated.spring(xpScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(xpScale, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowXPAnimation(false));
  }, [xpScale]);

  const awardXP = useCallback(async () => {
    if (hasAwarded.current || !article) return;
    hasAwarded.current = true;

    try {
      await awardArticleXP({ articleId, xp: article.xp || 0 });
    } catch (error) {
      console.error('[gowiser] XP award failed:', error);
    }

    playXPAnimation();
  }, [article, articleId, playXPAnimation]);

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
    showXPAnimation,
    xpScale,
  };
}
