import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, FONT } from '../theme';

export default function EmptyState({ emoji, title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 64 },
  emoji: { fontSize: 38, marginBottom: 12 },
  title: { fontSize: 16, fontFamily: FONT.displaySemi, color: C.ink, marginBottom: 5 },
  subtitle: { fontSize: 12.5, fontFamily: FONT.body, color: C.muted },
});
