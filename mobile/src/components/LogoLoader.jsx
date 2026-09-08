import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';

const APP_LOGO = require('../../assets/Logo.png');

/** Branded full-screen loader used during app boot and route preparation. */
export default function LogoLoader({ label = 'Preparing your wealth journey…' }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    spinAnimation.start();
    pulseAnimation.start();
    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, [pulse, rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const logoScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <View style={styles.root} accessibilityLabel={label} accessibilityRole="progressbar">
      <View style={styles.loaderFrame}>
        <View style={styles.track} />
        <Animated.View style={[styles.rotatingRing, { transform: [{ rotate }] }]}>
          <View style={styles.ringSpark} />
        </Animated.View>
        <Animated.View style={[styles.logoWell, { transform: [{ scale: logoScale }] }]}>
          <Image source={APP_LOGO} style={styles.logo} resizeMode="contain" />
        </Animated.View>
      </View>
      {!!label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#08060a',
  },
  loaderFrame: {
    width: 126,
    height: 126,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 63,
    borderWidth: 2,
    borderColor: 'rgba(255, 106, 26, 0.14)',
  },
  rotatingRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 63,
    borderWidth: 3,
    borderTopColor: '#ff6a1a',
    borderRightColor: '#ff8f3c',
    borderBottomColor: 'rgba(255, 106, 26, 0.34)',
    borderLeftColor: 'transparent',
    shadowColor: '#ff6a1a',
    shadowOpacity: 0.55,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
  },
  ringSpark: {
    position: 'absolute',
    top: -5,
    left: 56,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffb36b',
  },
  logoWell: {
    width: 98,
    height: 98,
    borderRadius: 49,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0e0a10',
  },
  logo: {
    width: 68,
    height: 68,
  },
  label: {
    marginTop: 24,
    color: '#a99ba6',
    fontSize: 13,
    letterSpacing: 0.35,
  },
});
