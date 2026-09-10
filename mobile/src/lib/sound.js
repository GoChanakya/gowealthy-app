import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

/**
 * App-wide UI sounds.
 *
 * Mirrors src/lib/haptics.js deliberately: same level control, same
 * never-throw contract, same one-time dev warning when the native module is
 * missing. Sound is decoration — a failure here must never interrupt a flow.
 *
 * Strength can be set with EXPO_PUBLIC_SOUND_LEVEL=off|subtle|standard, or at
 * runtime through setSoundLevel().
 */
export const SOUND_LEVEL = Object.freeze({
  OFF: 'off',
  SUBTLE: 'subtle',
  STANDARD: 'standard',
});

const VALID = new Set(Object.values(SOUND_LEVEL));
const ENV_LEVEL = process.env.EXPO_PUBLIC_SOUND_LEVEL;
let currentLevel = VALID.has(ENV_LEVEL) ? ENV_LEVEL : SOUND_LEVEL.STANDARD;

/** Per-cue ceiling, so the frequent ones sit lower than the rare ones. */
const VOLUME = {
  tick: 0.16,      // fires constantly — barely there on purpose
  correct: 0.30,
  wrong: 0.26,
  xp: 0.34,
  complete: 0.42,
  reveal: 0.46,
  milestone: 0.55,
};

const SOURCES = {
  tick: require('../../assets/sounds/tick.wav'),
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  xp: require('../../assets/sounds/xp.wav'),
  complete: require('../../assets/sounds/complete.wav'),
  reveal: require('../../assets/sounds/reveal.wav'),
  milestone: require('../../assets/sounds/milestone.wav'),
};

/** Players are created once and reused — recreating one per play is audibly late. */
const players = {};
let configured = false;
let warned = false;

export function setSoundLevel(level) {
  if (VALID.has(level)) currentLevel = level;
}

export function getSoundLevel() {
  return currentLevel;
}

function reportUnavailable(error) {
  if (!__DEV__ || warned) return;
  warned = true;
  console.warn(
    [
      '[sound] a cue failed — no audio will play.',
      'expo-audio is a native module: if this is a dev build made before it',
      'was installed, rebuild with  npx eas build -p android --profile development',
    ].join(' '),
    error
  );
}

/**
 * Play alongside other audio rather than interrupting it, and stay audible on
 * iOS silent switch — these are feedback cues, not media, and a user who has
 * music on shouldn't have it ducked by a 0.4s chime.
 */
async function configureOnce() {
  if (configured) return;
  configured = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });
  } catch (e) {
    reportUnavailable(e);
  }
}

function play(key) {
  if (currentLevel === SOUND_LEVEL.OFF) return;

  try {
    configureOnce();

    if (!players[key]) {
      players[key] = createAudioPlayer(SOURCES[key]);
    }
    const player = players[key];

    player.volume = currentLevel === SOUND_LEVEL.SUBTLE ? VOLUME[key] * 0.55 : VOLUME[key];
    player.seekTo(0);
    player.play();
  } catch (e) {
    reportUnavailable(e);
  }
}

/** A choice was registered. Rate-limited so a fast tapper gets a rhythm, not a buzz. */
const TICK_THROTTLE_MS = 70;
let lastTickAt = 0;
export function soundTick() {
  const now = Date.now();
  if (now - lastTickAt < TICK_THROTTLE_MS) return;
  lastTickAt = now;
  play('tick');
}

/** Quiz answer graded. */
export const soundCorrect = () => play('correct');
export const soundWrong = () => play('wrong');

/** A result being revealed to the user for the first time. */
export const soundReveal = () => play('reveal');

/** XP earned. */
export const soundXP = () => play('xp');

/** A piece of content finished — an article read end to end. */
export const soundComplete = () => play('complete');

/** A real milestone: the questionnaire finished and the plan saved. */
export const soundMilestone = () => play('milestone');

/** Free the native players. Call on logout or teardown, not between screens. */
export function releaseSounds() {
  for (const key of Object.keys(players)) {
    try {
      players[key].remove();
    } catch {
      // A player that's already gone is fine.
    }
    delete players[key];
  }
}
