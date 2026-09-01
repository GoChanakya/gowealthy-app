import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT, RADIUS, gwStyles } from '../theme';

/**
 * Gradient CTA. Mirrors ui-kit's PrimaryButton, but takes a Pressable child
 * layout rather than the kit's fixed max-width block so it can sit in slides.
 */
export default function PrimaryAction({ label, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[{ width: '100%', maxWidth: 420 }, style]}>
      {({ pressed }) => (
        <LinearGradient
          colors={[C.o2, C.o]}
          style={[styles.btn, gwStyles.emberGlow, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.label}>{label}</Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: '#1a0d04', fontSize: 15.5, fontFamily: FONT.bodySemi },
});
