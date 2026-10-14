import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// A piano arrangement of the familiar Happy Birthday melody for Bukky. Run with:
// node scripts/generate-birthday-piano.mjs
const sampleRate = 32000;
const eighth = 60 / 96 / 2;
const barLength = eighth * 6;
const bars = 18;
const seconds = barLength * bars;
const frames = Math.round(seconds * sampleRate);
const left = new Float32Array(frames);
const right = new Float32Array(frames);

const verseChords = [
  { bass: 50, notes: [57, 61, 62, 66] }, // D
  { bass: 45, notes: [52, 55, 61, 64] }, // A7
  { bass: 50, notes: [57, 61, 62, 66] }, // D
  { bass: 45, notes: [52, 55, 59, 62] }, // A7sus4
  { bass: 50, notes: [57, 61, 62, 66] }, // D
  { bass: 47, notes: [54, 57, 62, 66] }, // Bm7
  { bass: 43, notes: [50, 54, 59, 62] }, // Gmaj7
  { bass: 45, notes: [52, 55, 61, 64] }, // A7
  { bass: 50, notes: [57, 61, 64, 66] }  // Dmaj9
];
const chords = [...verseChords, ...verseChords];

// [eighth-note position, MIDI pitch, length in eighths], in D major.
const birthdayMelody = [
  [0, 69, 0.8], [1, 69, 0.8], [2, 71, 1.8], [4, 69, 1.8], [6, 74, 1.8], [8, 73, 3.8],
  [12, 69, 0.8], [13, 69, 0.8], [14, 71, 1.8], [16, 69, 1.8], [18, 76, 1.8], [20, 74, 3.8],
  [24, 69, 0.8], [25, 69, 0.8], [26, 81, 1.8], [28, 78, 1.8], [30, 74, 1.8], [32, 73, 1.8], [34, 71, 3.8],
  [38, 79, 0.8], [39, 79, 0.8], [40, 78, 1.8], [42, 74, 1.8], [44, 76, 1.8], [46, 74, 3.8]
];

function addNote(midi, start, length, volume) {
  const frequency = 440 * 2 ** ((midi - 69) / 12);
  const first = Math.round(start * sampleRate);
  const noteFrames = Math.round(Math.min(length + 0.9, 2.5) * sampleRate);
  const pan = Math.max(-0.6, Math.min(0.6, (midi - 61) / 40));
  const leftGain = Math.sqrt((1 - pan) / 2);
  const rightGain = Math.sqrt((1 + pan) / 2);
  const phases = [1, 2.003, 3.012, 4.032, 5.055].map(partial => 2 * Math.PI * frequency * partial / sampleRate);

  for (let i = 0; i < noteFrames; i++) {
    const t = i / sampleRate;
    const attack = 1 - Math.exp(-t * 900);
    const release = t > length ? Math.exp(-(t - length) * 6.2) : 1;
    const envelope = attack * release;
    const fundamental = Math.sin(phases[0] * i) * Math.exp(-t * 1.15);
    const stringBeat = Math.sin(phases[0] * i * 1.0008) * Math.exp(-t * 1.4);
    const upper = 0.38 * Math.sin(phases[1] * i) * Math.exp(-t * 3.1)
      + 0.19 * Math.sin(phases[2] * i) * Math.exp(-t * 4.2)
      + 0.085 * Math.sin(phases[3] * i) * Math.exp(-t * 5.2)
      + 0.03 * Math.sin(phases[4] * i) * Math.exp(-t * 6.1);
    const value = (fundamental * 0.86 + stringBeat * 0.09 + upper) * envelope * volume;
    const index = (first + i) % frames;
    left[index] += value * leftGain;
    right[index] += value * rightGain;
  }
}

function addSoftBeat(start, backbeat) {
  const first = Math.round(start * sampleRate);
  const beatFrames = Math.round((backbeat ? 0.12 : 0.2) * sampleRate);
  let seed = 173 + first;
  let previousNoise = 0;
  for (let i = 0; i < beatFrames; i++) {
    const t = i / sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    const value = backbeat
      ? ((noise - previousNoise) * 0.026 + Math.sin(2 * Math.PI * 190 * t) * 0.01) * Math.exp(-t * 52)
      : Math.sin(2 * Math.PI * (78 - 80 * t) * t) * 0.06 * Math.exp(-t * 25);
    previousNoise = noise;
    const index = (first + i) % frames;
    left[index] += value * 0.7;
    right[index] += value * 0.7;
  }
}

for (let bar = 0; bar < bars; bar++) {
  const chord = chords[bar];
  const at = bar * barLength;
  // Bright three-beat piano rhythm: low note, chord, chord.
  addNote(chord.bass, at, eighth * 1.8, 0.21);
  addNote(chord.bass + 7, at + eighth * 5.55, eighth * 0.4, 0.055);
  addSoftBeat(at, false);
  [2, 4].forEach(position => addSoftBeat(at + eighth * position, true));
  [2, 4].forEach((position, hit) => chord.notes.forEach((note, i) => {
    addNote(note, at + eighth * position + i * 0.012, eighth * (hit ? 0.7 : 0.85), hit ? 0.067 : 0.077);
  }));
  [1, 3, 5].forEach((position, i) => addNote(chord.notes[[2, 3, 1][i]] + 12, at + eighth * position, eighth * 0.5, 0.043));
}

for (let pass = 0; pass < 2; pass++) {
  const offset = pass * 54;
  for (const [position, pitch, duration] of birthdayMelody) {
    addNote(pitch, eighth * (offset + position), eighth * duration, pass ? 0.22 : 0.2);
    if (pass && pitch >= 74 && duration > 3) addNote(pitch - 12, eighth * (offset + position), eighth * duration, 0.045);
  }
}

// Two quiet, short cross-channel echoes give the piano a small-room sound.
const dryLeft = left.slice();
const dryRight = right.slice();
const delayA = Math.round(sampleRate * 0.113);
const delayB = Math.round(sampleRate * 0.207);
for (let i = 0; i < frames; i++) {
  left[i] += dryRight[(i - delayA + frames) % frames] * 0.12 + dryLeft[(i - delayB + frames) % frames] * 0.07;
  right[i] += dryLeft[(i - delayA + frames) % frames] * 0.12 + dryRight[(i - delayB + frames) % frames] * 0.07;
}

let peak = 0;
for (let i = 0; i < frames; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
const scale = 0.78 / peak;
const dataSize = frames * 4;
const wav = Buffer.alloc(44 + dataSize);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + dataSize, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 4, 28);
wav.writeUInt16LE(4, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(dataSize, 40);
for (let i = 0; i < frames; i++) {
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i] * scale)) * 32767), 44 + i * 4);
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i] * scale)) * 32767), 46 + i * 4);
}

const destination = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "audio", "bukky-birthday-tune.wav");
await mkdir(path.dirname(destination), { recursive: true });
await writeFile(destination, wav);
console.log(`Wrote ${destination} (${seconds.toFixed(1)} seconds, ${(wav.length / 1024 / 1024).toFixed(1)} MB)`);
