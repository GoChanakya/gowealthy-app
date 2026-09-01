import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { C, FONT, gwStyles } from '../theme';
import { Embers } from '../../../lib/ui-kit';

export default function LoadingState({ label = 'Stoking the forge…' }) {
  return (
    <View style={gwStyles.centered}>
      <Embers />
      <ActivityIndicator size="large" color={C.o} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: C.muted, marginTop: 14, fontSize: 13, fontFamily: FONT.body, letterSpacing: 0.3 },
});
