import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, FONT } from '../../theme';
import PrimaryAction from '../PrimaryAction';

export default function EndSlide({ content, alreadyEarned, onDone }) {
  return (
    <View style={styles.slide}>
      <View style={styles.inner}>
        <Text style={styles.emoji}>🔥</Text>
        <Text style={styles.eyebrow}>Forged</Text>
        <Text style={styles.title}>Story complete</Text>

        {alreadyEarned ? (
          <View style={styles.earnedBadge}>
            <Text style={styles.earnedText}>✓ XP already earned</Text>
          </View>
        ) : (
          <Text style={styles.subtitle}>+{content.xp} XP added to your balance</Text>
        )}

        {content.tags.length > 0 && (
          <View style={styles.tags}>
            {content.tags.map((tag, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <PrimaryAction label="Back to stories" onPress={onDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { flex: 1, paddingTop: 100 },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 100,
  },

  emoji: { fontSize: 64, marginBottom: 20 },
  eyebrow: {
    color: C.o2,
    fontSize: 11,
    fontFamily: FONT.bodySemi,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontFamily: FONT.display,
    color: C.ink,
    letterSpacing: -1,
    marginBottom: 10,
  },
  subtitle: { fontSize: 14.5, fontFamily: FONT.bodyMed, color: C.gold, marginBottom: 30 },

  earnedBadge: {
    backgroundColor: 'rgba(79,211,154,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(79,211,154,0.45)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 30,
  },
  earnedText: { fontSize: 12.5, fontFamily: FONT.bodySemi, color: C.gd },

  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 30,
    justifyContent: 'center',
  },
  tag: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  tagText: { fontSize: 11.5, fontFamily: FONT.bodyMed, color: C.muted },
});
