import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const ORANGE = '#FF8500';
const PURPLE = '#8D73E6';
const AUTO_DISMISS_MS = 2800;
const LOGO_MARK = require('../../assets/gowealthy.png');

// Mount <XPCelebrationHost /> once at the app root (see app/_layout.jsx). Any
// module can call these helpers, including non-hook contexts. Celebrations are
// queued so two rewards arriving together still get their own moment.
let showHandler = null;
let queue = [];
let isShowing = false;

function enqueue(payload) {
  queue.push(payload);
  drainQueue();
}

function drainQueue() {
  if (!showHandler || isShowing || queue.length === 0) return;
  isShowing = true;
  showHandler(queue.shift());
}

export function celebrateXP({ name, xp, eyebrow = 'XP RECEIVED' }) {
  enqueue({ kind: 'xp', eyebrow, title: name || 'Reward unlocked', subtitle: `+${xp} XP` });
}

export function celebratePayment({ amount, fundName }) {
  const amountText = `₹${Number(amount || 0).toLocaleString('en-IN')} invested`;
  enqueue({
    kind: 'payment',
    eyebrow: 'PAYMENT SUCCESSFUL',
    title: fundName || 'Investment confirmed',
    subtitle: amountText,
  });
}

export default function XPCelebrationHost() {
  const [current, setCurrent] = useState(null);
  const [backdrop] = useState(() => new Animated.Value(0));
  const [mark] = useState(() => new Animated.Value(0));
  const [coin] = useState(() => new Animated.Value(0));
  const [echo] = useState(() => new Animated.Value(0));
  const [copy] = useState(() => new Animated.Value(0));

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(mark, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(copy, { toValue: 0, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(null);
      isShowing = false;
      drainQueue();
    });
  }, [backdrop, copy, mark]);

  useEffect(() => {
    showHandler = setCurrent;
    drainQueue();
    return () => {
      showHandler = null;
      isShowing = false;
    };
  }, []);

  useEffect(() => {
    if (!current) return undefined;

    backdrop.setValue(0);
    mark.setValue(0);
    coin.setValue(0);
    echo.setValue(0);
    copy.setValue(0);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    Animated.parallel([
      Animated.timing(backdrop, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(mark, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(coin, {
        toValue: 1,
        duration: 760,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(470),
        Animated.timing(echo, {
          toValue: 1,
          duration: 720,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(510),
        Animated.timing(copy, {
          toValue: 1,
          duration: 340,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [backdrop, coin, copy, current, dismiss, echo, mark]);

  const coinScale = coin.interpolate({
    inputRange: [0, 0.62, 0.8, 0.92, 1],
    outputRange: [0.22, 1.12, 0.97, 1.035, 1],
  });
  const coinLift = coin.interpolate({ inputRange: [0, 0.65, 1], outputRange: [14, -2, 0] });
  const coinSpin = coin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] });
  const echoScale = echo.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.28] });
  const echoOpacity = echo.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0, 0.45, 0] });
  const copyLift = copy.interpolate({ inputRange: [0, 1], outputRange: [5, 0] });

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
          <View style={styles.moment}>
            <View style={styles.markStage}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.echo,
                  { opacity: echoOpacity, transform: [{ scale: echoScale }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.logoSeal,
                  {
                    opacity: mark,
                    transform: [
                      { perspective: 700 },
                      { translateY: coinLift },
                      { rotateY: coinSpin },
                      { scale: coinScale },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(255,133,0,0.12)', 'rgba(108,80,196,0.12)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <View style={styles.coinRim} pointerEvents="none" />
                <Image source={LOGO_MARK} style={styles.logo} resizeMode="contain" />
              </Animated.View>
            </View>

            <Animated.View
              style={[styles.copy, { opacity: copy, transform: [{ translateY: copyLift }] }]}
            >
              <Text style={styles.eyebrow}>{current?.eyebrow}</Text>
              <Text style={styles.title} numberOfLines={2}>{current?.title}</Text>
              <View style={styles.rewardPill}>
                <View style={styles.rewardDot} />
                <Text style={[
                  styles.reward,
                  current?.kind === 'payment' && styles.paymentReward,
                ]}>
                  {current?.subtitle}
                </Text>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 2, 4, 0.76)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moment: {
    width: Math.min(Dimensions.get('window').width - 64, 320),
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  markStage: {
    width: 132,
    height: 132,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },
  echo: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,133,0,0.72)',
    backgroundColor: 'rgba(108,80,196,0.06)',
  },
  logoSeal: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(255,133,0,0.66)',
    backgroundColor: '#0B0B0E',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 10,
  },
  coinRim: {
    position: 'absolute',
    top: 6,
    right: 6,
    bottom: 6,
    left: 6,
    borderRadius: 49,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
  },
  logo: { width: 45, height: 72 },
  copy: { alignItems: 'center', width: '100%' },
  eyebrow: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 7,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: -0.35,
    textAlign: 'center',
    marginBottom: 13,
  },
  rewardPill: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,133,0,0.24)',
    backgroundColor: 'rgba(255,133,0,0.08)',
  },
  rewardDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: ORANGE, marginRight: 8 },
  reward: { color: ORANGE, fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  paymentReward: { color: PURPLE },
});
