import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

/**
 * App-wide UI sounds. Never throws — sound is decoration.
 * Level: EXPO_PUBLIC_SOUND_LEVEL=off|subtle|standard, or setSoundLevel().
 */
export const SOUND_LEVEL = Object.freeze({
  OFF: 'off',
  SUBTLE: 'subtle',
  STANDARD: 'standard',
});

const VALID = new Set(Object.values(SOUND_LEVEL));
const ENV_LEVEL = process.env.EXPO_PUBLIC_SOUND_LEVEL;
let currentLevel = VALID.has(ENV_LEVEL) ? ENV_LEVEL : SOUND_LEVEL.STANDARD;

const VOLUME = {
  notification: 0.5,
  answer: 0.6,
  xp: 0.7,
  reveal: 0.7,
};

const SOURCES = {
  notification: require('../sounds/notification.mp3.mpeg'),
  answer: require('../sounds/sound on answer tap.mp3.mpeg'),
  xp: require('../sounds/Blog_xp_earned.mp3.mpeg'),
  reveal: require('../sounds/persona_reveal.mp3.mpeg'),
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
  console.warn('[sound] a cue failed — no audio will play.', error);
}

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

/** Advancing a page in a GoWiser story. */
export const soundPage = () => play('notification');

/** Quiz answer tapped (right or wrong). */
export const soundAnswer = () => play('answer');

/** Persona result revealed. */
export const soundReveal = () => play('reveal');

/** XP earned. */
export const soundXP = () => play('xp');

/** Free the native players. Call on logout or teardown. */
export function releaseSounds() {
  for (const key of Object.keys(players)) {
    try {
      players[key].remove();
    } catch {
      // Already gone.
    }
    delete players[key];
  }
}
