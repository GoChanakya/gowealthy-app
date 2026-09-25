import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { P, F, TABULAR, MIN_TOUCH } from '../theme';
import { signedPct } from '../lib/format';

/** Same-category alternates, opened from a card's Switch button. */
export default function SwitchPanel({ category, alternates, busy, onSwitch, onSearchAll }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Similar {category} funds</Text>

      {alternates.length === 0 && <Text style={styles.empty}>No similar funds to suggest yet.</Text>}

      {alternates.map((alt, i) => (
        <View key={alt.scheme_code} style={[styles.row, i > 0 && styles.rowBorder]}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.name} numberOfLines={1}>{alt.name}</Text>
            <Text style={styles.meta}>
              {alt.personality_match}% match · {signedPct(alt.returns_1y_pct)} in 1 yr
            </Text>
          </View>
          <Pressable
            onPress={() => onSwitch(alt)}
            disabled={busy}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }, busy && { opacity: 0.5 }]}
            accessibilityRole="button"
            accessibilityLabel={`Switch to ${alt.name}`}
          >
            <Text style={styles.btnText}>Switch</Text>
          </Pressable>
        </View>
      ))}

      {busy && <ActivityIndicator color={P.gold} style={{ marginTop: 8 }} />}

      <Pressable onPress={onSearchAll} style={styles.link} accessibilityRole="link">
        <Text style={styles.linkText}>Search all funds</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: P.panel, borderRadius: 20, padding: 16, marginTop: 12 },
  title: { fontFamily: F.bodySemi, fontSize: 13, color: P.textSoft, marginBottom: 4 },
  empty: { fontFamily: F.body, fontSize: 13, color: P.textDim, paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: P.divider },
  name: { fontFamily: F.bodySemi, fontSize: 14, color: P.text },
  meta: { fontFamily: F.body, fontSize: 12, color: P.textSecondary, marginTop: 2, ...TABULAR },
  btn: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(242,181,68,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontFamily: F.bodySemi, fontSize: 13, color: P.gold },
  link: { minHeight: MIN_TOUCH, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 2 },
  linkText: { fontFamily: F.bodySemi, fontSize: 13, color: P.goldPale, textDecorationLine: 'underline' },
});
