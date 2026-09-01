import React from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { C, FONT, RADIUS } from '../theme';

/** Full-bleed payout moment. `scale` drives both transform and opacity. */
export default function XPCelebration({ xp, scale }) {
  return (
    <Animated.View style={[styles.overlay, { transform: [{ scale }], opacity: scale }]}>
      <View style={styles.badge}>
        <Text style={styles.emoji}>🔥</Text>
        <Text style={styles.title}>+{xp} XP</Text>
        <Text style={styles.subtitle}>Keep the fire going</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(8,6,10,0.92)',
  },
  badge: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.line2,
    paddingHorizontal: 44,
    paddingVertical: 32,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    shadowColor: C.o,
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  emoji: { fontSize: 56, marginBottom: 14 },
  title: {
    fontSize: 36,
    fontFamily: FONT.display,
    color: C.gold,
    letterSpacing: -1.2,
    marginBottom: 6,
  },
  subtitle: { fontSize: 13, fontFamily: FONT.body, color: C.muted },
});
