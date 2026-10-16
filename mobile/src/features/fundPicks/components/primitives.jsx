import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { P, F } from '../theme';

const TONES = {
  accent: { bg: P.goldLight, fg: P.goldPale },
  good: { bg: P.gainSoft, fg: P.gain },
  bad: { bg: P.lossSoft, fg: P.loss },
  neutral: { bg: 'rgba(255,255,255,0.05)', fg: P.textSoft },
};

/** Small rounded label: plan type, "Moving up", "Very consistent". */
export function Tag({ children, tone = 'neutral', style }) {
  const t = TONES[tone] ?? TONES.neutral;
  return (
    <View style={[styles.tag, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.tagText, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

/** Uppercase section title with an optional status tag on the right. */
export function SectionHeader({ title, tag, tone }) {
  return (
    <View style={styles.header}>
      <Text style={styles.label}>{title}</Text>
      {tag ? <Tag tone={tone}>{tag}</Tag> : null}
    </View>
  );
}

/** Kept for sections that only need the label. */
export function SectionLabel({ children }) {
  return <SectionHeader title={children} />;
}

/** Hairline between sections — the opened card has no boxed panels. */
export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

/** Headline sentence under a section label. */
export function Headline({ children, style }) {
  return <Text style={[styles.headline, style]}>{children}</Text>;
}

/** Thin bar. `share` is 0–1. */
export function ThinBar({ share, color = P.gold, track = P.faint, height = 6, style }) {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24,
    marginBottom: 10,
  },
  label: {
    fontFamily: F.bodySemi,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: P.textDim,
  },
  tag: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  tagText: { fontFamily: F.bodySemi, fontSize: 11.5 },
  divider: { height: 1, backgroundColor: P.divider, marginVertical: 20 },
  headline: { fontFamily: F.bodySemi, fontSize: 15, lineHeight: 21, color: P.text },
  caption: { fontFamily: F.body, fontSize: 12, lineHeight: 17, color: P.textDim, marginTop: 10 },
});
