import { mkdir, writeFile } from "node:fs/promises";

// Original scores. Deterministic offline synthesis keeps playback cheap on phones.
const rate = 24000,
  tau = 2 * Math.PI;
const tracks = [
  {
    id: "camp",
    title: "星灯りの焚き火",
    bpm: 80,
    chords: [
      [48, 55, 60, 64, 71],
      [45, 52, 57, 60, 67],
      [41, 48, 53, 57, 64],
      [43, 50, 55, 60, 62],
    ],
    melody: [
      [
        [76, 0, 1.5],
        [79, 2, 1],
        [76, 3, 1],
      ],
      [
        [72, 0, 2],
        [71, 2.5, 1],
      ],
      [
        [69, 0, 1],
        [72, 1.5, 1.5],
        [76, 3, 1],
      ],
      [[74, 0, 2.5]],
      [
        [76, 0, 1],
        [79, 1.5, 1],
        [81, 3, 1],
      ],
      [
        [79, 0, 1.5],
        [76, 2, 1.5],
      ],
      [
        [72, 0, 2],
        [69, 2.5, 1],
      ],
      [
        [71, 0, 1],
        [74, 1.5, 1],
        [79, 3, 1],
      ],
      [
        [83, 0, 1.5],
        [81, 2, 1],
        [79, 3, 1],
      ],
      [
        [76, 0, 2],
        [72, 2.5, 1],
      ],
      [
        [77, 0, 1.5],
        [76, 2, 1],
        [72, 3, 1],
      ],
      [[74, 0, 2.5]],
      [
        [76, 0, 1.5],
        [79, 2, 1.5],
      ],
      [
        [76, 0, 1],
        [72, 1.5, 1],
        [71, 3, 1],
      ],
      [
        [69, 0, 1.5],
        [72, 2, 1.5],
      ],
      [
        [74, 0, 1.5],
        [71, 2, 1],
      ],
    ],
  },
  {
    id: "journey",
    title: "木漏れ日の小径",
    bpm: 96,
    chords: [
      [50, 57, 60, 65, 69],
      [43, 50, 55, 59, 64],
      [48, 55, 60, 64, 67],
      [45, 52, 57, 60, 67],
    ],
    melody: [
      [
        [74, 0, 0.75],
        [77, 1, 1],
        [81, 2.5, 1],
      ],
      [
        [79, 0, 1],
        [76, 1.5, 0.75],
        [74, 2.5, 1],
      ],
      [
        [76, 0, 0.75],
        [79, 1, 1],
        [84, 2.5, 1],
      ],
      [
        [83, 0, 1],
        [79, 1.5, 1],
        [76, 3, 0.75],
      ],
      [
        [77, 0, 1],
        [81, 1.5, 0.75],
        [79, 2.5, 1],
      ],
      [
        [76, 0, 1.5],
        [74, 2, 1.5],
      ],
      [
        [72, 0, 0.75],
        [76, 1, 1],
        [79, 2.5, 1],
      ],
      [
        [76, 0, 1.5],
        [72, 2, 1.5],
      ],
      [
        [81, 0, 1],
        [84, 1.5, 1],
        [86, 3, 0.75],
      ],
      [
        [83, 0, 1.5],
        [79, 2, 1.5],
      ],
      [
        [84, 0, 0.75],
        [83, 1, 1],
        [79, 2.5, 1],
      ],
      [
        [81, 0, 1],
        [79, 1.5, 1],
        [76, 3, 0.75],
      ],
      [
        [77, 0, 1],
        [74, 1.5, 0.75],
        [72, 2.5, 1],
      ],
      [
        [74, 0, 0.75],
        [76, 1, 1],
        [79, 2.5, 1],
      ],
      [
        [76, 0, 1.5],
        [72, 2, 1.5],
      ],
      [
        [71, 0, 1],
        [72, 1.5, 1],
        [76, 3, 0.75],
      ],
    ],
  },
];

function compose(track) {
  const beat = 60 / track.bpm,
    length = Math.round(16 * 4 * beat * rate),
    samples = new Float64Array(length);
  function note(midi, at, duration, volume, voice) {
    const freq = 440 * 2 ** ((midi - 69) / 12),
      start = Math.round(at * rate),
      tail = voice === "pad" ? 1.2 : 0.7;
    const count = Math.round((duration + tail) * rate);
    for (let i = 0; i < count; i++) {
      const t = i / rate,
        phase = tau * freq * t;
      let env, wave;
      if (voice === "pluck") {
        env = Math.min(1, t / 0.005) * Math.exp(-t / Math.max(0.2, duration * 0.6));
        wave =
          Math.sin(phase) +
          0.32 * Math.sin(phase * 2) * Math.exp(-t * 8) +
          0.12 * Math.sin(phase * 3) * Math.exp(-t * 12);
      } else if (voice === "flute") {
        env = Math.min(1, t / 0.07) * Math.min(1, Math.max(0, (duration + 0.25 - t) / 0.35));
        const vibrato = 0.017 * Math.sin(tau * 4.8 * t) * Math.min(1, t * 2);
        wave =
          Math.sin(phase + vibrato) +
          0.14 * Math.sin(phase * 2 + vibrato) +
          0.04 * Math.sin(phase * 3);
      } else if (voice === "pad") {
        env = Math.min(1, t / 0.45) * Math.min(1, Math.max(0, (duration + tail - t) / tail));
        wave =
          (Math.sin(phase) + 0.35 * Math.sin(phase * 1.0015) + 0.15 * Math.sin(phase * 2)) * 0.65;
      } else {
        env = Math.min(1, t / 0.025) * Math.exp(-t / Math.max(0.25, duration * 0.8));
        wave = Math.sin(phase) + 0.12 * Math.sin(phase * 2);
      }
      const value = wave * env * volume;
      // Wrap release and echoes through the beginning for a continuous loop seam.
      samples[(start + i) % length] += value;
      if (voice !== "bass") {
        samples[(start + i + Math.round(rate * 0.187)) % length] += value * 0.16;
        samples[(start + i + Math.round(rate * 0.359)) % length] += value * 0.08;
      }
    }
  }
  for (let bar = 0; bar < 16; bar++) {
    const chord = track.chords[bar % 4],
      at = bar * 4 * beat;
    for (const n of chord.slice(1)) note(n, at, 3.6 * beat, 0.035, "pad");
    note(chord[0], at, 1.7 * beat, 0.11, "bass");
    if (track.id === "journey") note(chord[0] + 12, at + 2 * beat, 1.3 * beat, 0.065, "bass");
    const pattern = track.id === "camp" ? [0, 2, 1, 3] : [0, 1, 2, 1, 3, 2, 1, 2];
    pattern.forEach((index, j) =>
      note(
        chord[index + 1] + 12,
        at + ((j * 4) / pattern.length) * beat,
        0.6 * beat,
        0.065 * (j % 2 ? 0.8 : 1),
        "pluck",
      ),
    );
    for (const [midi, offset, duration] of track.melody[bar])
      note(midi, at + offset * beat, duration * beat, 0.13, "flute");
    if (bar % 4 === 0) note(chord[3] + 24, at, 0.9, 0.027, "pluck");
  }
  const dc = samples.reduce((a, b) => a + b, 0) / length;
  let peak = 0;
  for (let i = 0; i < length; i++) {
    samples[i] -= dc;
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  const scale = 0.76 / peak,
    pcm = Buffer.alloc(44 + length * 2);
  pcm.write("RIFF");
  pcm.writeUInt32LE(pcm.length - 8, 4);
  pcm.write("WAVEfmt ", 8);
  pcm.writeUInt32LE(16, 16);
  pcm.writeUInt16LE(1, 20);
  pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(rate, 24);
  pcm.writeUInt32LE(rate * 2, 28);
  pcm.writeUInt16LE(2, 32);
  pcm.writeUInt16LE(16, 34);
  pcm.write("data", 36);
  pcm.writeUInt32LE(length * 2, 40);
  let squares = 0;
  for (let i = 0; i < length; i++) {
    const sample = samples[i] * scale;
    squares += sample * sample;
    pcm.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }
  return {
    pcm,
    stats: {
      title: track.title,
      bpm: track.bpm,
      seconds: length / rate,
      peak: 0.76,
      rms: Math.sqrt(squares / length),
      seamDelta: Math.abs(samples[0] - samples[length - 1]) * scale,
    },
  };
}
await mkdir("assets/source/music", { recursive: true });
for (const track of tracks) {
  const { pcm, stats } = compose(track);
  await writeFile(`assets/source/music/${track.id}.wav`, pcm);
  console.log(track.id, stats);
}
