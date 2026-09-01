import React, { useState, useCallback } from 'react';
import { View, StatusBar, StyleSheet, BackHandler } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { C } from '../../lib/ui-kit';
import { FEATURES } from '../../config/features';
import TabBar, { SURFACE } from './TabBar';
import ComingSoonSheet from './ComingSoonSheet';
import DashboardHome from '../../../app/(gowealthy)/dashboard/home';
import { ArticleListScreen } from '../gowiser';
import ProfileScreen from '../profile/ProfileScreen';

/**
 * The whole signed-in app: dashboard as the base surface, with GoWiser and
 * Profile swapped in over it and a persistent tab bar underneath.
 *
 * Surfaces are local state rather than routes because the dashboard isn't a
 * tab — it's what you fall back to. Hardware back therefore returns here
 * instead of leaving the app, which is what people expect from a home screen.
 */
export default function AppShell() {
  const router = useRouter();
  const [surface, setSurface] = useState(SURFACE.DASHBOARD);
  const [comingSoon, setComingSoon] = useState(false);

  const goHome = useCallback(() => setSurface(SURFACE.DASHBOARD), []);

  // Android back: step back to the dashboard before letting the OS exit.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (surface !== SURFACE.DASHBOARD) {
          goHome();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [surface, goHome])
  );

  /** Tapping the tab you're already on returns you to the dashboard. */
  const selectTab = (key) => setSurface((current) => (current === key ? SURFACE.DASHBOARD : key));

  const openFunds = () => {
    if (FEATURES.mutualFunds) router.push('/(gowealthy)/mf/onboarding/screen1');
    else setComingSoon(true);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={styles.surface}>
        {surface === SURFACE.DASHBOARD && <DashboardHome />}
        {surface === SURFACE.GOWISER && <ArticleListScreen hideHeader />}
        {surface === SURFACE.PROFILE && <ProfileScreen onBack={goHome} />}
      </View>

      <TabBar
        active={surface}
        onSelect={selectTab}
        onProfile={() => selectTab(SURFACE.PROFILE)}
        onLockedTab={openFunds}
      />

      <ComingSoonSheet visible={comingSoon} onClose={() => setComingSoon(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  surface: { flex: 1 },
});
