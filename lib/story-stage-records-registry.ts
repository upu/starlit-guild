import { actor, ground, held, npc, type LaterBeat } from "./story-stage-later-shared.ts";
import type { StageExtra, StageItem } from "./story-stage-cues.ts";

export const registryCast = () => [
  actor("aria", 14, { bottom: 3, left: false }),
  actor("leon", 36, { bottom: 3, left: false }),
  actor("mira", 56, { bottom: -5, left: false }),
  actor("finn", 85, { bottom: 5, left: true }),
];
const desk = (): StageItem => ({ ...ground("dining-table", 53, 35, 36), id: "table" });
const document = (art: StageItem["art"], id: string, x: number, bottom = 44): StageItem => ({
  ...ground(art, x, bottom, 5.2),
  id,
  support: "table",
});
const records = () => document("ledger", "records", 47);
const orders = () => document("folded-paper", "orders", 68, 47);
const copied = () => document("paper", "order-copy", 45.5, 48);
const seats = (
  keeperPose: StageExtra["pose"] = "idle",
  merchantPose: StageExtra["pose"] = "idle",
  keeperWork?: StageExtra["deskWork"],
  merchantWork?: StageExtra["deskWork"],
): StageExtra[] => [
  {
    ...npc("keeper", "管理人", 41, keeperPose),
    bottom: 38,
    chair: true,
    left: false,
    deskWork: keeperWork,
  },
  {
    ...npc("merchant", "醸造所の商人", 66, merchantPose),
    bottom: 38,
    chair: true,
    left: true,
    deskWork: merchantWork,
  },
];
const staff = (): StageExtra => ({ ...npc("worker", "町の作業者", 90), bottom: 52, left: false });
export const registryBeats: LaterBeat[] = [
  {
    at: 0,
    items: [desk(), records(), held("folded-paper", "finn", { id: "orders", width: 5.2 })],
    extras: seats(),
  },
  { at: 1, extras: seats("explain") },
  { at: 4, extras: seats("idle", "explain") },
  {
    at: 6,
    finishBeforeAdvance: true,
    actors: {
      finn: { x: 74.5, bottom: 34, pose: "offer", left: true, via: [{ x: 85, bottom: 26 }] },
    },
    sequence: [
      {
        after: 1300,
        items: [
          desk(),
          records(),
          held("folded-paper", "finn", { id: "orders", width: 5.2, wrist: true }),
        ],
      },
      { after: 1800, items: [desk(), records(), orders()] },
      {
        after: 2300,
        extras: seats("idle", "idle", undefined, "reach").map((e) =>
          e.id === "merchant" ? { ...e, left: false } : e,
        ),
      },
      {
        after: 3100,
        extras: seats("idle", "point"),
        actors: { finn: { x: 84, bottom: 20, via: [{ x: 84, bottom: 34 }], pose: "think" } },
      },
    ],
  },
  { at: 7, extras: seats("idle", "explain") },
  { at: 12, extras: seats("explain") },
  { at: 13, extras: seats("idle", "point") },
  { at: 14, actors: { aria: { reaction: "surprise" } }, extras: seats() },
  {
    at: 19,
    finishBeforeAdvance: true,
    extras: seats("idle", "idle", "reach"),
    sequence: [
      { after: 700, items: [desk(), { ...records(), x: 52 }, orders()] },
      { after: 1500, extras: seats("point") },
    ],
  },
  { at: 20, extras: seats("point") },
  { at: 21, extras: seats("idle", "explain") },
  { at: 23, extras: seats("idle", "point") },
  { at: 25, extras: seats("explain") },
  { at: 26, extras: [...seats("explain"), { ...staff(), x: 110 }] },
  { at: 27, extras: [...seats("explain"), staff()] },
  { at: 28, extras: [...seats(), staff()] },
  {
    at: 31,
    finishBeforeAdvance: true,
    extras: [...seats("idle", "idle", "write"), staff()],
    items: [desk(), { ...records(), x: 52 }, orders(), copied()],
    sequence: [
      {
        after: 2200,
        extras: [...seats(), staff()],
        items: [desk(), records(), orders(), { ...copied(), x: 49, bottom: 44 }],
      },
      {
        after: 2800,
        actors: {
          finn: { x: 74.625, bottom: 37.4375, via: [{ x: 84, bottom: 37.4375 }], pose: "offer" },
        },
        items: [
          desk(),
          records(),
          { ...orders(), support: undefined, actor: "finn", wrist: true },
          { ...copied(), x: 49, bottom: 44 },
        ],
      },
      {
        after: 4100,
        extras: [
          ...seats("idle", "idle", undefined, "reach").map((e) =>
            e.id === "merchant" ? { ...e, left: false } : e,
          ),
          staff(),
        ],
        items: [
          desk(),
          records(),
          { ...orders(), support: undefined, extra: "merchant", wrist: true },
          { ...copied(), x: 49, bottom: 44 },
        ],
      },
      {
        after: 4900,
        extras: [...seats("idle", "idle", undefined, "count"), staff()],
        items: [
          desk(),
          records(),
          {
            ...orders(),
            extra: "merchant",
            wrist: true,
            support: undefined,
            embeddedFrames: [17, 18, 19],
          },
          { ...copied(), x: 49, bottom: 44 },
        ],
      },
      { after: 6000, extras: [...seats("idle", "idle", undefined, "stow"), staff()] },
      {
        after: 7000,
        actors: { finn: { x: 84, bottom: 20, via: [{ x: 84, bottom: 36 }], pose: "think" } },
        extras: [...seats("idle", "explain"), staff()],
        items: [desk(), records(), { ...copied(), x: 49, bottom: 44 }],
      },
    ],
  },
];
