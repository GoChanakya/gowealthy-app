import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { P, F } from '../theme';

/** Small uppercase label that opens every section of an opened card. */
export function SectionLabel({ children }) {
  return <Text style={styles.label}>{children}</Text>;
}

/** Hairline between sections — the opened card has no boxed panels. */
export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

/** Headline sentence under a section label. */
export function Headline({ children, style }) {
  return <Text style={[styles.headline, style]}>{children}</Text>;
}

/** Thin 5px bar. `share` is 0–1. */
export function ThinBar({ share, color = P.gold, track = P.faint, height = 5, style }) {
  const w = `${Math.max(0, Math.min(1, share)) * 100}%`;
  return (
    <View style={[{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }, style]}>
      <View style={{ width: w, height: '100%', borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

export function Caption({ children, style }) {
  return <Text style={[styles.caption, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontFamily: F.bodySemi,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: P.textDim,
    marginBottom: 8,
  },
  divider: { height: 1, backgroundColor: P.divider, marginVertical: 20 },
  headline: { fontFamily: F.bodySemi, fontSize: 15, lineHeight: 21, color: P.text },
  caption: { fontFamily: F.body, fontSize: 12, lineHeight: 17, color: P.textDim, marginTop: 8 },
});
