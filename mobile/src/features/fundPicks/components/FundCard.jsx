import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, ActivityIndicator, LayoutAnimation } from 'react-native';
import Toast from 'react-native-toast-message';
import { ChevronDown, ArrowLeftRight, ArrowUpRight } from 'lucide-react-native';
import { P, F, TABULAR, CARD_RADIUS, MIN_TOUCH } from '../theme';
import { signedPct, rupees } from '../lib/format';
import { tenKLine } from '../lib/insights';
import { hapticSmall } from '../../../lib/haptics';
import { Divider } from './primitives';
import SwitchPanel from './SwitchPanel';
import PersonalitySection from './sections/PersonalitySection';
import ConsistencySection from './sections/ConsistencySection';
import SipSection from './sections/SipSection';
import MomentumSection from './sections/MomentumSection';
import BounceBackSection from './sections/BounceBackSection';

const animate = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

export default function FundCard({
  slot, open, onToggle, busy, onSwitch, onUndo, onSearchAll, onOpenFund, opening, stressInitiallyOpen,
}) {
  const fund = slot.current;
  const switched = slot.current !== slot.original;
  const [switchOpen, setSwitchOpen] = useState(false);

  const [spin] = useState(() => new Animated.Value(open ? 1 : 0));
  useEffect(() => {
    Animated.timing(spin, { toValue: open ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [open, spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const toggle = () => { hapticSmall(); animate(); onToggle(); };
  const toggleSwitch = () => { hapticSmall(); animate(); setSwitchOpen((v) => !v); };

  const doSwitch = async (alt) => {
    hapticSmall();
    try {
      await onSwitch(alt);
      animate();
      setSwitchOpen(false);
    } catch (e) {
      if (__DEV__) console.warn('[fundPicks] switch failed', e);
      Toast.show({ type: 'error', text1: 'Could not load that fund', text2: 'Try again.' });
    }
  };

  const r = fund.returns_pct;
  const ten = tenKLine(r.y1);

  return (
    <View style={styles.card}>
      {switched && (
        <View style={styles.switchedRow}>
          <Text style={styles.switchedText} numberOfLines={1}>Switched from {slot.original.name}</Text>
          <Text style={styles.switchedText}> · </Text>
          <Pressable onPress={() => { hapticSmall(); animate(); onUndo(); }} hitSlop={12} accessibilityRole="button">
            <Text style={styles.undo}>Undo</Text>
          </Pressable>
        </View>
      )}

      {/* Top row — tapping the fund opens it in the MF section. */}
      <View style={styles.top}>
        <Pressable
          onPress={() => { hapticSmall(); onOpenFund(fund); }}
          style={{ flex: 1, paddingRight: 12 }}
          accessibilityRole="button"
          accessibilityLabel={`Open ${fund.name} to invest`}
        >
          <View style={styles.nameRow}>
            <Text style={styles.name}>{fund.name}</Text>
            {opening
              ? <ActivityIndicator size="small" color={P.textSecondary} />
              : <ArrowUpRight size={16} color={P.textSecondary} strokeWidth={2} />}
          </View>
          <Text style={styles.meta}>{fund.category.label} · {fund.amc.short_name}</Text>
        </Pressable>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.match}>{fund.personality_match.score}%</Text>
          <Text style={styles.matchLabel}>Personality Match</Text>
        </View>
      </View>

      <Text style={styles.hook}>{fund.hook}</Text>

      <View style={styles.returns}>
        <ReturnCol label="3 months" value={r.m3} />
        <View style={styles.vline} />
        <ReturnCol label="6 months" value={r.m6} />
        <View style={styles.vline} />
        <ReturnCol label="1 year" value={r.y1} big />
      </View>
      <Text style={styles.tenK}>
        {ten ? `${ten} · ` : ''}NAV {rupees(fund.nav.value, 2)}
      </Text>

      <View style={styles.actions}>
        <Pressable
          onPress={toggle}
          style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
        >
          <Text style={styles.primaryText}>{open ? 'Show less' : 'Why this fund'}</Text>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <ChevronDown size={18} color={P.onOrange} strokeWidth={2.25} />
          </Animated.View>
        </Pressable>
        <Pressable
          onPress={toggleSwitch}
          style={({ pressed }) => [styles.round, switchOpen && styles.roundActive, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Switch to a similar fund"
          accessibilityState={{ expanded: switchOpen }}
        >
          <ArrowLeftRight size={18} color={switchOpen ? P.gold : P.textSoft} strokeWidth={2} />
        </Pressable>
      </View>

      {switchOpen && (
        <SwitchPanel
          category={fund.category.label}
          alternates={fund.alternates}
          busy={busy}
          onSwitch={doSwitch}
          onSearchAll={() => { animate(); setSwitchOpen(false); onSearchAll(); }}
        />
      )}

      {open && (
        <View style={{ marginTop: 4 }}>
          <Divider />
          <PersonalitySection fund={fund} />
          <Divider />
          <ConsistencySection fund={fund} />
          <Divider />
          <SipSection fund={fund} />
          <Divider />
          <MomentumSection fund={fund} />
          <Divider />
          <BounceBackSection fund={fund} stressInitiallyOpen={stressInitiallyOpen} />
        </View>
      )}
    </View>
  );
}

function ReturnCol({ label, value, big }) {
  const color = value == null ? P.textDim : value < 0 ? P.loss : P.gain;
  return (
    <View style={styles.col}>
      <Text style={styles.colLabel}>{label}</Text>
      <Text style={[styles.colValue, big && styles.colValueBig, { color }]}>{signedPct(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: P.card,
    borderWidth: 1,
    borderColor: P.cardBorder,
    borderRadius: CARD_RADIUS,
    padding: 20,
    marginBottom: 14,
  },
  switchedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  switchedText: { fontFamily: F.body, fontSize: 12, color: P.textDim, flexShrink: 1 },
  undo: { fontFamily: F.bodySemi, fontSize: 12, color: P.goldPale, textDecorationLine: 'underline' },

  top: { flexDirection: 'row', alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: F.bodyBold, fontSize: 17, color: P.text, flexShrink: 1 },
  meta: { fontFamily: F.body, fontSize: 12.5, color: P.textSecondary, marginTop: 3 },
  match: { fontFamily: F.display, fontSize: 30, lineHeight: 34, color: P.gold, letterSpacing: -0.5, ...TABULAR },
  matchLabel: { fontFamily: F.bodyMed, fontSize: 10.5, color: P.textDim, marginTop: 1 },

  hook: { fontFamily: F.displaySemi, fontSize: 18, lineHeight: 24, color: P.goldPale, marginTop: 14 },

  returns: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 16 },
  vline: { width: 1, alignSelf: 'stretch', backgroundColor: P.divider, marginHorizontal: 12 },
  col: { flex: 1 },
  colLabel: { fontFamily: F.body, fontSize: 11.5, color: P.textDim },
  colValue: { fontFamily: F.bodySemi, fontSize: 15, marginTop: 4, ...TABULAR },
  colValueBig: { fontFamily: F.display, fontSize: 22 },
  tenK: { fontFamily: F.body, fontSize: 12.5, lineHeight: 18, color: P.textSecondary, marginTop: 12, ...TABULAR },

  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  primary: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: P.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryText: { fontFamily: F.bodyBold, fontSize: 15, color: P.onOrange },
  round: {
    width: 48,
    height: 48,
    minWidth: MIN_TOUCH,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundActive: { borderColor: 'rgba(242,181,68,0.5)', backgroundColor: 'rgba(242,181,68,0.08)' },
});
