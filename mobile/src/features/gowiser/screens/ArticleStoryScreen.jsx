import React, { useEffect } from 'react';
import { View, Text, StatusBar, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { C, FONT, gwStyles } from '../theme';
import { Embers } from '../../../lib/ui-kit';
import { useArticleStory } from '../hooks/useArticleStory';
import { useStoryTaps } from '../hooks/useStoryTaps';
import Slide from '../components/slides';
import { SlideCounter, StoryTopBar } from '../components/StoryChrome';
import LoadingState from '../components/LoadingState';
import PrimaryAction from '../components/PrimaryAction';
import TapArrow from '../components/TapArrow';

const SLIDE_RENDERER_FILES = {
  intro: 'src/features/gowiser/components/slides/IntroSlide.jsx',
  content: 'src/features/gowiser/components/slides/ContentSlide.jsx',
  social: 'src/features/gowiser/components/slides/SocialSlide.jsx',
  mcq: 'src/features/gowiser/components/slides/McqSlide.jsx',
  end: 'src/features/gowiser/components/slides/EndSlide.jsx',
};

/** Story-style article reader: tap left/right to page through the deck. */
export default function ArticleStoryScreen() {
  const router = useRouter();
  const { articleId } = useLocalSearchParams();

  const {
    article,
    slides,
    loading,
    currentSlide,
    goToSlide,
    alreadyEarned,
  } = useArticleStory(articleId);

  const { onTouchStart, onTouchEnd, scrollHandlers, claimTap } = useStoryTaps({
    currentSlide,
    totalSlides: slides.length,
    goToSlide,
  });

  useEffect(() => {
    const activeSlide = slides[currentSlide];
    if (!__DEV__ || loading || !activeSlide) return;

    console.log(
      `[GoWiser] Page ${currentSlide + 1}/${slides.length} -> ${activeSlide.type}`,
      {
        articleId,
        articleTitle: article?.title,
        routeFile: 'app/(gowealthy)/gowiser/[articleId].jsx',
        screenFile: 'src/features/gowiser/screens/ArticleStoryScreen.jsx',
        slideRouterFile: 'src/features/gowiser/components/slides/index.jsx',
        visiblePageFile: SLIDE_RENDERER_FILES[activeSlide.type] || 'unknown',
      }
    );
  }, [article?.title, articleId, currentSlide, loading, slides]);

  if (loading) return <LoadingState />;

  if (!article || slides.length === 0) {
    return (
      <View style={gwStyles.centered}>
        <Embers />
        <Text style={styles.errorText}>Story not found</Text>
        <PrimaryAction label="Go back" onPress={() => router.back()} style={{ maxWidth: 200 }} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={gwStyles.screen}>
        <Embers />

        <View style={styles.storyViewport} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <StoryTopBar
            total={slides.length}
            currentSlide={currentSlide}
            xp={article.xp}
            onClose={() => router.back()}
          />

          <Slide
            slide={slides[currentSlide]}
            scrollHandlers={scrollHandlers}
            onOptionTap={claimTap}
            alreadyEarned={alreadyEarned}
            onDone={() => router.back()}
          />
        </View>

        <SlideCounter current={currentSlide + 1} total={slides.length} />

        <TapArrow visible={currentSlide === 0} />

      </View>
    </>
  );
}

const styles = StyleSheet.create({
  storyViewport: { flex: 1 },
  errorText: { color: C.ink, fontSize: 18, fontFamily: FONT.displaySemi, marginBottom: 22 },
});
