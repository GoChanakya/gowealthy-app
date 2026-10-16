import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { P, F, TABULAR } from '../../theme';
import { SectionHeader, Caption } from '../primitives';
import { sip } from '../../lib/insights';

export default function SipSection({ fund }) {
  const s = sip(fund.sip_3y);
  const growthColor = s.gained ? P.gain : P.loss;

  return (
    <View>
      <SectionHeader title="If you had started a SIP" />
      <Text style={styles.lead}>
        Investing <Text style={styles.leadStrong}>{s.headline}</Text> in this fund would look like this today:
      </Text>

      {/* Bar: money put in, then growth (or what's left of it on a loss). */}
      <View style={styles.bar}>
        <View style={{ flex: s.investedShare, backgroundColor: s.gained ? P.textDim : P.loss }} />
        <View style={{ flex: 1 - s.investedShare, backgroundColor: s.gained ? P.gain : P.faint }} />
      </View>

      <View style={styles.rows}>
        <Row swatch={s.gained ? P.textDim : P.loss} label="You would have invested" value={s.invested} />
        <Row swatch={s.gained ? P.gain : P.faint} label={s.gained ? 'Gain' : 'Loss'} value={s.growth}
          extra={s.growthPct} color={growthColor} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Value today</Text>
          <Text style={styles.totalValue}>{s.value}</Text>
        </View>
      </View>

      <Caption>{s.started}</Caption>
    </View>
  );
}

function Row({ swatch, label, value, extra, color = P.text }) {
  return (
    <View style={styles.row}>
      <View style={[styles.swatch, { backgroundColor: swatch }]} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, { color }]}>
        {value}{extra ? <Text style={styles.rowExtra}>  {extra}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: F.body, fontSize: 14, lineHeight: 20, color: P.textSoft },
  leadStrong: { fontFamily: F.bodySemi, color: P.text },

  bar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 14, gap: 2 },

  rows: { marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  swatch: { width: 8, height: 8, borderRadius: 2, marginRight: 10 },
  rowLabel: { flex: 1, fontFamily: F.body, fontSize: 13.5, color: P.textSecondary },
  rowValue: { fontFamily: F.bodySemi, fontSize: 14, ...TABULAR },
  rowExtra: { fontFamily: F.bodyMed, fontSize: 12.5 },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: P.divider,
    marginTop: 6,
    paddingTop: 12,
  },
  totalLabel: { fontFamily: F.bodySemi, fontSize: 14, color: P.text },
  totalValue: { fontFamily: F.display, fontSize: 24, color: P.text, letterSpacing: -0.4, ...TABULAR },
});
