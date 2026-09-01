import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C, FONT, TOP_INSET, gwStyles } from '../theme';
import { FadeInUp, Eyebrow } from '../../../lib/ui-kit';

/**
 * Top chrome for the article list: back pill + step tag (standalone route only)
 * over the eyebrow/title/subtitle block every questionnaire section opens with.
 */
export default function ListHeader({ showNav, onBack }) {
  return (
    <>
      {showNav && (
        <View style={styles.nav}>
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={10}>
            <Text style={styles.backBtnText}>←</Text>
          </Pressable>
          <View style={[gwStyles.glassPill, styles.stepTag]}>
            <Text style={styles.stepTagText}>GoWiser</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
      )}

      <View style={[styles.head, !showNav && { paddingTop: 22 }]}>
        <FadeInUp>
          <Eyebrow>Financial IQ</Eyebrow>
          <Text style={styles.title}>Read. Learn. Earn.</Text>
          <Text style={styles.sub}>
            Stories that sharpen your instincts — every one you finish pays out{' '}
            <Text style={styles.subXP}>XP</Text> toward your portfolio.
          </Text>
        </FadeInUp>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: TOP_INSET,
    paddingHorizontal: 18,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { color: C.muted, fontSize: 17 },
  stepTag: { paddingHorizontal: 13, paddingVertical: 6 },
  stepTagText: {
    color: C.muted,
    fontSize: 10.5,
    fontFamily: FONT.bodySemi,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  head: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 26, paddingBottom: 18 },
  title: { ...gwStyles.h2, textAlign: 'center', marginBottom: 10 },
  sub: { ...gwStyles.body, textAlign: 'center', maxWidth: 420 },
  subXP: { color: C.gold, fontFamily: FONT.bodySemi },
});
