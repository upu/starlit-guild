import type { GameEvent } from "./game";

let context: AudioContext | null = null,
  master: GainNode | null = null,
  noise: AudioBuffer | null = null;
let enabled = true,
  last = -Infinity,
  lastAccent = -Infinity,
  quietUntil = 0;
const roles: Record<string, string> = {
  aria: "bow",
  leon: "sword",
  mira: "heal",
  finn: "rogue",
  garr: "shield",
  luna: "magic",
  poppy: "gather",
  noel: "song",
};
const priorities: Record<string, number> = {
  combo: 8,
  clear: 6,
  skill: 5,
  heal: 4,
  hurt: 3,
  gather: 2,
  hit: 1,
};

export function setSound(value: boolean) {
  enabled = value;
  if (context && master) {
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(value ? 0.55 : 0, context.currentTime);
  }
}
export function unlockSound() {
  if (!enabled) return;
  try {
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.55;
      master.connect(context.destination);
      noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.4), context.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    void context.resume().catch(() => {});
  } catch {
    /* Audio remains optional. */
  }
}
function tone(
  frequency: number,
  at: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
  end = frequency,
) {
  if (!context || !master) return;
  const source = context.createOscillator(),
    gain = context.createGain();
  source.type = type;
  source.frequency.setValueAtTime(frequency, at);
  source.frequency.exponentialRampToValueAtTime(Math.max(20, end), at + duration);
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  source.connect(gain);
  gain.connect(master);
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
  };
  source.start(at);
  source.stop(at + duration + 0.02);
}
function whoosh(at: number, frequency: number, duration: number, volume: number) {
  if (!context || !master || !noise) return;
  const source = context.createBufferSource(),
    filter = context.createBiquadFilter(),
    gain = context.createGain();
  source.buffer = noise;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(frequency, at);
  filter.frequency.exponentialRampToValueAtTime(frequency * 0.3, at + duration);
  filter.Q.value = 0.7;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.onended = () => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
  source.start(at);
  source.stop(at + duration);
}
/** One foreground cue per simulation batch; a combo wins over ordinary hits. */
export function soundEvents(events: GameEvent[]) {
  const event = events.reduce<GameEvent | undefined>(
    (best, e) => ((priorities[e.kind] || 0) > (best ? priorities[best.kind] || 0 : 0) ? e : best),
    undefined,
  );
  if (event) sound(event.kind, false, event.hero);
}
function reserveCue(kind: string, manual: boolean, now: number) {
  const accent = ["combo", "clear"].includes(kind);
  if (accent && now - lastAccent < 0.5) return null;
  if (!accent && (now < quietUntil || now - last < (manual ? 0.07 : 0.12))) return null;
  if (accent) {
    lastAccent = now;
    quietUntil = now + 0.4;
  }
  last = now;
  return accent;
}
function accentNotes(kind: string) {
  if (kind === "combo") return [392, 494, 587, 784];
  return [523, 659, 784, 1047];
}
function playAccent(kind: string, now: number) {
  accentNotes(kind).forEach((note, index) => {
    tone(note, now + index * 0.085, 0.38, 0.085, "sine");
    tone(note * 2, now + index * 0.085, 0.25, 0.022, "triangle");
  });
}
function playMagic(kind: string, now: number, volume: number) {
  tone(330, now, 0.2, volume, "sine", 880);
  tone(1320, now + 0.12, 0.28, volume * 0.6);
  if (kind === "skill") tone(110, now + 0.15, 0.28, 0.09, "triangle", 55);
}
function playBow(kind: string, now: number) {
  whoosh(now, 2600, 0.16, 0.11);
  tone(700, now, 0.07, 0.07, "triangle", 180);
  tone(180, now + 0.14, 0.09, 0.055, "triangle", 70);
  if (kind === "skill") {
    whoosh(now + 0.13, 3000, 0.16, 0.1);
    tone(210, now + 0.27, 0.08, 0.05, "triangle", 70);
  }
}
const healingCue = (kind: string, role: string) => kind === "heal" || role === "heal";
const gatheringCue = (kind: string, role: string) => kind === "gather" || role === "gather";
const guardingCue = (kind: string, role: string) =>
  kind === "skill" && (role === "shield" || role === "song");
const magicCue = (role: string) => role === "magic" || role === "song";
function playRoleCue(kind: string, role: string, now: number, volume: number) {
  if (healingCue(kind, role)) {
    [523, 659, 880].forEach((note, index) => {
      tone(note, now + index * 0.065, 0.3, 0.06);
    });
    return;
  }
  if (kind === "hurt") {
    whoosh(now, 250, 0.14, 0.12);
    tone(100, now, 0.18, 0.11, "triangle", 38);
    return;
  }
  if (gatheringCue(kind, role)) {
    tone(1175, now, 0.13, volume);
    tone(1568, now + 0.05, 0.17, volume * 0.45);
    return;
  }
  if (guardingCue(kind, role)) {
    [330, 495, 660].forEach((note, index) => {
      tone(note, now + index * 0.035, 0.32, 0.06, role === "shield" ? "triangle" : "sine");
    });
    return;
  }
  if (magicCue(role)) {
    playMagic(kind, now, volume);
    return;
  }
  if (role === "bow") {
    playBow(kind, now);
    return;
  }
  whoosh(now, role === "rogue" ? 3200 : 1700, kind === "skill" ? 0.23 : 0.13, volume * 1.3);
  tone(kind === "skill" ? 210 : 150, now + 0.025, 0.14, volume, "triangle", 45);
  if (kind === "skill") tone(880, now + 0.045, 0.15, 0.04, "sine", 440);
}
export function sound(kind: string, manual = false, hero?: string) {
  if (!enabled || !context || !master || context.state !== "running") return;
  const now = context.currentTime,
    accent = reserveCue(kind, manual, now);
  if (accent === null) return;
  if (accent) {
    playAccent(kind, now);
    return;
  }
  playRoleCue(kind, hero ? roles[hero] : "sword", now, manual ? 0.12 : 0.085);
}
