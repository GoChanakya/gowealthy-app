import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { P, F, TABULAR } from '../../theme';
import { SectionLabel } from '../primitives';
import { sip } from '../../lib/insights';

export default function SipSection({ fund }) {
  const s = sip(fund.sip_3y);
  return (
    <View>
      <SectionLabel>{s.label}</SectionLabel>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{s.value}</Text>
        <Text style={styles.today}>today</Text>
      </View>

      {/* Two-colour bar: money put in, then growth (or what's left on a loss). */}
      <View style={styles.bar}>
        <View style={{ flex: s.investedShare, backgroundColor: s.gained ? P.textDim : P.loss }} />
        <View style={{ flex: 1 - s.investedShare, backgroundColor: s.gained ? P.gold : P.faint }} />
      </View>

      <View style={styles.legend}>
        <LegendItem color={s.gained ? P.textDim : P.loss} text={s.putIn} />
        <LegendItem color={s.gained ? P.gold : P.faint} text={s.growthText} textColor={s.gained ? P.gain : P.loss} />
      </View>
    </View>
  );
}

function LegendItem({ color, text, textColor = P.textSecondary }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  value: { fontFamily: F.display, fontSize: 30, color: P.gold, letterSpacing: -0.5, ...TABULAR },
  today: { fontFamily: F.body, fontSize: 14, color: P.textSecondary },
  bar: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 14, gap: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: F.bodyMed, fontSize: 12.5, ...TABULAR },
});
