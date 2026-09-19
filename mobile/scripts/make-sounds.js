#!/usr/bin/env node
/**
 * Generates the app's UI sounds as small mono WAV files.
 *
 * Synthesised rather than sourced so there's no licensing question, the files
 * stay tiny (a few KB), and all three share one voice. The voice is a soft
 * sine with a touch of second/third harmonic and a fast exponential decay —
 * close to a marimba, which sits under the UI instead of on top of it.
 *
 * Run: npm run make-sounds
 */
const fs = require('fs');
const path = require('path');

const RATE = 44100;
const OUT = path.join(__dirname, '..', 'assets', 'sounds');

/** Equal temperament, A4 = 440. */
const note = (n) => 440 * Math.pow(2, (n - 69) / 12);
const C5 = note(72), E5 = note(76), G5 = note(79);
const C6 = note(84), E6 = note(88), G6 = note(91);

/**
 * One struck tone. `attack` keeps the onset from clicking; the harmonics fade
 * faster than the fundamental, which is what makes a struck note sound struck.
 */
function tone(buf, startSec, freq, durSec, gain) {
  const start = Math.floor(startSec * RATE);
  const len = Math.floor(durSec * RATE);
  const attack = Math.floor(0.004 * RATE);

  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const decay = Math.exp(-3.2 * t / durSec);
    const env = (i < attack ? i / attack : 1) * decay;

    const w =
      Math.sin(2 * Math.PI * freq * t) +
      0.28 * Math.exp(-7 * t / durSec) * Math.sin(2 * Math.PI * freq * 2 * t) +
      0.10 * Math.exp(-11 * t / durSec) * Math.sin(2 * Math.PI * freq * 3 * t);

    const idx = start + i;
    if (idx < buf.length) buf[idx] += w * env * gain;
  }
}

function writeWav(name, samples) {
  // Normalise with headroom so nothing clips, then dither-free 16-bit PCM.
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const scale = peak > 0 ? 0.82 / peak : 1;

  const pcm = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * scale * 32767))), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);          // PCM
  header.writeUInt16LE(1, 22);          // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);

  const file = path.join(OUT, name);
  fs.writeFileSync(file, Buffer.concat([header, pcm]));
  console.log(`  ${name.padEnd(16)} ${(fs.statSync(file).size / 1024).toFixed(1)} KB  ${(samples.length / RATE).toFixed(2)}s`);
}

const buffer = (sec) => new Float64Array(Math.ceil(sec * RATE));

fs.mkdirSync(OUT, { recursive: true });
console.log('writing to assets/sounds/');

// XP — two quick rising notes. Fires often, so it stays short and quiet.
{
  const b = buffer(0.45);
  tone(b, 0.000, C6, 0.16, 0.42);
  tone(b, 0.055, G6, 0.34, 0.46);
  writeWav('xp.wav', b);
}

// Article finished — a small three-note climb. A beat longer, still light.
{
  const b = buffer(0.75);
  tone(b, 0.000, C5, 0.22, 0.34);
  tone(b, 0.080, E5, 0.26, 0.36);
  tone(b, 0.160, G5, 0.52, 0.40);
  writeWav('complete.wav', b);
}

// Questionnaire finished — the big one. Arpeggio resolving into a held chord.
{
  const b = buffer(1.5);
  tone(b, 0.000, C5, 0.30, 0.30);
  tone(b, 0.090, E5, 0.34, 0.30);
  tone(b, 0.180, G5, 0.38, 0.32);
  tone(b, 0.270, C6, 1.05, 0.38);
  tone(b, 0.285, E6, 0.95, 0.20);   // quiet third for warmth
  writeWav('milestone.wav', b);
}

// Quiz answer correct — bright, quick, upward.
{
  const b = buffer(0.40);
  tone(b, 0.000, E6, 0.13, 0.34);
  tone(b, 0.048, G6, 0.30, 0.36);
  writeWav('correct.wav', b);
}

// Quiz answer wrong — downward, soft and rounded. This is a learning app; it
// should read as "not quite", never as a buzzer.
{
  const b = buffer(0.45);
  tone(b, 0.000, E5, 0.16, 0.26);
  tone(b, 0.070, C5, 0.34, 0.24);
  writeWav('wrong.wav', b);
}

// Persona reveal — the card turning over. A suspended fourth resolving to the
// third, which is the "ahh" shape. Distinct from milestone, which is the finale.
{
  const b = buffer(1.1);
  tone(b, 0.000, G5, 0.34, 0.26);
  tone(b, 0.070, C6, 0.40, 0.30);
  tone(b, 0.230, note(83), 0.70, 0.22);   // B5, the suspension
  tone(b, 0.330, E6, 0.72, 0.30);         // resolves up to the third
  writeWav('reveal.wav', b);
}

// Page turn — advancing a GoWiser story slide.
//
// Two notes, not one: a single tone is inert, and a short rise is what reads as
// "forward" rather than just "something happened". They sit 32ms apart, which
// is close enough to land as one gesture — a lift and a set-down — instead of
// two beeps.
//
// The pair is safe against correct (E6->G6) and xp (C6->G6) because those live
// an octave-plus higher; register keeps them apart, not note count. Kept low
// and brief so the most frequent cue in the app stays underneath everything.
//
// Note that `gain` is NOT what makes this quiet: writeWav normalises every file
// to the same 0.82 peak, so gain only sets the balance between these two tones
// (the second is the louder, so it reads as the landing). Actual loudness lives
// in VOLUME.page in src/lib/sound.js.
{
  const b = buffer(0.22);
  tone(b, 0.000, note(74), 0.055, 0.11);   // D5 — the lift
  tone(b, 0.032, G5,       0.130, 0.17);   // resolves a fourth up, and lands
  writeWav('page.wav', b);
}
