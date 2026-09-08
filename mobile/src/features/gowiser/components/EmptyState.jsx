import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, FONT } from '../theme';
import { Ico } from '../../../lib/icons';

export default function EmptyState({ icon, title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.mark}>
        <Ico name={icon} size={22} color={C.muted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 64 },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: C.line,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 16, fontFamily: FONT.displaySemi, color: C.ink, marginBottom: 5 },
  subtitle: { fontSize: 12.5, fontFamily: FONT.body, color: C.muted },
});
