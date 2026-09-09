import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT, TOP_INSET, ICON, gwStyles } from '../theme';
import { Ico } from '../../../lib/icons';
import { hapticSmall } from '../../../lib/haptics';

/** Segmented story progress — the current segment burns brighter than the rest. */
function ProgressSegments({ total, currentSlide }) {
  return (
    <View style={styles.segments}>
      {Array.from({ length: total }).map((_, index) => (
        <View key={index} style={styles.segment}>
          {index <= currentSlide && (
            <LinearGradient
              colors={index === currentSlide ? [C.o, C.gold] : [C.oDeep, C.o]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          )}
        </View>
      ))}
    </View>
  );
}

/** Close button + progress + XP badge, pinned over the slide. */
export function StoryTopBar({ total, currentSlide, xp, onClose }) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={() => { hapticSmall(); onClose?.(); }} style={styles.closeBtn} hitSlop={10}>
        <Ico name="X" size={16} color={C.muted} />
      </Pressable>

      <ProgressSegments total={total} currentSlide={currentSlide} />

      <View style={[gwStyles.xpPill, styles.xpBadge]}>
        <Text style={[gwStyles.xpPillText, styles.xpBadgeText]}>{xp} XP</Text>
      </View>
    </View>
  );
}

/**
 * Standalone page counter, floating at the bottom.
 *
 * Used when the reader navigates by tapping the screen edges rather than with
 * StoryNavigation's buttons — that component carries its own counter inline.
 */
export function SlideCounter({ current, total }) {
  return (
    <View style={[gwStyles.glassPill, styles.floatingCounter]}>
      <Text style={styles.floatingCounterText}>
        {current} / {total}
      </Text>
    </View>
  );
}

export function StoryNavigation({
  currentSlide,
  total,
  onPrevious,
  onNext,
}) {
  const isFirst = currentSlide === 0;
  const isLast = currentSlide === total - 1;

  return (
    <View style={styles.navigation}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous page"
        disabled={isFirst}
        onPress={() => { hapticSmall(); onPrevious?.(); }}
        style={({ pressed }) => [
          styles.navigationButton,
          pressed && !isFirst && styles.navigationButtonPressed,
          isFirst && styles.navigationButtonDisabled,
        ]}
      >
        <Text style={[styles.navigationArrow, isFirst && styles.navigationTextDisabled]}>‹</Text>
        <Text style={[styles.navigationText, isFirst && styles.navigationTextDisabled]}>Previous</Text>
      </Pressable>

      <View style={styles.counter}>
        <Text style={styles.counterText}>{currentSlide + 1} / {total}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isLast ? 'Finish story' : 'Next page'}
        onPress={() => { hapticSmall(); onNext?.(); }}
        style={({ pressed }) => [
          styles.navigationButton,
          styles.nextButton,
          pressed && styles.nextButtonPressed,
        ]}
      >
        <Text style={styles.nextText}>{isLast ? 'Finish' : 'Next'}</Text>
        <Text style={styles.nextArrow}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: TOP_INSET + 2,
    paddingHorizontal: 16,
    paddingBottom: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.line2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: { color: C.muted, fontSize: 15, fontFamily: FONT.bodyMed },

  segments: { flex: 1, flexDirection: 'row', gap: 4, marginHorizontal: 12 },
  segment: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },

  xpBadge: { paddingHorizontal: 11, paddingVertical: 6 },
  xpBadgeText: { fontSize: 10.5 },

  navigation: {
    zIndex: 12,
    minHeight: 54,
    marginHorizontal: 18,
    marginBottom: Platform.OS === 'ios' ? 28 : 18,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24,18,25,0.96)',
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  navigationButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navigationButtonPressed: { backgroundColor: 'rgba(255,255,255,0.06)' },
  navigationButtonDisabled: { opacity: 0.35 },
  navigationText: { color: C.ink, fontSize: 12.5, fontFamily: FONT.bodySemi },
  navigationArrow: { color: C.o2, fontSize: 23, lineHeight: 24 },
  navigationTextDisabled: { color: C.muted },
  nextButton: {
    backgroundColor: 'rgba(255,106,26,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,143,60,0.42)',
  },
  nextButtonPressed: { backgroundColor: 'rgba(255,106,26,0.26)' },
  nextText: { color: C.o2, fontSize: 12.5, fontFamily: FONT.bodyBold },
  nextArrow: { color: C.o2, fontSize: 23, lineHeight: 24 },
  counter: {
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  counterText: { color: C.muted, fontSize: 11, fontFamily: FONT.bodySemi, letterSpacing: 1 },

  floatingCounter: {
    position: 'absolute',
    bottom: 38,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  floatingCounterText: {
    color: C.muted,
    fontSize: 11,
    fontFamily: FONT.bodySemi,
    letterSpacing: 1,
  },
});
