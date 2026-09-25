import React from 'react';
import { View, StyleSheet } from 'react-native';
import { P } from '../../theme';
import { SectionLabel, Headline, Caption } from '../primitives';
import { consistency } from '../../lib/insights';

export default function ConsistencySection({ fund }) {
  const c = consistency(fund.batting_average);
  return (
    <View>
      <SectionLabel>Consistency</SectionLabel>
      <Headline>{c.headline}</Headline>
      <View
        style={styles.dots}
        accessible
        accessibilityLabel={`${c.dots.filter(Boolean).length} of ${c.dots.length} months beat similar funds`}
      >
        {c.dots.map((beat, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: beat ? P.gold : P.faint }]} />
        ))}
      </View>
      <Caption>{c.caption}</Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  dot: { width: 14, height: 14, borderRadius: 7 },
});
