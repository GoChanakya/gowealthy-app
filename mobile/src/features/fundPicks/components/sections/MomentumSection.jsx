import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { P, F, TABULAR } from '../../theme';
import { SectionHeader, Headline, Caption } from '../primitives';
import { momentum } from '../../lib/insights';

const CHART_H = 56;
const PAD_Y = 9;
const TAG_TONE = { up: 'good', flat: 'neutral', down: 'bad' };
const CHANGE_COLOR = { up: P.gain, flat: P.textSecondary, down: P.loss };

export default function MomentumSection({ fund }) {
  const m = momentum(fund.rank_momentum);
  const [width, setWidth] = useState(0);

  if (!m) {
    return (
      <View>
        <SectionHeader title="Rank among similar funds" />
        <Headline>Not enough ranking history yet.</Headline>
      </View>
    );
  }

  const { points } = m;
  const last = points.length - 1;
  const xy = chartPoints(points, width);

  return (
    <View>
      <SectionHeader title="Rank among similar funds" tag={m.tag} tone={TAG_TONE[m.tone]} />

      <View style={styles.statRow}>
        <Text style={styles.stat}>
          #{m.now.rank}<Text style={styles.statOf}> of {m.now.total}</Text>
        </Text>
        <Text style={[styles.change, { color: CHANGE_COLOR[m.tone] }]}>{m.change}</Text>
      </View>

      {points.length > 1 && (
        <View style={styles.chart}>
          <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: CHART_H }}>
            {width > 0 && (
              <Svg width={width} height={CHART_H}>
                {/* Top guide = best rank in view. */}
                <Line x1={0} x2={width} y1={PAD_Y} y2={PAD_Y} stroke={P.divider} strokeWidth={1} strokeDasharray="3 4" />
                <Line x1={0} x2={width} y1={CHART_H - PAD_Y} y2={CHART_H - PAD_Y} stroke={P.divider} strokeWidth={1} strokeDasharray="3 4" />
                <Polyline
                  points={xy.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={P.textDim}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
                {xy.map((p, i) => (i === last
                  ? <Circle key={i} cx={p.x} cy={p.y} r={4.5} fill={P.gold} />
                  : <Circle key={i} cx={p.x} cy={p.y} r={3} fill={P.card} stroke={P.textSecondary} strokeWidth={1.5} />))}
              </Svg>
            )}
          </View>

          {/* Month + rank under each point, so nothing has to be guessed from the line. */}
          <View style={styles.cols}>
            {points.map((p, i) => (
              <View key={p.date} style={styles.col} accessible accessibilityLabel={`${p.month}: rank ${p.rank} of ${p.total}`}>
                <Text style={[styles.colRank, i === last && styles.colRankNow]}>#{p.rank}</Text>
                <Text style={[styles.colMonth, i === last && styles.colMonthNow]}>{i === last ? 'Now' : p.month}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Caption>{m.caption}</Caption>
    </View>
  );
}

/** One point per column centre; best rank in view at the top. */
function chartPoints(points, width) {
  const n = points.length;
  const ranks = points.map((p) => p.rank);
  const best = Math.min(...ranks);
  const worst = Math.max(...ranks);
  const span = worst - best;
  return points.map((p, i) => ({
    x: ((i + 0.5) * width) / n,
    y: span === 0 ? CHART_H / 2 : PAD_Y + ((p.rank - best) / span) * (CHART_H - PAD_Y * 2),
  }));
}

const styles = StyleSheet.create({
  statRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 12, rowGap: 2 },
  stat: { fontFamily: F.display, fontSize: 30, lineHeight: 34, color: P.text, letterSpacing: -0.5, ...TABULAR },
  statOf: { fontFamily: F.displaySemi, fontSize: 16, color: P.textDim, letterSpacing: 0 },
  change: { fontFamily: F.bodySemi, fontSize: 13.5 },

  chart: { backgroundColor: P.panel, borderRadius: 14, paddingTop: 10, paddingBottom: 10, marginTop: 14 },
  cols: { flexDirection: 'row', marginTop: 6 },
  col: { flex: 1, alignItems: 'center' },
  colRank: { fontFamily: F.bodySemi, fontSize: 12.5, color: P.textSoft, ...TABULAR },
  colRankNow: { color: P.goldPale },
  colMonth: { fontFamily: F.body, fontSize: 11, color: P.textDim, marginTop: 2 },
  colMonthNow: { fontFamily: F.bodySemi, color: P.gold },
});
