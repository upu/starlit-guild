import type { StageItem, StageExtra } from "./story-stage-cues.ts";
import { actor, ground, held, npc, type LaterBeat } from "./story-stage-later-shared.ts";

export const recoveryCast = () => [
  actor("aria", 65, { bottom: 39, bow: "aim", left: false }),
  actor("leon", 8, { bottom: 18, sword: true, left: false }),
  actor("mira", 43, { bottom: 62, inspect: true, left: false }),
];
export const recoveryController = (extra: Partial<StageExtra> = {}): StageExtra => ({
  ...npc("masked-pumpety", undefined, 78),
  bottom: 66,
  ...extra,
});
function dolls(figure?: StageItem["figure"]): StageItem[] {
  return [
    { ...ground("golem", 24, 18, 32), figure, travelMs: 1300 },
    { ...ground("puppet", 78, 45, 9), figure: figure === "bow" ? "bow" : undefined, travelMs: 850 },
    {
      ...ground("puppet", 88, 32, 7),
      id: "small-puppet",
      figure: figure === "bow" ? "bow" : undefined,
      travelMs: 850,
    },
  ];
}
const parcel = (owner: "table" | "aria" | "mira"): StageItem =>
  owner === "table"
    ? { ...ground("honey", 90, 66, 6), support: "table" }
    : held("honey", owner, { bottom: 24, width: 6 });
export function recoveryItems(
  owner: "table" | "aria" | "mira",
  figure?: StageItem["figure"],
): StageItem[] {
  return [
    ground("table", 92, 52, 18),
    { ...ground("trade-parcels-open", 97, 66, 7.5), id: "other-goods", support: "table" },
    ground("medicine", 40, 62, 8),
    ...dolls(figure),
    held("cloth", "mira", { bottom: 22, width: 6 }),
    parcel(owner),
  ];
}

/** Keep the shot, pickup and handoff in the first narration, at actual hand contact. */
export const recoveryBeats: LaterBeat[] = [
  {
    at: 0,
    extras: [recoveryController()],
    items: recoveryItems("table"),
    actors: { mira: { x: 48, bottom: 46, inspect: false, pose: "offer", nameOffset: -10 } },
    sequence: [
      { after: 600, actors: { aria: { bow: "release" } } },
      { after: 1000, actors: { aria: { x: 86, bottom: 56, bow: undefined, pose: "offer" } } },
      { after: 2200, actors: { aria: { carry: true } }, items: recoveryItems("aria") },
      {
        after: 3000,
        actors: {
          aria: { x: 56, bottom: 46, left: true, via: [{ x: 72, bottom: 47 }], nameOffset: 10 },
        },
      },
      {
        after: 5000,
        actors: { aria: { carry: false, pose: "offer", via: undefined } },
        items: recoveryItems("mira"),
      },
      {
        after: 5900,
        actors: {
          aria: { x: 54, bottom: 30, nameOffset: 0, left: false },
          mira: { nameOffset: 0 },
        },
      },
    ],
  },
  { at: 1, items: recoveryItems("mira", "kneel"), extras: [recoveryController({ pose: "point" })] },
  { at: 3, actors: { leon: { sword: false, pose: "offer" } } },
  { at: 5, items: recoveryItems("mira", "bow"), extras: [recoveryController()] },
  { at: 6, items: recoveryItems("mira", "kneel") },
  {
    at: 9,
    extras: [recoveryController({ bow: "shallow" })],
    sequence: [{ after: 900, extras: [recoveryController({ bow: "deep" })] }],
  },
  { at: 10, extras: [recoveryController()] },
];
