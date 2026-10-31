import type { StageItem, StageExtra } from "./story-stage-cues.ts";
import { actor, ground, held, npc, type LaterBeat } from "./story-stage-later-shared.ts";

export const recoveryCast = () => [
  actor("aria", 65, { bottom: 39, bow: "aim", left: false, dressed: true }),
  actor("leon", 8, { bottom: 18, push: "brace", left: false, dressed: true }),
  actor("mira", 43, { bottom: 62, inspect: true, left: false }),
];
export const recoveryController = (extra: Partial<StageExtra> = {}): StageExtra => ({
  ...npc("masked-pumpety", undefined, 78),
  bottom: 66,
  ...extra,
});
type Contact = "brace" | "push" | "hit" | "step" | "clear";
function dolls(figure?: StageItem["figure"], contact: Contact = "clear"): StageItem[] {
  const golemX = { brace: 24, push: 27, hit: 30, step: 30, clear: 30 }[contact];
  const offTable = contact === "clear" || contact === "step";
  return [
    {
      ...ground("golem", golemX, 18, 32),
      figure,
      travelMs: 500,
      backstep: true,
    },
    {
      ...ground("puppet", contact === "clear" ? 98 : 82, offTable ? 46 : 58, 9),
      figure: figure === "bow" ? "bow" : contact === "hit" ? "recoil" : undefined,
      left: true,
      support: offTable ? undefined : "table",
      travelMs: contact === "step" ? 400 : 650,
      backstep: true,
    },
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
    ? { ...ground("honey", 87, 66, 6), support: "table" }
    : held("honey", owner, { bottom: 24, width: 6 });
export const parcelCloth = (owner: "table" | "aria" | "mira"): StageItem =>
  owner === "table"
    ? { ...ground("packing-cloth", 87, 65, 10), id: "loot-cloth", support: "table" }
    : held("packing-cloth", owner, { id: "loot-cloth", bottom: 23, width: 10 });
export function recoveryItems(
  owner: "table" | "aria" | "mira",
  figure?: StageItem["figure"],
  contact: Contact = "clear",
): StageItem[] {
  return [
    ground("table", 92, 52, 18),
    { ...ground("trade-parcels-open", 97, 66, 7.5), id: "other-goods", support: "table" },
    ground("medicine", 40, 62, 8),
    ...dolls(figure, contact),
    held("cloth", "mira", { bottom: 22, width: 6 }),
    parcel(owner),
    parcelCloth(owner),
  ];
}

/** Keep the shot, pickup and handoff in the first narration, at actual hand contact. */
export const recoveryBeats: LaterBeat[] = [
  {
    at: 0,
    arrows: [
      { after: 600, duration: 300, from: { x: 71, bottom: 52 }, to: { x: 85.5, bottom: 66.1 } },
    ],
    extras: [recoveryController()],
    items: recoveryItems("table", undefined, "brace"),
    actors: { mira: { x: 48, bottom: 46, inspect: false, pose: "offer", nameOffset: -10 } },
    sequence: [
      {
        after: 300,
        actors: { leon: { push: "extend" } },
        items: recoveryItems("table", undefined, "push"),
      },
      { after: 600, actors: { aria: { bow: "release" } } },
      { after: 900, items: recoveryItems("table", undefined, "hit") },
      {
        after: 1000,
        actors: {
          aria: { x: 83, bottom: 56, bow: undefined, pose: "offer" },
          leon: { push: undefined, pose: "idle" },
        },
      },
      { after: 1100, items: recoveryItems("table", undefined, "step") },
      { after: 1550, items: recoveryItems("table") },
      { after: 2200, actors: { aria: { carry: true } }, items: recoveryItems("aria") },
      {
        after: 3000,
        actors: {
          aria: { x: 56, bottom: 46, left: true, via: [{ x: 68, bottom: 56 }], nameOffset: 10 },
        },
      },
      {
        after: 5000,
        actors: { aria: { carry: false, pose: "offer", via: undefined }, mira: { carry: true } },
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
