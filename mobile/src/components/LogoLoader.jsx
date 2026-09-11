import React, { useEffect, useId, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

/**
 * The same mark asset XPCelebration uses, not assets/Logo.png.
 *
 * Logo.png is a 1024² tile with a fully opaque black background, so on a dark
 * screen it reads as a black square rather than a floating mark. gowealthy.png
 * is the tightly-cropped mark on alpha — logo-mark.png is the same artwork but
 * padded inside a 1024² canvas, which makes `contain` sizing a guessing game.
 */
const APP_LOGO = require('../../assets/gowealthy.png');

/** Natural aspect of the mark, so the box never letterboxes it. */
const MARK_ASPECT = 45 / 72;

/** Roughly an ActivityIndicator size="large" (36pt iOS / 48pt Android). */
export const SPINNER_SIZE = 44;

/**
 * The branded spinner: the app mark, with an orange arc circling it.
 *
 * This is the single loading indicator for the whole app. Every full-screen
 * route gate used to roll its own `ActivityIndicator size="large"` in whatever
 * accent that screen happened to use — C.o here, a hardcoded #FF8500 there — so
 * moving between tabs swapped the animation mid-navigation. They all render
 * this now.
 *
 * Only the ring turns. The mark is deliberately outside the rotating wrapper:
 * the reward seal's coin flip is that moment's flourish, and a logo that spins
 * while you wait reads as a busy cursor.
 *
 * In-button spinners are *not* this — a 44pt badge inside a CTA would break the
 * button's height. Those stay `ActivityIndicator size="small"`.
 */
export function LogoSpinner({ size = SPINNER_SIZE, style }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  /* Gradient ids share one document namespace, so two spinners mounted at once
     would otherwise fight over a fixed id. */
  const gradientId = `logoSpinner-${useId()}`;

  /* Derived from `size` so the badge scales as one piece. The stroke is centred
     on the path, hence the half-stroke inset on the radius. */
  const stroke = size * 0.068;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const arc = circumference * 0.28;
  const markHeight = size * 0.5;

  return (
    <View style={[{ width: size, height: size }, styles.badge, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#ff6a1a" stopOpacity="1" />
              <Stop offset="1" stopColor="#ffb36b" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(255, 106, 26, 0.13)"
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={[arc, circumference - arc]}
            fill="none"
            /* Start the arc at 12 o'clock instead of 3. */
            rotation={-90}
            originX={size / 2}
            originY={size / 2}
          />
        </Svg>
      </Animated.View>

      <Image
        source={APP_LOGO}
        style={{ width: markHeight * MARK_ASPECT, height: markHeight }}
        resizeMode="contain"
      />
    </View>
  );
}

/**
 * Full-screen branded loader, for app boot and route preparation.
 *
 * Deliberately no FONT constants here — _layout.jsx renders this *while* the
 * font gate is still open, so a custom family would have nothing to resolve to.
 */
export default function LogoLoader({ label = 'Preparing your wealth journey…' }) {
  return (
    <View style={styles.root} accessibilityLabel={label} accessibilityRole="progressbar">
      <LogoSpinner />
      {!!label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#08060a',
  },
  label: {
    marginTop: 20,
    color: '#a99ba6',
    fontSize: 13,
    letterSpacing: 0.35,
  },
});
