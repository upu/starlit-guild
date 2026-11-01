import type { StageActor, StoryStageCue, StageMoment, StageItem } from "../story-stage-cues.ts";

export type OpeningCast = Partial<Record<"aria" | "leon", Partial<StageActor>>>;
export function openingCast(cue: StoryStageCue, poses: OpeningCast = {}): StageActor[] {
  return cue.actors.map((a) => ({
    ...a,
    x: a.id === "aria" ? 34 : 68,
    bottom: a.id === "aria" ? 14 : 10,
    left: a.id === "leon",
    carry: false,
    inspect: false,
    writing: false,
    packing: false,
    routeNotes: undefined,
    holdingWalk: false,
    via: undefined,
    wristPoints: {
      ...a.wristPoints,
      4: [90, 69],
      13: [87, 109],
      14: a.id === "aria" ? [86, 76] : [82, 72],
      17: [75, 68],
      18: [75, 68],
    },
    ...poses[a.id as "aria" | "leon"],
  }));
}
export function openingMoment(
  cue: StoryStageCue,
  after: number,
  poses: OpeningCast,
  items: StageItem[],
): StageMoment {
  return { after, actors: openingCast(cue, poses), items, extras: cue.extras };
}
export const mapCast: OpeningCast = {
  aria: { x: 40.7, bottom: 14, pose: "offer" },
  leon: { x: 63.3, bottom: 14, pose: "offer" },
};
export const archiveArrivalCast: OpeningCast = {
  ...mapCast,
  aria: {
    ...mapCast.aria,
    via: [
      { x: 65, bottom: 0 },
      { x: 40.7, bottom: 0 },
    ],
  },
  leon: { ...mapCast.leon, carry: true },
};
export const copyCast: OpeningCast = {
  aria: { x: 32.0625, bottom: 6.28125, pose: "offer", nameAbove: true, nameOffset: -20 },
  leon: { x: 39, bottom: 6, carry: true },
};
