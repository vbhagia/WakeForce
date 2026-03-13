#!/usr/bin/env node
/**
 * WakeForce Sound Generator
 * Generates placeholder alarm WAV files for development testing.
 * Run: node scripts/generateSounds.js
 * 
 * For production, replace with professionally designed audio files.
 * See assets/sounds/README.md for guidance.
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../assets/sounds');

// ─── WAV file builder ─────────────────────────────────────────────────────────

function writeWav(filename, samples, sampleRate = 44100) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = samples.length * 2; // 16-bit = 2 bytes per sample
  const fileSize = 36 + dataSize;

  const buf = Buffer.alloc(44 + dataSize);
  // RIFF header
  buf.write('RIFF', 0);
  buf.writeUInt32LE(fileSize, 4);
  buf.write('WAVE', 8);
  // fmt chunk
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);       // chunk size
  buf.writeUInt16LE(1, 20);        // PCM
  buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(bitsPerSample, 34);
  // data chunk
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  // samples
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  const outPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outPath, buf);
  console.log(`✓ Written: ${outPath} (${(buf.length / 1024).toFixed(1)} KB)`);
}

// ─── Sound generators ─────────────────────────────────────────────────────────

const SR = 44100;

/**
 * Gentle: soft sine wave with 2-second fade in, at 440 Hz (A4), 8 seconds total.
 * Loops in the app, so just need one clean cycle with fade.
 */
function generateGentle() {
  const duration = 8; // seconds
  const freq = 440;
  const samples = [];

  for (let i = 0; i < SR * duration; i++) {
    const t = i / SR;
    // Slow fade in over 2 seconds
    const envelope = Math.min(t / 2, 1) * 0.4;
    // Sine tone + subtle overtone for warmth
    const wave = Math.sin(2 * Math.PI * freq * t) * 0.8
               + Math.sin(2 * Math.PI * freq * 2 * t) * 0.15
               + Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.05;
    samples.push(wave * envelope);
  }

  writeWav('gentle.wav', samples);
  console.log('  → Gentle: soft 440Hz sine, 8s, slow fade in');
}

/**
 * Intense: sharp attack, high frequency buzzing pattern.
 * Alternates between 880 Hz and 1200 Hz in 200ms bursts for maximum disruption.
 */
function generateIntense() {
  const duration = 4; // seconds (loops)
  const samples = [];

  for (let i = 0; i < SR * duration; i++) {
    const t = i / SR;
    // Alternate frequency every 200ms to prevent habituation
    const phase200 = Math.floor(t / 0.2) % 2;
    const freq = phase200 === 0 ? 880 : 1200;
    // Add some harmonic distortion (clipped sine = harsher, more "alarm-like")
    let wave = Math.sin(2 * Math.PI * freq * t);
    // Soft clip to add harmonics
    wave = wave * 1.5;
    wave = Math.tanh(wave);
    // Pulse envelope: on/off pattern (100ms on, 20ms off)
    const cyclePos = t % 0.12;
    const gating = cyclePos < 0.10 ? 1 : 0;
    samples.push(wave * gating * 0.9);
  }

  writeWav('intense.wav', samples);
  console.log('  → Intense: 880/1200Hz alternating, pulsed, 4s loop');
}

// ─── Run ──────────────────────────────────────────────────────────────────────

console.log('\n🔊 WakeForce Sound Generator\n');
console.log(`Output: ${OUTPUT_DIR}\n`);

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

generateGentle();
generateIntense();

console.log(`
✅ Done!

Note: These are .wav files. Expo's Audio supports WAV natively.
Update audioEngine.js require() paths to use .wav extension,
OR convert to .mp3 using ffmpeg:
  ffmpeg -i assets/sounds/gentle.wav assets/sounds/gentle.mp3
  ffmpeg -i assets/sounds/intense.wav assets/sounds/intense.mp3

For production, replace with professionally mastered audio.
See assets/sounds/README.md for psychoacoustic design guidance.
`);
