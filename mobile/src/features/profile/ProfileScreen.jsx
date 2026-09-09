import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Alert,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

import { C, FONT, RADIUS, Embers, Eyebrow, FadeInUp } from '../../lib/ui-kit';
import { FEATURES } from '../../config/features';
import { TAB_BAR_CLEARANCE } from '../shell/TabBar';
import { fetchProfile, logout, deleteAccount } from './api';
import { hapticError, hapticSmall, hapticWarning } from '../../lib/haptics';
import LogoLoader from '../../components/LogoLoader';

const AVATAR = require('../../../assets/images/profile/profileUser.png');

/** Parked flows, reachable only in a full (local) build. */
const DEV_ROUTES = [
  { label: 'GoShares', route: '/(gowealthy)/goshares' },
  { label: 'Mutual funds', route: '/(gowealthy)/mf/onboarding/screen1' },
  { label: 'Raw dashboard route', route: '/(gowealthy)/dashboard/home' },
];

export default function ProfileScreen({ onBack }) {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showLoaderPreview, setShowLoaderPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((data) => !cancelled && setProfile(data))
      .catch((e) => console.error('[profile] load failed:', e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showLoaderPreview) return undefined;
    const timer = setTimeout(() => setShowLoaderPreview(false), 3500);
    return () => clearTimeout(timer);
  }, [showLoaderPreview]);

  const toAuth = () => router.replace('/(auth)/landing');

  const confirmRestart = () =>
    Alert.alert(
      'Restart questionnaire?',
      'Your current blueprint stays saved until you finish the new one.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          onPress: () => {
            hapticWarning();
            router.replace('/(gowealthy)/questionnaire-v2/section1');
          },
        },
      ]
    );

  const confirmLogout = () =>
    Alert.alert('Log out?', "You'll need your phone number to sign back in.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          hapticWarning();
          setBusy(true);
          await logout();
          toAuth();
        },
      },
    ]);

  const confirmDelete = () =>
    Alert.alert(
      'Delete account?',
      'This erases your financial blueprint and signs you out. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            hapticWarning();
            setBusy(true);
            try {
              await deleteAccount();
              toAuth();
            } catch (e) {
              hapticError();
              console.error('[profile] delete failed:', e);
              setBusy(false);
              Alert.alert('Something went wrong', 'Please try again in a moment.');
            }
          },
        },
      ]
    );

  if (loading) {
    return <LogoLoader label="Loading your profile…" />;
  }

  return (
    <View style={styles.root}>
      <Embers />

      <View style={styles.nav}>
        <Pressable onPress={() => { hapticSmall(); onBack?.(); }} style={styles.backBtn} hitSlop={10}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.stepTag}>
          <Text style={styles.stepTagText}>Profile</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <FadeInUp>
          <View style={styles.identity}>
            <View style={styles.avatarRing}>
              <Image source={AVATAR} style={styles.avatar} resizeMode="cover" />
            </View>
            <Text style={styles.name}>{profile?.name}</Text>
            <Text style={styles.phone}>+91 {profile?.phone}</Text>
          </View>
        </FadeInUp>

        <FadeInUp delay={70}>
          <View style={styles.statRow}>
            <Stat label="XP balance" value={profile?.xpBalance ?? 0} accent />
            <View style={styles.statDivider} />
            <Stat label="Total earned" value={profile?.xpTotalEarned ?? 0} />
          </View>
        </FadeInUp>

        <FadeInUp delay={140}>
          <View style={styles.section}>
            <Eyebrow>Your plan</Eyebrow>
            <ActionRow label="Restart questionnaire" hint="Rebuild your blueprint from scratch" onPress={confirmRestart} />
          </View>
        </FadeInUp>

        <FadeInUp delay={200}>
          <View style={styles.section}>
            <Eyebrow>App experience</Eyebrow>
            <ActionRow
              label="Test loading screen"
              hint="Preview the animation for a few seconds"
              onPress={() => setShowLoaderPreview(true)}
            />
          </View>
        </FadeInUp>

        <FadeInUp delay={260}>
          <View style={styles.section}>
            <Eyebrow>Account</Eyebrow>
            <ActionRow label="Log out" onPress={confirmLogout} disabled={busy} />
            <ActionRow label="Delete account" hint="Erases your data permanently" danger onPress={confirmDelete} disabled={busy} />
          </View>
        </FadeInUp>

        {FEATURES.devDoor && (
          <FadeInUp delay={260}>
            <View style={styles.section}>
              <Eyebrow>Dev only</Eyebrow>
              <Text style={styles.devNote}>
                Parked flows. These are hidden in the published build.
              </Text>
              {DEV_ROUTES.map((item) => (
                <ActionRow
                  key={item.route}
                  label={item.label}
                  onPress={() => router.push(item.route)}
                />
              ))}
            </View>
          </FadeInUp>
        )}
      </ScrollView>

      <Modal
        visible={showLoaderPreview}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowLoaderPreview(false)}
      >
        <View style={styles.previewRoot}>
          <LogoLoader label="Preparing your wealth journey…" />
          <Pressable
            onPress={() => { hapticSmall(); setShowLoaderPreview(false); }}
            style={styles.previewClose}
            hitSlop={10}
          >
            <Text style={styles.previewCloseText}>Close preview</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

function Stat({ label, value, accent }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, accent && { color: C.gold }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionRow({ label, hint, danger, disabled, onPress }) {
  return (
    <Pressable
      onPress={() => { hapticSmall(); onPress?.(); }}
      disabled={disabled}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, disabled && { opacity: 0.5 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && { color: C.rd }]}>{label}</Text>
        {!!hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      <Text style={[styles.rowArrow, danger && { color: C.rd }]}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 52 : 28,
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
  backText: { color: C.muted, fontSize: 17 },
  stepTag: {
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 30,
  },
  stepTagText: {
    color: C.muted,
    fontSize: 10.5,
    fontFamily: FONT.bodySemi,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: TAB_BAR_CLEARANCE + 20 },

  identity: { alignItems: 'center', marginBottom: 26 },
  avatarRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.line2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 14,
  },
  avatar: { width: '100%', height: '100%' },
  name: {
    fontSize: 24,
    fontFamily: FONT.display,
    color: C.ink,
    letterSpacing: -0.7,
    marginBottom: 4,
  },
  phone: { fontSize: 13, fontFamily: FONT.body, color: C.muted },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: RADIUS.md,
    paddingVertical: 18,
    marginBottom: 30,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: C.line },
  statValue: { fontSize: 24, fontFamily: FONT.display, color: C.ink, letterSpacing: -0.8 },
  statLabel: {
    fontSize: 10,
    fontFamily: FONT.bodySemi,
    color: C.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  section: { marginBottom: 26 },
  devNote: {
    fontSize: 11.5,
    fontFamily: FONT.body,
    color: C.muted,
    marginBottom: 12,
    marginTop: -4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 9,
  },
  rowPressed: { borderColor: C.o, backgroundColor: 'rgba(255,106,26,0.08)' },
  rowLabel: { fontSize: 14.5, fontFamily: FONT.bodyMed, color: C.ink },
  rowHint: { fontSize: 11.5, fontFamily: FONT.body, color: C.muted, marginTop: 3 },
  rowArrow: { fontSize: 16, color: C.muted },
  previewRoot: { flex: 1, backgroundColor: C.bg },
  previewClose: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 54 : 34,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.line2,
    backgroundColor: C.glass,
  },
  previewCloseText: { color: C.muted, fontSize: 12, fontFamily: FONT.bodyMed },
});
