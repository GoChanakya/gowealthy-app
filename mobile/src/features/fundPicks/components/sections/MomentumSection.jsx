import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { P, F, TABULAR } from '../../theme';
import { SectionLabel, Headline, Caption } from '../primitives';
import { momentum, chipTone, rankQuality } from '../../lib/insights';

const CHIP = 42;
const CHIP_NOW = 54;
const TREND_H = 30;

const TAG_COLORS = {
  up: { bg: 'rgba(242,181,68,0.14)', fg: P.gold },
  flat: { bg: 'rgba(255,255,255,0.06)', fg: P.textSoft },
  down: { bg: 'rgba(232,137,124,0.14)', fg: P.loss },
};

const CHIP_COLORS = {
  strong: { bg: P.gold, fg: P.onOrange },
  good: { bg: P.goldLight, fg: P.goldPale },
  neutral: { bg: 'rgba(255,255,255,0.06)', fg: P.textSoft },
};

export default function MomentumSection({ fund }) {
  const m = momentum(fund.rank_momentum);
  const [width, setWidth] = useState(0);

  if (!m) {
    return (
      <View>
        <SectionLabel>Momentum</SectionLabel>
        <Headline>Not enough ranking history yet.</Headline>
      </View>
    );
  }

  const { chips } = m;
  const last = chips.length - 1;
  const sizes = chips.map((_, i) => (i === last ? CHIP_NOW : CHIP));
  const centres = chipCentres(sizes, width);
  const trend = centres.map((x, i) => {
    const q = rankQuality(chips[i].rank, chips[i].total);
    return { x, y: 5 + (1 - q) * (TREND_H - 10) };
  });

  const tag = m.tag && TAG_COLORS[m.tone];
  return (
    <View>
      <SectionLabel>Momentum</SectionLabel>
      {tag && (
        <View style={[styles.tag, { backgroundColor: tag.bg }]}>
          <Text style={[styles.tagText, { color: tag.fg }]}>{m.tag}</Text>
        </View>
      )}
      <Headline>{m.headline}</Headline>

      <View
        style={[styles.chips, chips.length > 1 && { justifyContent: 'space-between' }]}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {chips.map((c, i) => {
          const size = sizes[i];
          const col = CHIP_COLORS[chipTone(c.rank, c.total)];
          const isNow = i === last;
          return (
            <View
              key={c.date}
              accessibilityLabel={`Rank ${c.rank} of ${c.total}`}
              style={[
                styles.chip,
                { width: size, height: size, borderRadius: size / 2, backgroundColor: col.bg },
                isNow && styles.chipNow,
              ]}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.chipText, { color: col.fg, fontSize: isNow ? 14 : 11.5 }]}
              >
                {c.rank}/{c.total}
              </Text>
            </View>
          );
        })}
      </View>

      {width > 0 && chips.length > 1 && (
        <Svg width={width} height={TREND_H} style={{ marginTop: 6 }}>
          <Polyline
            points={trend.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={P.gold}
            strokeOpacity={0.35}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <Circle cx={trend[last].x} cy={trend[last].y} r={3.5} fill={P.gold} />
        </Svg>
      )}

      {chips.length > 1 && (
        <View style={styles.ends}>
          <Text style={styles.endText}>{m.spanMonths} {m.spanMonths === 1 ? 'month' : 'months'} ago</Text>
          <Text style={styles.endText}>Now</Text>
        </View>
      )}
      <Caption>{m.caption}</Caption>
    </View>
  );
}

/** x-centre of each chip in a space-between row of the given width. */
function chipCentres(sizes, width) {
  if (sizes.length === 1) return [sizes[0] / 2];
  const gap = (width - sizes.reduce((a, b) => a + b, 0)) / (sizes.length - 1);
  let x = 0;
  return sizes.map((s) => {
    const c = x + s / 2;
    x += s + gap;
    return c;
  });
}

const styles = StyleSheet.create({
  tag: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  tagText: { fontFamily: F.bodySemi, fontSize: 12 },
  chips: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  chip: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  chipNow: {
    shadowColor: P.gold,
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  chipText: { fontFamily: F.bodyBold, ...TABULAR },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  endText: { fontFamily: F.bodyMed, fontSize: 11.5, color: P.textDim },
});
