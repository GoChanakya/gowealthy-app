import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, ActivityIndicator, LayoutAnimation } from 'react-native';
import Toast from 'react-native-toast-message';
import { ChevronDown, ArrowLeftRight, ArrowUpRight } from 'lucide-react-native';
import { P, F, TABULAR, CARD_RADIUS, MIN_TOUCH } from '../theme';
import { signedPct, rupees, shortDate } from '../lib/format';
import { tenK, planTags } from '../lib/insights';
import { hapticSmall } from '../../../lib/haptics';
import { Divider, Tag } from './primitives';
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
  const ten = tenK(r.y1);
  const plan = planTags(fund);
  const score = fund.personality_match.score;
  const band = fund.personality_match.band?.label;

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

      {/* Identity — tapping it opens the fund in the MF section. */}
      <Pressable
        onPress={() => { hapticSmall(); onOpenFund(fund); }}
        style={({ pressed }) => pressed && { opacity: 0.75 }}
        accessibilityRole="button"
        accessibilityLabel={`Open ${fund.name}${plan.length ? `, ${plan.join(' ')}` : ''} to invest`}
      >
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {fund.category.label} · {fund.amc.short_name}
          </Text>
          <View
            style={styles.match}
            accessible
            accessibilityLabel={`${score} percent match with your GoPersona${band ? `, ${band}` : ''}`}
          >
            <Text style={styles.matchValue}>{score}%</Text>
            <Text style={styles.matchLabel}>match</Text>
          </View>
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.name}>{fund.name}</Text>
          {opening
            ? <ActivityIndicator size="small" color={P.textSecondary} style={styles.nameIcon} />
            : <ArrowUpRight size={16} color={P.textDim} strokeWidth={2} style={styles.nameIcon} />}
        </View>

        {plan.length > 0 && (
          <View style={styles.planRow}>
            {plan.map((p) => <Tag key={p}>{p}</Tag>)}
          </View>
        )}
      </Pressable>

      {!!fund.hook && <Text style={styles.hook}>{fund.hook}</Text>}

      {/* Returns — one panel, three equal columns, NAV as a quiet footnote. */}
      <View style={styles.returnsPanel}>
        <View style={styles.returns}>
          <ReturnCol label="3 months" value={r.m3} />
          <View style={styles.vline} />
          <ReturnCol label="6 months" value={r.m6} />
          <View style={styles.vline} />
          <ReturnCol label="1 year" value={r.y1} />
        </View>
        {ten && (
          <Text style={styles.tenK}>
            ₹10,000 invested 1 year ago is worth{' '}
            <Text style={[styles.tenKValue, { color: ten.gained ? P.gain : P.loss }]}>{ten.to}</Text> today
          </Text>
        )}
      </View>
      <Text style={styles.nav}>
        NAV {rupees(fund.nav.value, 2)}{fund.nav.date ? ` · as of ${shortDate(fund.nav.date)}` : ''}
      </Text>

      <View style={styles.actions}>
        <Pressable
          onPress={toggle}
          style={({ pressed }) => [styles.primary, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
        >
          <Text style={styles.primaryText}>{open ? 'Hide details' : 'Why this fund'}</Text>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <ChevronDown size={17} color={P.goldPale} strokeWidth={2} />
          </Animated.View>
        </Pressable>
        <Pressable
          onPress={toggleSwitch}
          style={({ pressed }) => [styles.round, switchOpen && styles.roundActive, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Switch to a similar fund"
          accessibilityState={{ expanded: switchOpen }}
        >
          <ArrowLeftRight size={17} color={switchOpen ? P.gold : P.textSoft} strokeWidth={2} />
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

function ReturnCol({ label, value }) {
  const color = value == null ? P.textDim : value < 0 ? P.loss : P.gain;
  return (
    <View style={styles.col}>
      <Text style={styles.colLabel}>{label}</Text>
      <Text style={[styles.colValue, { color }]}>{signedPct(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: P.card,
    borderWidth: 1,
    borderColor: P.cardBorder,
    borderRadius: CARD_RADIUS,
    padding: 18,
    marginBottom: 14,
  },
  switchedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  switchedText: { fontFamily: F.body, fontSize: 12, color: P.textDim, flexShrink: 1 },
  undo: { fontFamily: F.bodySemi, fontSize: 12, color: P.goldPale, textDecorationLine: 'underline' },

  eyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  eyebrow: {
    flexShrink: 1,
    fontFamily: F.bodyMed,
    fontSize: 12,
    letterSpacing: 0.2,
    color: P.textSecondary,
  },
  match: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    borderWidth: 1,
    borderColor: P.goldLine,
    backgroundColor: P.goldLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchValue: { fontFamily: F.bodyBold, fontSize: 13, color: P.goldPale, ...TABULAR },
  matchLabel: { fontFamily: F.bodyMed, fontSize: 11.5, color: P.gold },

  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 10 },
  name: { fontFamily: F.displaySemi, fontSize: 19, lineHeight: 25, color: P.text, letterSpacing: -0.2, flexShrink: 1 },
  nameIcon: { marginTop: 5 },
  planRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },

  hook: { fontFamily: F.body, fontSize: 14, lineHeight: 20, color: P.textSoft, marginTop: 12 },

  returnsPanel: {
    backgroundColor: P.panel,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: 16,
  },
  returns: { flexDirection: 'row' },
  vline: { width: 1, alignSelf: 'stretch', backgroundColor: P.divider, marginHorizontal: 12 },
  col: { flex: 1 },
  colLabel: { fontFamily: F.body, fontSize: 11.5, color: P.textDim },
  colValue: { fontFamily: F.bodySemi, fontSize: 17, marginTop: 4, ...TABULAR },
  tenK: {
    fontFamily: F.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: P.textSecondary,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: P.divider,
    ...TABULAR,
  },
  tenKValue: { fontFamily: F.bodySemi },
  nav: { fontFamily: F.body, fontSize: 11.5, color: P.textDim, marginTop: 8, marginLeft: 2, ...TABULAR },

  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  primary: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.goldLine,
    backgroundColor: P.goldLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryText: { fontFamily: F.bodySemi, fontSize: 14.5, color: P.goldPale },
  round: {
    width: 48,
    height: 48,
    minWidth: MIN_TOUCH,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundActive: { borderColor: P.goldLine, backgroundColor: P.goldLight },
});
