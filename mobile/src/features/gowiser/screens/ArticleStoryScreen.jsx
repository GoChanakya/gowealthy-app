import React from 'react';
import { View, Text, StatusBar, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { C, FONT, gwStyles } from '../theme';
import { Embers } from '../../../lib/ui-kit';
import { useArticleStory } from '../hooks/useArticleStory';
import { useStoryTaps } from '../hooks/useStoryTaps';
import Slide from '../components/slides';
import { StoryTopBar, SlideCounter } from '../components/StoryChrome';
import XPCelebration from '../components/XPCelebration';
import LoadingState from '../components/LoadingState';
import PrimaryAction from '../components/PrimaryAction';

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
    showXPAnimation,
    xpScale,
  } = useArticleStory(articleId);

  const { onTouchStart, onTouchEnd, scrollHandlers, claimTap } = useStoryTaps({
    currentSlide,
    goToSlide,
  });

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
      <View style={gwStyles.screen} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <Embers />

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

        <SlideCounter current={currentSlide + 1} total={slides.length} />

        {showXPAnimation && <XPCelebration xp={article.xp} scale={xpScale} />}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  errorText: { color: C.ink, fontSize: 18, fontFamily: FONT.displaySemi, marginBottom: 22 },
});
