import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * App-wide haptic design tokens.
 *
 * The perceived strength can be changed in one place with
 * EXPO_PUBLIC_HAPTIC_LEVEL=off|subtle|standard|strong, or at runtime through
 * setHapticLevel(). Exact amplitude is intentionally left to the phone's OS;
 * iOS and Android expose semantic feedback styles rather than one portable
 * numeric vibration strength.
 */
export const HAPTIC_LEVEL = Object.freeze({
  OFF: 'off',
  SUBTLE: 'subtle',
  STANDARD: 'standard',
  STRONG: 'strong',
});

const VALID_LEVELS = new Set(Object.values(HAPTIC_LEVEL));
const ENV_LEVEL = process.env.EXPO_PUBLIC_HAPTIC_LEVEL;
let currentLevel = VALID_LEVELS.has(ENV_LEVEL) ? ENV_LEVEL : HAPTIC_LEVEL.STANDARD;

const SMALL_THROTTLE_MS = 90;
let lastSmallAt = 0;

export function setHapticLevel(level) {
  if (VALID_LEVELS.has(level)) currentLevel = level;
}

export function getHapticLevel() {
  return currentLevel;
}

function canPlay() {
  return Platform.OS !== 'web' && currentLevel !== HAPTIC_LEVEL.OFF;
}

/**
 * Haptics must never break a user flow, so every failure is swallowed — but
 * swallowing silently also hides the most common real cause: a dev build made
 * before expo-haptics was installed has no native module, so every call throws
 * and the app just feels dead. In development we log once so that's visible.
 */
let warnedUnavailable = false;

function reportUnavailable(error) {
  if (!__DEV__ || warnedUnavailable) return;
  warnedUnavailable = true;
  console.warn(
    [
      '[haptics] a haptic call failed — no vibration will play.',
      'If this appears on iOS the native module is missing from the build:',
      'rebuild with  npx eas build -p ios --profile development',
      'If it does NOT appear but you still feel nothing, it is the device:',
      'Settings > Sounds & Haptics > System Haptics must be ON, and Low Power',
      'Mode must be OFF — either one silences all app haptics.',
    ].join(' '),
    error
  );
}

function safely(play) {
  if (!canPlay()) return Promise.resolve();
  try {
    return Promise.resolve(play()).catch(reportUnavailable);
  } catch (e) {
    reportUnavailable(e);
    return Promise.resolve();
  }
}

function androidOrFallback(androidType, fallback) {
  if (Platform.OS === 'android' && Haptics.performAndroidHapticsAsync) {
    return Haptics.performAndroidHapticsAsync(androidType);
  }
  return fallback();
}

/** A quiet acknowledgement for selections, navigation and disclosure. */
export function hapticSmall({ force = false } = {}) {
  const now = Date.now();
  if (!force && now - lastSmallAt < SMALL_THROTTLE_MS) return Promise.resolve();
  lastSmallAt = now;

  return safely(() => {
    if (currentLevel === HAPTIC_LEVEL.SUBTLE) return Haptics.selectionAsync();
    const style = currentLevel === HAPTIC_LEVEL.STRONG
      ? Haptics.ImpactFeedbackStyle.Medium
      : Haptics.ImpactFeedbackStyle.Light;
    return Haptics.impactAsync(style);
  });
}

/** A very soft, rate-limited tick for discrete slider/reorder boundaries. */
export function hapticTick() {
  const now = Date.now();
  if (now - lastSmallAt < SMALL_THROTTLE_MS) return Promise.resolve();
  lastSmallAt = now;

  return safely(() => androidOrFallback(
    Haptics.AndroidHaptics.Segment_Frequent_Tick,
    () => Haptics.selectionAsync()
  ));
}

export function hapticDragStart() {
  return safely(() => androidOrFallback(
    Haptics.AndroidHaptics.Drag_Start,
    () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
  ));
}

export function hapticDragEnd() {
  return safely(() => androidOrFallback(
    Haptics.AndroidHaptics.Gesture_End,
    () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  ));
}

export function hapticToggle(enabled) {
  return safely(() => androidOrFallback(
    enabled ? Haptics.AndroidHaptics.Toggle_On : Haptics.AndroidHaptics.Toggle_Off,
    () => Haptics.selectionAsync()
  ));
}

function notification(type, subtleFallback) {
  return safely(() => {
    if (currentLevel === HAPTIC_LEVEL.SUBTLE) {
      return Haptics.impactAsync(subtleFallback);
    }
    return Haptics.notificationAsync(type);
  });
}

/** Big positive result: completed flows, verified identity, XP and transactions. */
export function hapticSuccess() {
  return notification(
    Haptics.NotificationFeedbackType.Success,
    Haptics.ImpactFeedbackStyle.Medium
  );
}

/** Big caution: rejected limits and destructive confirmations. */
export function hapticWarning() {
  return notification(
    Haptics.NotificationFeedbackType.Warning,
    Haptics.ImpactFeedbackStyle.Medium
  );
}

/** Big negative result: validation, network and transaction failures. */
export function hapticError() {
  return notification(
    Haptics.NotificationFeedbackType.Error,
    Haptics.ImpactFeedbackStyle.Rigid
  );
}

