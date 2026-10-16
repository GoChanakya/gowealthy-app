import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { P, F } from '../../theme';
import { SectionHeader } from '../primitives';
import { personaTitle } from '../../lib/insights';

/**
 * The match % already sits on the card's header, so it isn't repeated here.
 * This section answers "why" — the fund's character and the match reasons.
 */
export default function PersonalitySection({ fund }) {
  const title = personaTitle(fund);
  const band = fund.personality_match.band?.label;
  const reasons = fund.personality_match.reasons ?? [];

  return (
    <View>
      <SectionHeader title="Why it fits you" tag={band} tone="accent" />
      {title && <Text style={styles.persona}>{title}</Text>}
      {!!fund.persona.description && (
        <Text style={[styles.desc, !title && { marginTop: 0 }]}>{fund.persona.description}</Text>
      )}

      {reasons.length > 0 && (
        <View style={styles.reasons}>
          {reasons.map((r) => (
            <View key={r.code ?? r.text} style={styles.reason}>
              <View style={styles.bullet} />
              <Text style={styles.reasonText}>{r.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  persona: { fontFamily: F.displaySemi, fontSize: 17, lineHeight: 22, color: P.text, letterSpacing: -0.2 },
  desc: { fontFamily: F.body, fontSize: 14, lineHeight: 20, color: P.textSoft, marginTop: 6 },
  reasons: { marginTop: 14, gap: 10 },
  reason: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  // Neutral bullet, not a tick: reasons can be cautions as well as positives.
  bullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: P.gold, marginTop: 7 },
  reasonText: { flex: 1, fontFamily: F.body, fontSize: 13.5, lineHeight: 19, color: P.textSoft },
});
