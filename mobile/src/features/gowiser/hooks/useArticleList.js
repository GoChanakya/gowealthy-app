import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchPublishedArticles, fetchCompletedArticleIds } from '../api/articles';

export const FILTERS = { NEW: 'new', COMPLETED: 'completed' };

/**
 * Article list state: published articles (fetched once) split against the
 * user's completed ids (refreshed on focus, so finishing a story and coming
 * back moves it to the Completed tab).
 */
export function useArticleList() {
  const [articles, setArticles] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(FILTERS.NEW);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const fetched = await fetchPublishedArticles();
        if (!cancelled) setArticles(fetched);
      } catch (error) {
        console.error('[gowiser] failed to fetch articles:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshCompleted = useCallback(async () => {
    try {
      setCompletedIds(await fetchCompletedArticleIds());
    } catch (error) {
      console.error('[gowiser] failed to fetch completed articles:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshCompleted();
    }, [refreshCompleted])
  );

  const filteredArticles = useMemo(() => {
    const isCompleted = (a) => completedIds.includes(a.id);
    return activeFilter === FILTERS.COMPLETED
      ? articles.filter(isCompleted)
      : articles.filter((a) => !isCompleted(a));
  }, [articles, completedIds, activeFilter]);

  return { loading, activeFilter, setActiveFilter, filteredArticles };
}
