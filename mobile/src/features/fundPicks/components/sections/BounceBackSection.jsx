import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { P, F, TABULAR, MIN_TOUCH } from '../../theme';
import { SectionHeader, Headline, ThinBar } from '../primitives';
import { bounceBack, stressRow } from '../../lib/insights';
import { shortDate } from '../../lib/format';
import { hapticSmall } from '../../../../lib/haptics';

export default function BounceBackSection({ fund, stressInitiallyOpen = false }) {
  const b = bounceBack(fund.recovery);
  const events = fund.recovery.events ?? [];
  const [stressOpen, setStressOpen] = useState(stressInitiallyOpen);

  const toggle = () => {
    hapticSmall();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStressOpen((v) => !v);
  };

  return (
    <View>
      <SectionHeader title="Recovery after market falls" />
      <Headline>{b.headline}</Headline>

      {b.bars && (
        <View style={styles.bars}>
          <Text style={styles.barsTitle}>Typical time to recover</Text>
          {b.bars.map((bar) => (
            <View key={bar.label} style={styles.barRow}>
              <Text style={[styles.barLabel, bar.highlight && { color: P.text }]}>{bar.label}</Text>
              <ThinBar
                share={bar.share}
                color={bar.highlight ? P.gold : P.textDim}
                style={{ flex: 1 }}
              />
              <Text style={[styles.barValue, { color: bar.highlight ? P.goldPale : P.textSecondary }]}>{bar.value}</Text>
            </View>
          ))}
          <Text style={styles.barsHint}>Shorter is better</Text>
        </View>
      )}

      {events.length > 0 && (
        <>
          <Pressable
            onPress={toggle}
            style={styles.stressToggle}
            accessibilityRole="button"
            accessibilityState={{ expanded: stressOpen }}
          >
            <Text style={styles.stressToggleText}>
              How it handled {events.length} past market crashes
            </Text>
            <ChevronDown
              size={16}
              color={P.textSecondary}
              strokeWidth={2}
              style={{ transform: [{ rotate: stressOpen ? '180deg' : '0deg' }] }}
            />
          </Pressable>

          {stressOpen && (
            <View style={styles.stressList}>
              {events.map((ev, i) => (
                <StressRow key={ev.event_code} ev={ev} first={i === 0} />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

function StressRow({ ev, first }) {
  const r = stressRow(ev);
  return (
    <View style={[styles.row, !first && styles.rowBorder]}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.evName}>{ev.name}</Text>
        <Text style={styles.evDates}>{shortDate(ev.start_date)} – {shortDate(ev.end_date)}</Text>
      </View>
      {r.na ? (
        <Text style={styles.na}>{r.na}</Text>
      ) : (
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.fell}>{r.fell}</Text>
          <Text style={[styles.outcome, { color: r.done ? P.gain : P.textSoft }]}>{r.outcome}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { backgroundColor: P.panel, borderRadius: 14, padding: 14, marginTop: 14, gap: 10 },
  barsTitle: { fontFamily: F.bodyMed, fontSize: 12, color: P.textSecondary },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 92, fontFamily: F.bodyMed, fontSize: 12.5, color: P.textSecondary },
  barValue: { width: 48, textAlign: 'right', fontFamily: F.bodySemi, fontSize: 12.5, ...TABULAR },
  barsHint: { fontFamily: F.body, fontSize: 11, color: P.textDim },

  stressToggle: {
    minHeight: MIN_TOUCH,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stressToggleText: { fontFamily: F.bodySemi, fontSize: 13.5, color: P.textSoft },
  stressList: { marginTop: 2 },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: P.divider },
  evName: { fontFamily: F.bodySemi, fontSize: 13.5, color: P.text },
  evDates: { fontFamily: F.body, fontSize: 11.5, color: P.textDim, marginTop: 2, ...TABULAR },
  fell: { fontFamily: F.bodySemi, fontSize: 13, color: P.loss, ...TABULAR },
  outcome: { fontFamily: F.bodyMed, fontSize: 12, marginTop: 2, ...TABULAR },
  na: { maxWidth: '45%', textAlign: 'right', fontFamily: F.body, fontSize: 12, lineHeight: 16, color: P.textDim },
});
