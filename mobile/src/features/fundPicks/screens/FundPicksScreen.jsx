import React, { useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Platform, UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { P, F, MIN_TOUCH } from '../theme';
import { hapticSmall } from '../../../lib/haptics';
import useFundPicks from '../hooks/useFundPicks';
import useOpenFund from '../hooks/useOpenFund';
import FundCard from '../components/FundCard';
import FundSearch from '../components/FundSearch';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FundPicksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const searchRef = useRef(null);
  const searchY = useRef(0);

  const picks = useFundPicks();
  const { openFund, openingCode } = useOpenFund();

  const jumpToSearch = () => {
    scrollRef.current?.scrollTo({ y: Math.max(0, searchY.current - 16), animated: true });
    setTimeout(() => searchRef.current?.focus(), 250);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() => { hapticSmall(); router.back(); }}
            style={styles.back}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={20} color={P.textSoft} strokeWidth={2} />
          </Pressable>
          <Text style={styles.wordmark}>GoWealthy</Text>
          {picks.isSample && <Text style={styles.sample}>Sample data</Text>}
        </View>

        <Text style={styles.h1}>Picked for you</Text>
        <Text style={styles.subtitle}>Matched to your GoPersona. Tap a fund to see why.</Text>

        {picks.status === 'loading' && (
          <View style={styles.center}><ActivityIndicator color={P.gold} /></View>
        )}

        {picks.status === 'error' && (
          <View style={styles.center}>
            <Text style={styles.errorText}>Could not load your picks.</Text>
            <Pressable onPress={picks.reload} style={styles.retry} accessibilityRole="button">
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {picks.status === 'ready' && (
          <>
            <View style={{ marginTop: 20, marginBottom: 18 }} onLayout={(e) => { searchY.current = e.nativeEvent.layout.y; }}>
              <FundSearch ref={searchRef} search={picks.search} onSwapIn={picks.swapIn} />
            </View>

            {picks.slots.map((slot, i) => (
              <FundCard
                key={slot.id}
                slot={slot}
                open={picks.openId === slot.id}
                onToggle={() => picks.toggleOpen(slot.id)}
                busy={picks.busyId === slot.id}
                onSwitch={(alt) => picks.switchTo(slot.id, alt)}
                onUndo={() => picks.undo(slot.id)}
                onSearchAll={jumpToSearch}
                onOpenFund={openFund}
                opening={openingCode === slot.current.scheme_code}
                stressInitiallyOpen={i === 0}
              />
            ))}
          </>
        )}

        <Text style={styles.disclaimer}>
          Past performance does not guarantee future returns. Mutual fund investments are subject to market risks;
          read all scheme-related documents carefully.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.page },
  content: { paddingHorizontal: 16 },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  back: {
    width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2,
    alignItems: 'center', justifyContent: 'center', backgroundColor: P.panel, marginLeft: -4,
  },
  wordmark: { fontFamily: F.bodyBold, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: P.gold },
  sample: {
    fontFamily: F.bodyMed, fontSize: 10.5, color: P.textDim,
    borderWidth: 1, borderColor: P.divider, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },

  h1: { fontFamily: F.display, fontSize: 32, lineHeight: 38, color: P.text, letterSpacing: -0.6 },
  subtitle: { fontFamily: F.body, fontSize: 14.5, lineHeight: 21, color: P.textSecondary, marginTop: 6 },

  center: { alignItems: 'center', paddingVertical: 48, gap: 14 },
  errorText: { fontFamily: F.bodyMed, fontSize: 14, color: P.textSoft },
  retry: {
    minHeight: MIN_TOUCH, paddingHorizontal: 22, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(242,181,68,0.4)', justifyContent: 'center',
  },
  retryText: { fontFamily: F.bodySemi, fontSize: 14, color: P.gold },

  disclaimer: { fontFamily: F.body, fontSize: 11.5, lineHeight: 17, color: P.textDim, marginTop: 14 },
});
