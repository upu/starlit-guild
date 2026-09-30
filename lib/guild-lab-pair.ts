import type { LabFeeling } from "./guild-lab-affection.ts";
import type { LabCharacterId } from "./guild-lab-rig.ts";

export type LabPairBeat = "sip" | "push" | "take" | "offer" | "surprised" | "shy" | "accept";
export function labLookDirection(fromX: number, toX: number, facingLeft: boolean) {
  return ((toX - fromX) / 80) * (facingLeft ? -1 : 1);
}
const beats: readonly [number, LabPairBeat][] = [
  [0, "sip"],
  [6000, "push"],
  [8000, "take"],
  [11000, "offer"],
  [13500, "surprised"],
  [14200, "shy"],
  [16000, "accept"],
];
const moods: Record<LabPairBeat, Partial<Record<LabCharacterId, Partial<LabFeeling>>>> = {
  sip: {},
  push: {
    leon: { expression: "neutral", mark: "thought" },
    aria: { expression: "neutral", mark: null },
  },
  take: { aria: { expression: "smile", mark: "note" } },
  offer: { aria: { expression: "smile", mark: "note" } },
  surprised: { leon: { expression: "surprised", mark: "notice" } },
  shy: { leon: { expression: "shy", blush: true, mark: "thought" } },
  accept: { leon: { expression: "smile", mark: "note" } },
};
export function labPairBeat(time: number): LabPairBeat {
  const phase = ((time % 20000) + 20000) % 20000;
  let beat: LabPairBeat = "sip";
  for (const [start, name] of beats) if (phase >= start) beat = name;
  return beat;
}
export function labPairFeeling(
  original: LabFeeling,
  character: LabCharacterId,
  beat: LabPairBeat,
  reduced: boolean,
): LabFeeling {
  const feeling = { ...original };
  // A direct tap belongs to the player and takes precedence over this quiet
  // wordless interaction. No heart mark is used between the characters.
  if (original.jump > 0 || original.squash > 0 || original.mark === "heart") return feeling;
  Object.assign(feeling, moods[beat][character]);
  if (beat !== "sip" && original.look === 0) feeling.look = character === "leon" ? -0.04 : 0.04;
  if (reduced) {
    feeling.jump = 0;
    feeling.squash = 0;
    feeling.stretch = 0;
    feeling.look = 0;
  }
  return feeling;
}
function sharedBite(beat: LabPairBeat, phase: number, reduced: boolean) {
  const ease = (start: number, end: number) =>
    Math.max(0, Math.min(1, (phase - start) / (end - start)));
  switch (beat) {
    case "take":
      return {
        x: reduced ? 357 : 340 + 17 * ease(8000, 9500),
        y: reduced ? 345 : 356 - 11 * ease(8000, 9500),
      };
    case "offer":
      return { x: reduced ? 332 : 354 - 30 * ease(11800, 13500), y: 352 };
    case "accept":
      return { x: 294, y: 352 };
    default:
      return null;
  }
}
export function labSharingProps(time: number, reduced: boolean) {
  const phase = ((time % 20000) + 20000) % 20000;
  const beat = labPairBeat(time);
  const ease = (start: number, end: number) =>
    Math.max(0, Math.min(1, (phase - start) / (end - start)));
  const dishX = reduced ? 340 : 300 + 40 * ease(6500, 7600);
  const bite = sharedBite(beat, phase, reduced);
  return { beat, dishX, bite };
}
export function labPairHand(character: LabCharacterId, beat: LabPairBeat, time = 0) {
  const phase = ((time % 20000) + 20000) % 20000;
  const intervals: Record<Exclude<LabPairBeat, "sip">, readonly [number, number]> = {
    push: [6000, 8000],
    take: [8000, 11000],
    offer: [11000, 13500],
    surprised: [13500, 14200],
    shy: [14200, 16000],
    accept: [16000, 20000],
  };
  const active =
    (character === "leon" && (beat === "push" || beat === "accept")) ||
    (character === "aria" && (beat === "take" || beat === "offer"));
  if (active) {
    const [start, end] = intervals[beat as Exclude<LabPairBeat, "sip">];
    const amount = Math.max(0, Math.min(1, (phase - start) / 280, (end - phase) / 280));
    const target = character === "leon" ? { x: 48, y: 20 } : { x: 54, y: 13 };
    return { ...target, amount };
  }
  return null;
}
