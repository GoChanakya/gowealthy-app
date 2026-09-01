import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT, TOP_INSET, gwStyles } from '../theme';

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
      <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      <ProgressSegments total={total} currentSlide={currentSlide} />

      <View style={[gwStyles.xpPill, styles.xpBadge]}>
        <Text style={[gwStyles.xpPillText, styles.xpBadgeText]}>{xp} XP</Text>
      </View>
    </View>
  );
}

export function SlideCounter({ current, total }) {
  return (
    <View style={[gwStyles.glassPill, styles.counter]}>
      <Text style={styles.counterText}>
        {current} / {total}
      </Text>
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

  counter: {
    position: 'absolute',
    bottom: 38,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  counterText: { color: C.muted, fontSize: 11, fontFamily: FONT.bodySemi, letterSpacing: 1 },
});
