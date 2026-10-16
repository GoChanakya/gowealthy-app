import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { P, F, TABULAR } from '../../theme';
import { SectionHeader } from '../primitives';
import { consistency } from '../../lib/insights';

const TONE = { good: 'good', mid: 'neutral', low: 'bad' };

export default function ConsistencySection({ fund }) {
  const c = consistency(fund.batting_average);
  return (
    <View>
      <SectionHeader title="Consistency" tag={c.label} tone={TONE[c.tone]} />

      <View style={styles.statRow}>
        <Text style={styles.stat}>
          {c.beat}<Text style={styles.statOf}>/{c.win}</Text>
        </Text>
        <Text style={styles.statText}>months it did better than similar funds</Text>
      </View>

      {/* One block per month, oldest → newest. */}
      <View
        style={styles.strip}
        accessible
        accessibilityLabel={`Beat similar funds in ${c.beat} of the last ${c.win} months`}
      >
        {c.months.map((m, i) => (
          <View key={m.month ?? i} style={[styles.block, { backgroundColor: m.beat ? P.gold : P.faint }]} />
        ))}
      </View>
      <View style={styles.ends}>
        <Text style={styles.endText}>{c.first}</Text>
        <Text style={styles.endText}>{c.last}</Text>
      </View>

      <View style={styles.legend}>
        <View style={[styles.swatch, { backgroundColor: P.gold }]} />
        <Text style={styles.legendText}>Beat similar funds</Text>
        <View style={[styles.swatch, { backgroundColor: P.faint, marginLeft: 14 }]} />
        <Text style={styles.legendText}>Fell behind</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stat: { fontFamily: F.display, fontSize: 30, lineHeight: 34, color: P.text, letterSpacing: -0.5, ...TABULAR },
  statOf: { fontFamily: F.displaySemi, fontSize: 18, color: P.textDim },
  statText: { flex: 1, fontFamily: F.body, fontSize: 14, lineHeight: 19, color: P.textSoft },

  strip: { flexDirection: 'row', gap: 4, marginTop: 14 },
  block: { flex: 1, height: 10, borderRadius: 3 },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  endText: { fontFamily: F.bodyMed, fontSize: 11, color: P.textDim, ...TABULAR },

  legend: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  swatch: { width: 8, height: 8, borderRadius: 2, marginRight: 6 },
  legendText: { fontFamily: F.body, fontSize: 12, color: P.textSecondary },
});
