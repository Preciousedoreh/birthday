import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// An original birthday piano groove for Bukky, with a clear 4/4 pulse. Run with:
// node scripts/generate-birthday-piano.mjs
const sampleRate = 32000;
const eighth = 60 / 96 / 2;
const barLength = eighth * 8;
const bars = 16;
const seconds = barLength * bars;
const frames = Math.round(seconds * sampleRate);
const left = new Float32Array(frames);
const right = new Float32Array(frames);

const chords = [
  { bass: 50, notes: [57, 61, 64, 66] }, // Dmaj9
  { bass: 47, notes: [54, 57, 61, 62] }, // Bm9
  { bass: 43, notes: [50, 54, 57, 59] }, // Gmaj9
  { bass: 45, notes: [52, 55, 59, 61] }, // A13
  { bass: 42, notes: [49, 52, 56, 57] }, // F#m9
  { bass: 47, notes: [54, 57, 60, 63] }, // B7b9
  { bass: 40, notes: [47, 50, 54, 55] }, // Em9
  { bass: 45, notes: [52, 55, 59, 62] }, // A7sus4
  { bass: 50, notes: [57, 61, 64, 66] },
  { bass: 42, notes: [49, 52, 58, 61] }, // F#7
  { bass: 47, notes: [54, 57, 61, 64] }, // Bm11
  { bass: 40, notes: [47, 50, 56, 61] }, // E9
  { bass: 43, notes: [50, 54, 57, 59] },
  { bass: 45, notes: [52, 55, 61, 64] }, // A7
  { bass: 50, notes: [57, 61, 64, 66] },
  { bass: 50, notes: [57, 59, 64, 66] }  // D6/9
];

// Each melody item is [eighth-note position, MIDI pitch, length in eighths].
const melody = [
  [[0, 69, 1], [1.5, 73, 0.7], [3, 76, 1], [5.5, 74, 0.8], [7, 73, 0.7]],
  [[0, 71, 1], [2, 69, 0.7], [3.5, 66, 0.9], [5.5, 69, 0.7], [7, 73, 0.7]],
  [[0, 67, 1], [1.5, 71, 0.8], [3, 74, 1], [5.5, 76, 0.8], [7, 74, 0.7]],
  [[0, 73, 0.8], [1.5, 71, 0.7], [3, 69, 1.2], [6, 76, 0.8]],
  [[0, 69, 1], [1.5, 73, 0.7], [3, 76, 0.9], [5.5, 78, 0.8], [7, 76, 0.7]],
  [[0, 76, 1], [2, 74, 0.7], [3.5, 72, 0.9], [5.5, 71, 0.8], [7, 74, 0.7]],
  [[0, 71, 1], [1.5, 74, 0.8], [3, 78, 1], [5.5, 76, 0.8], [7, 74, 0.7]],
  [[0, 76, 0.9], [1.5, 74, 0.7], [3, 73, 1], [5.5, 69, 0.8], [7, 73, 0.7]],
  [[0, 69, 0.8], [1, 73, 0.8], [2.5, 76, 0.7], [4, 81, 1], [6.5, 78, 0.8]],
  [[0, 80, 0.9], [1.5, 78, 0.7], [3, 76, 1], [5.5, 73, 0.8], [7, 76, 0.7]],
  [[0, 74, 0.9], [1.5, 78, 0.8], [3, 81, 1], [5.5, 78, 0.8], [7, 76, 0.7]],
  [[0, 76, 1], [2, 73, 0.8], [3.5, 71, 0.9], [5.5, 73, 0.8], [7, 76, 0.7]],
  [[0, 74, 0.9], [1.5, 76, 0.7], [3, 78, 1], [5.5, 74, 0.8], [7, 71, 0.7]],
  [[0, 73, 0.9], [1.5, 71, 0.7], [3, 69, 1], [5.5, 76, 0.8], [7, 78, 0.7]],
  [[0, 78, 1], [1.5, 76, 0.8], [3, 73, 1], [5.5, 74, 0.8], [7, 76, 0.7]],
  [[0, 73, 0.9], [1.5, 69, 0.8], [3, 66, 1], [5.5, 62, 0.9]]
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
  // Bass on beats one and three, piano chords on two and four, light offbeat pickups.
  addNote(chord.bass, at, eighth * 1.55, 0.23);
  addNote(chord.bass + 12, at + eighth * 4, eighth * 1.1, 0.16);
  addNote(chord.bass + 7, at + eighth * 7.4, eighth * 0.45, 0.075);
  [0, 4].forEach(position => addSoftBeat(at + eighth * position, false));
  [2, 6].forEach(position => addSoftBeat(at + eighth * position, true));
  [2, 6].forEach((position, hit) => chord.notes.forEach((note, i) => {
    addNote(note, at + eighth * position + i * 0.012, eighth * (hit ? 0.75 : 0.9), hit ? 0.073 : 0.088);
  }));
  [1, 5].forEach((position, i) => addNote(chord.notes[i ? 1 : 3] + 12, at + eighth * position, eighth * 0.6, 0.07));
  [3.5, 7.25].forEach((position, i) => addNote(chord.notes[i ? 3 : 2] + 12, at + eighth * position, eighth * 0.45, 0.047));
  melody[bar].forEach(([position, pitch, duration], i) => {
    addNote(pitch, at + eighth * position, eighth * duration, i === 0 ? 0.19 : 0.17);
  });
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

const destination = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "audio", "bukky-piano-groove.wav");
await mkdir(path.dirname(destination), { recursive: true });
await writeFile(destination, wav);
console.log(`Wrote ${destination} (${seconds.toFixed(1)} seconds, ${(wav.length / 1024 / 1024).toFixed(1)} MB)`);
