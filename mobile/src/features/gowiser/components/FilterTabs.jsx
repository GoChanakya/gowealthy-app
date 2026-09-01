import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT, RADIUS } from '../theme';
import { FILTERS } from '../hooks/useArticleList';

const TABS = [
  { key: FILTERS.NEW, label: 'New Stories' },
  { key: FILTERS.COMPLETED, label: 'Completed' },
];

/** Segmented New/Completed switch — ember wash + orange underline on the active tab. */
export default function FilterTabs({ activeFilter, onChange }) {
  return (
    <View style={styles.row}>
      {TABS.map((tab) => {
        const active = activeFilter === tab.key;
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => onChange(tab.key)}>
            {active && (
              <LinearGradient
                colors={['rgba(255,106,26,0.20)', 'rgba(255,106,26,0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            )}
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            {active && <View style={styles.underline} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginBottom: 18,
    backgroundColor: C.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: C.line,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: '22%',
    right: '22%',
    height: 2,
    backgroundColor: C.o,
    borderRadius: 2,
  },
  label: { fontSize: 12.5, fontFamily: FONT.bodyMed, color: C.muted, letterSpacing: 0.2 },
  labelActive: { color: C.o2, fontFamily: FONT.bodySemi },
});
