import React, { useRef, useEffect } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { C, gwStyles } from '../theme';
import { Ico } from '../../../lib/icons';

/**
 * Subtle right-chevron on the first slide.
 *
 * The reader advances by tapping the right edge, which isn't discoverable from
 * a page of text. This just points at it: a small glass pill on the right,
 * breathing gently. No copy, no scrim, no blocking — it reads as an affordance
 * rather than a tutorial.
 */
export default function TapArrow({ visible = true }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  if (!visible) return null;

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const translateX = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 4] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[gwStyles.glassPill, styles.pill, { opacity, transform: [{ translateX }] }]}
    >
      <Ico name="ChevronRight" size={18} color={C.ink} strokeWidth={2} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    right: 14,
    top: '46%',
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
  },
});
