import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, FONT, gwStyles } from '../theme';
import { Embers } from '../../../lib/ui-kit';
import { LogoSpinner } from '../../../components/LogoLoader';

export default function LoadingState({ label = 'Stoking the forge…' }) {
  return (
    <View style={gwStyles.centered}>
      <Embers />
      <LogoSpinner />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: C.muted, marginTop: 14, fontSize: 13, fontFamily: FONT.body, letterSpacing: 0.3 },
});
