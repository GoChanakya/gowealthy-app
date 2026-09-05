import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ORANGE = '#FF6300';
const ORANGE2 = '#FF8500';
const PURPLE = '#6C50C4';
const PURPLE2 = '#9B84F0';
const GOLD = '#FFD166';

const CONFETTI_COLORS = [ORANGE, ORANGE2, PURPLE, PURPLE2, GOLD, '#FFFFFF'];
const CONFETTI_COUNT = 46;
const AUTO_DISMISS_MS = 3000;

// Mount <XPCelebrationHost /> once at the app root (see app/_layout.jsx). Any
// module can then call celebrateXP(...) / celebratePayment(...) — including
// non-hook contexts like mobile/src/lib/xpBadges.js — without needing a hook
// or context consumer at the call site. Calls made before the host mounts, or
// while one celebration is already showing, are queued and played in order.
//
// Rendered inside a react-native <Modal> rather than an absolutely-positioned
// sibling View: a Modal gets its own full-screen native window, so centering
// is guaranteed regardless of how the surrounding layout (Stack navigator,
// other overlays) happens to size itself — a plain View sibling would only
// center correctly if every ancestor up to the root sized itself exactly to
// the screen, which is fragile to depend on.
let showHandler = null;
let queue = [];

function enqueue(payload) {
  queue.push(payload);
  drainQueue();
}

function drainQueue() {
  if (!showHandler || queue.length === 0) return;
  const next = queue.shift();
  showHandler(next);
}

// One-time achievement badges (persona done, KYC complete, first investment...).
export function celebrateXP({ emoji, name, xp }) {
  enqueue({ emoji, eyebrow: 'BADGE EARNED', title: name, subtitle: `+${xp} XP` });
}

// Every successful investment payment, not gated by a one-time marker — fires
// every time, not just the first. See mobile/app/(gowealthy)/mf/trading/sip-amount.jsx.
export function celebratePayment({ amount, fundName }) {
  const amountText = `₹${Number(amount || 0).toLocaleString('en-IN')} invested`;
  enqueue({ emoji: '🎉', eyebrow: 'PAYMENT SUCCESSFUL', title: fundName || 'Investment confirmed', subtitle: amountText });
}

function makeConfetti() {
  return Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;
    return {
      key: i,
      angle,
      distance: 90 + Math.random() * 170,
      fall: 70 + Math.random() * 150,
      size: 5 + Math.random() * 7,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotateTo: (Math.random() > 0.5 ? 1 : -1) * (280 + Math.random() * 420),
      round: Math.random() > 0.5,
    };
  });
}

export default function XPCelebrationHost() {
  const [current, setCurrent] = useState(null);
  const [confetti, setConfetti] = useState([]);
  const [progress] = useState(() => new Animated.Value(0));
  const [cardScale] = useState(() => new Animated.Value(0));
  const [backdrop] = useState(() => new Animated.Value(0));

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 0.85, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(null);
      drainQueue();
    });
  }, [backdrop, cardScale]);

  useEffect(() => {
    showHandler = (payload) => {
      setConfetti(makeConfetti());
      setCurrent(payload);
    };
    drainQueue();
    return () => { showHandler = null; };
  }, []);

  useEffect(() => {
    if (!current) return undefined;
    progress.setValue(0);
    cardScale.setValue(0);
    backdrop.setValue(0);
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(progress, { toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [current, progress, cardScale, backdrop, dismiss]);

  const confettiNodes = useMemo(() => confetti.map((p) => {
    const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(p.angle) * p.distance] });
    const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(p.angle) * p.distance + p.fall] });
    const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rotateTo}deg`] });
    const opacity = progress.interpolate({ inputRange: [0, 0.65, 1], outputRange: [1, 1, 0] });
    const scale = progress.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 1, 1] });
    return (
      <Animated.View
        key={p.key}
        pointerEvents="none"
        style={[
          styles.confettiPiece,
          {
            width: p.size, height: p.size, backgroundColor: p.color,
            borderRadius: p.round ? p.size / 2 : 2,
            opacity,
            transform: [{ translateX }, { translateY }, { rotate }, { scale }],
          },
        ]}
      />
    );
  }), [confetti, progress]);

  return (
    <Modal
      visible={Boolean(current)}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <TouchableWithoutFeedback onPress={dismiss}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          {confettiNodes}
          <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
            <LinearGradient
              colors={['rgba(255,133,0,0.20)', 'rgba(108,80,196,0.12)', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill} pointerEvents="none"
            />
            <View style={styles.iconWrap}>
              <Text style={styles.emoji}>{current?.emoji}</Text>
            </View>
            <Text style={styles.eyebrow}>{current?.eyebrow}</Text>
            <Text style={styles.name}>{current?.title}</Text>
            <Text style={styles.xp}>{current?.subtitle}</Text>
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,3,8,0.62)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiPiece: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  card: {
    width: Math.min(Dimensions.get('window').width - 80, 300),
    backgroundColor: '#0d1117',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,133,0,0.35)',
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,133,0,0.35)',
    backgroundColor: 'rgba(255,133,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: { fontSize: 34 },
  eyebrow: { color: ORANGE2, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  name: { color: '#fff', fontSize: 19, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  xp: { color: PURPLE2, fontSize: 16, fontWeight: '800' },
});
