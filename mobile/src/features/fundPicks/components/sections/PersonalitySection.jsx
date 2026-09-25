import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { P, F, TABULAR } from '../../theme';
import { SectionLabel, ThinBar } from '../primitives';

export default function PersonalitySection({ fund }) {
  const score = fund.personality_match.score;
  return (
    <View>
      <SectionLabel>Personality</SectionLabel>
      <Text style={styles.persona}>{fund.persona.label}</Text>
      <Text style={styles.desc}>{fund.persona.description}</Text>
      <ThinBar share={score / 100} style={{ marginTop: 14 }} />
      <Text style={styles.barLabel}>{score}% Personality Match</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  persona: { fontFamily: F.display, fontSize: 22, color: P.gold, letterSpacing: -0.3 },
  desc: { fontFamily: F.body, fontSize: 14, lineHeight: 20, color: P.textSoft, marginTop: 6 },
  barLabel: { fontFamily: F.bodyMed, fontSize: 12, color: P.textSecondary, marginTop: 8, ...TABULAR },
});
