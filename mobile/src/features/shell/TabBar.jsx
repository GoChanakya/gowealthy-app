import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT } from '../../lib/ui-kit';

const BRAND_LOGO = require('../../../assets/images/logo.png');

export const SURFACE = { DASHBOARD: 'dashboard', GOWISER: 'gowiser', PROFILE: 'profile' };

/**
 * Bottom navigation: two tabs flanking a raised avatar.
 *
 *   [ GoWiser ]   ( avatar )   [ Funds 🔒 ]
 *
 * The dashboard is the base surface rather than a tab — tapping an active tab
 * drops back to it, which is why `onSelect` gets the tab key and the shell
 * decides whether that means "open" or "return home".
 */
export default function TabBar({ active, onSelect, onProfile, onLockedTab }) {
  const isGowiser = active === SURFACE.GOWISER;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.bar}>
        {/* warm glow bleeding up from behind the bar */}
        <LinearGradient
          colors={['rgba(255,106,26,0.10)', 'transparent']}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <Tab
          icon="◆"
          label="GoWiser"
          active={isGowiser}
          onPress={() => onSelect(SURFACE.GOWISER)}
        />

        <View style={styles.centerSpacer} />

        <Tab icon="◈" label="Funds" locked onPress={onLockedTab} />
      </View>

      <Pressable style={styles.brandBtn} onPress={onProfile} hitSlop={8}>
        <LinearGradient
          colors={active === SURFACE.PROFILE ? [C.o2, C.o] : [C.line2, C.surface]}
          style={styles.brandRing}
        >
          <View style={styles.brandInner}>
            <Image source={BRAND_LOGO} style={styles.brandLogo} resizeMode="contain" />
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function Tab({ icon, label, active, locked, onPress }) {
  const tint = locked ? C.faint : active ? C.o2 : C.muted;

  return (
    <Pressable style={styles.tab} onPress={onPress} hitSlop={6}>
      <Text style={[styles.icon, { color: tint }]}>{icon}</Text>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: tint }, active && styles.labelActive]}>{label}</Text>
        {locked && <Text style={styles.lock}>🔒</Text>}
      </View>
      {active && <View style={styles.activeDot} />}
    </Pressable>
  );
}

const BAR_HEIGHT = 62;
const AVATAR_SIZE = 54;

/** Bottom padding a scrolling surface needs so content clears the bar. */
export const TAB_BAR_CLEARANCE = BAR_HEIGHT + (Platform.OS === 'ios' ? 34 : 22) + 16;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },

  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BAR_HEIGHT,
    paddingBottom: 4,
    paddingHorizontal: 10,
    marginBottom: Platform.OS === 'ios' ? 26 : 14,
    marginHorizontal: 16,
    borderRadius: 26,
    backgroundColor: 'rgba(24,18,25,0.96)',
    borderWidth: 1,
    borderColor: C.line2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  centerSpacer: { width: AVATAR_SIZE + 16 },

  icon: { fontSize: 17, lineHeight: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  label: { fontSize: 10, fontFamily: FONT.bodyMed, letterSpacing: 0.4 },
  labelActive: { fontFamily: FONT.bodySemi },
  lock: { fontSize: 8 },

  activeDot: {
    position: 'absolute',
    bottom: -1,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.o,
  },

  /* Raised brand mark, centred over the bar — doubles as the profile button. */
  brandBtn: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: (Platform.OS === 'ios' ? 26 : 14) + BAR_HEIGHT / 2 - AVATAR_SIZE / 2,
  },
  brandRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.o,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  brandInner: {
    width: AVATAR_SIZE - 4,
    height: AVATAR_SIZE - 4,
    borderRadius: (AVATAR_SIZE - 4) / 2,
    // Matches the logo's own black plate, so `contain` letterboxing is invisible.
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandLogo: { width: '62%', height: '62%' },
});
