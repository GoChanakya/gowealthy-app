import React, { useEffect } from 'react';
import { View, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

import { C, gwStyles } from '../theme';
import { Embers, FadeInUp } from '../../../lib/ui-kit';
import { useArticleList, FILTERS } from '../hooks/useArticleList';
import ListHeader from '../components/ListHeader';
import FilterTabs from '../components/FilterTabs';
import ArticleCard from '../components/ArticleCard';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';

/** Stagger caps out so a long list doesn't animate in forever. */
const MAX_STAGGERED = 6;
const STAGGER_MS = 55;

const EMPTY = {
  [FILTERS.NEW]: { icon: 'BookOpen', title: 'No new stories', subtitle: 'Check back soon' },
  [FILTERS.COMPLETED]: {
    icon: 'Trophy',
    title: 'Nothing finished yet',
    subtitle: 'Read a story to earn XP',
  },
};

/**
 * GoWiser article list.
 *
 * Rendered as the standalone /(gowealthy)/gowiser route and, with
 * `hideHeader`, as the Learn tab inside (gowealthy)/index.jsx.
 */
export default function ArticleListScreen({ hideHeader = false }) {
  const router = useRouter();
  const { loading, activeFilter, setActiveFilter, filteredArticles } = useArticleList();

  useEffect(() => {
    if (__DEV__) {
      console.log('[GoWiser] Article list opened', {
        screenFile: 'src/features/gowiser/screens/ArticleListScreen.jsx',
        renderedFrom: hideHeader
          ? 'src/features/shell/AppShell.jsx'
          : 'app/(gowealthy)/gowiser/index.jsx',
      });
    }
  }, [hideHeader]);

  const openArticle = (article) => {
    if (__DEV__) {
      console.log(`[GoWiser] Opening article: ${article.title}`, {
        articleId: article.id,
        route: `/(gowealthy)/gowiser/${article.id}`,
        routeFile: 'app/(gowealthy)/gowiser/[articleId].jsx',
        screenFile: 'src/features/gowiser/screens/ArticleStoryScreen.jsx',
      });
    }
    router.push(`/(gowealthy)/gowiser/${article.id}`);
  };

  if (loading) return <LoadingState />;

  const empty = EMPTY[activeFilter];

  return (
    <View style={gwStyles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <Embers />

      <ListHeader showNav={!hideHeader} onBack={() => router.back()} />

      <FadeInUp delay={80}>
        <FilterTabs activeFilter={activeFilter} onChange={setActiveFilter} />
      </FadeInUp>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 2 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredArticles.length === 0 ? (
          <EmptyState {...empty} />
        ) : (
          filteredArticles.map((article, i) => (
            <ArticleCard
              key={article.id}
              article={article}
              delay={Math.min(i, MAX_STAGGERED) * STAGGER_MS}
              onPress={() => openArticle(article)}
            />
          ))
        )}
        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}
