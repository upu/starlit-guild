import { actor, ground, held, npc, scene, type LaterStage } from "./story-stage-later-shared.ts";
import type { StageExtra, StageItem } from "./story-stage-cues.ts";

const plants = () => ground("colony", 7, 45, 12);
const label = () => ground("plant-label", 12, 44, 2.8);
const keeper = (pose: StageExtra["pose"] = "idle") => ({
  ...npc("keeper", "管理人", 39, pose, pose !== "idle"),
  bottom: 43,
});
const seated = (pose: StageExtra["pose"] = "idle", merchantSpeaking = false): StageExtra[] => [
  {
    ...npc(
      "keeper",
      "管理人",
      41,
      merchantSpeaking ? "idle" : pose,
      !merchantSpeaking && pose !== "idle",
    ),
    bottom: 38,
    chair: true,
    left: false,
  },
  {
    ...npc("merchant", "醸造所の商人", 65, merchantSpeaking ? pose : "idle", merchantSpeaking),
    bottom: 38,
    chair: true,
    left: true,
  },
];
const desk = (): StageItem => ({ ...ground("dining-table", 53, 27, 32), id: "table" });
const paper = (art: StageItem["art"], id: string, x: number): StageItem => ({
  ...ground(art, x, 39, 6),
  id,
  support: "table",
});
const records = () => paper("record-board", "records", 48);
const orders = () => paper("folded-paper", "orders", 62);
const fieldCast = () => [
  actor("aria", 24, { bottom: 20 }),
  actor("leon", 61, { bottom: 22, left: false }),
  actor("mira", 35, { bottom: 12 }),
  actor("finn", 55, { bottom: 5 }),
  actor("lico", 79, { bottom: 20, left: true, stool: true, seated: true }),
];
const stool = (): StageItem => ({ ...ground("step-stool", 79, 21.78, 5.7), seatFor: "lico" });
const device = (art: StageItem["art"] = "reflector-covered"): StageItem => ({
  ...ground(art, 83, 42, 13),
  id: "reflector",
  glow: art === "reflector" ? "bright" : undefined,
});
const samples = (x = 87) => ground("sample-dish", x, 22, 6);
const notes = () => ground("ledger", 72, 22, 7);
const board = (): StageItem => ({ ...ground("record-board", 69, 27, 7), id: "records" });
const heldBoard = (owner: "leon" | "lico") =>
  held("record-board", owner, { id: "records", width: 7 });
const smoke = (dissipating = false): StageItem[] => [
  { ...ground("low-smoke", 75, 33, 25), dissipating, id: "smoke-source" },
  { ...ground("low-smoke", 53, 25, 60), dissipating },
];
const field = (active = false) => [
  plants(),
  notes(),
  samples(active ? 83 : 87),
  device(active ? "reflector" : "reflector-covered"),
];
const basket = () => held("basket", "aria", { width: 8, bottom: 19 });
const resting = () => [plants(), samples(), device("reflector-down"), ground("basket", 27, 36, 8)];
// The two books and the copied order rest on the board across Lico's knees.
const lap = (): StageItem[] => [
  held("lap-board", "lico", { x: 0, width: 11, bottom: 19.5 }),
  held("ledger", "lico", {
    id: "lico-book",
    x: 2.6,
    bottom: 20.8,
    width: 4.8,
    support: "lap-board",
  }),
  held("ledger", "lico", {
    id: "keeper-book",
    x: -2.6,
    bottom: 20.8,
    width: 4.8,
    support: "lap-board",
  }),
];

export const licoRecordsStages: Record<string, LaterStage> = {
  "lico-records-departure": scene(
    "registry",
    [
      actor("aria", 24, { bottom: 8 }),
      actor("leon", 43, { bottom: 8 }),
      actor("mira", 63, { bottom: 8 }),
      actor("finn", 81, { bottom: 10 }),
    ],
    [
      { at: 0, items: [desk(), records()], extras: seated() },
      { at: 1, extras: seated("explain") },
      { at: 4, extras: seated("explain", true) },
      {
        at: 6,
        actors: { finn: { x: 73, bottom: 27, pose: "offer" } },
        items: [desk(), records(), held("folded-paper", "finn", { id: "orders", width: 6 })],
        sequence: [{ after: 1000, items: [desk(), records(), orders()] }],
      },
      { at: 14, actors: { aria: { reaction: "surprise" } } },
      { at: 19, items: [desk(), records(), { ...orders(), x: 56 }] },
      { at: 20, extras: seated("point") },
      {
        at: 26,
        extras: [...seated("explain"), { ...npc("worker", "町の作業者", 86), bottom: 43 }],
      },
      {
        at: 31,
        items: [desk(), records(), orders()],
        sequence: [
          {
            after: 700,
            items: [
              desk(),
              records(),
              { ...orders(), support: undefined, extra: "merchant", x: 0, bottom: 43 },
            ],
          },
          { after: 1600, items: [desk(), records()] },
        ],
      },
      {
        at: 32,
        background: "moss-beds",
        furniture: [label(), stool()],
        cast: fieldCast(),
        items: [...field(), board()],
        extras: [keeper()],
      },
      {
        at: 36,
        actors: { leon: { x: 68, bottom: 22, pose: "offer" } },
        items: [...field(), heldBoard("leon")],
      },
      { at: 37, actors: { lico: { pose: "think" } } },
      {
        at: 40,
        actors: {
          aria: { x: 23, bottom: 38, carry: true, left: true },
          lico: { seated: false, inspect: true },
        },
        items: [...field(), heldBoard("leon"), basket()],
        sequence: [
          {
            after: 900,
            actors: { lico: { inspect: false } },
            items: [plants(), notes(), samples(83), device(), heldBoard("leon"), basket()],
          },
        ],
      },
      {
        at: 42,
        actors: { lico: { x: 75, bottom: 35, pose: "surprise" } },
        items: [plants(), notes(), samples(83), device(), heldBoard("leon"), basket()],
        sequence: [
          { after: 1100, items: [...field(true), heldBoard("leon"), basket(), ...smoke()] },
        ],
      },
      { at: 46, actors: { aria: { x: 24, bottom: 25, left: false }, leon: { pose: "offer" } } },
    ],
    { cell: 19 },
  ),
  "lico-records-return": scene(
    "moss-beds",
    fieldCast().map((a) =>
      a.id === "lico"
        ? { ...a, seated: false }
        : a.id === "leon"
          ? { ...a, x: 67, bottom: 20 }
          : a.id === "aria"
            ? { ...a, bottom: 38, carry: true }
            : a,
    ),
    [
      {
        at: 0,
        actors: { leon: { inspect: true } },
        items: [
          plants(),
          samples(),
          device("reflector-down"),
          { ...board(), x: 72, bottom: 22 },
          basket(),
          ...smoke(true),
        ],
        extras: [keeper()],
        sequence: [
          {
            after: 700,
            actors: { leon: { inspect: false, pose: "offer" } },
            items: [
              plants(),
              samples(),
              device("reflector-down"),
              heldBoard("leon"),
              basket(),
              ...smoke(true),
            ],
          },
          {
            after: 1600,
            items: [
              plants(),
              samples(),
              device("reflector-down"),
              heldBoard("lico"),
              basket(),
              ...smoke(true),
            ],
          },
          {
            after: 3000,
            items: [plants(), samples(), device("reflector-down"), heldBoard("lico"), basket()],
          },
        ],
      },
      {
        at: 4,
        actors: { aria: { carry: false, pose: "offer" } },
        items: [...resting(), heldBoard("lico")],
      },
      {
        at: 8,
        actors: {
          lico: { seated: true },
          aria: { x: 66, bottom: 11, pose: "offer", left: false },
          leon: { x: 57, bottom: 27, left: false },
        },
        items: [...resting(), held("lap-board", "aria", { width: 11 })],
        sequence: [{ after: 1900, items: [...resting(), ...lap()] }],
      },
      { at: 12, extras: [keeper("explain")] },
      {
        at: 13,
        items: [
          ...resting(),
          ...lap(),
          held("paper", "lico", { x: -5, bottom: 19.5, width: 3.5, support: "lap-board" }),
        ],
      },
      { at: 17, actors: { lico: { pose: "think" } } },
      { at: 24, extras: [keeper("point")] },
      {
        at: 26,
        actors: { aria: { x: 24, bottom: 36, left: false } },
        sequence: [
          {
            after: 1700,
            actors: { aria: { carry: true } },
            items: [plants(), samples(), device("reflector-down"), ...lap(), basket()],
          },
        ],
      },
      {
        at: 27,
        actors: {
          aria: {
            x: 68,
            bottom: 20,
            carry: true,
            via: [
              { x: 43, bottom: 15 },
              { x: 68, bottom: 15 },
            ],
          },
          lico: { pose: "offer" },
        },
        items: [
          plants(),
          samples(),
          device("reflector-down"),
          basket(),
          held("ledger", "lico", { width: 7, bottom: 19.5, x: -2 }),
          held("moss", "lico", { width: 3, bottom: 24 }),
        ],
        sequence: [
          {
            after: 2100,
            items: [
              plants(),
              samples(),
              device("reflector-down"),
              basket(),
              held("ledger", "lico", { width: 7, bottom: 19.5, x: -2 }),
              held("moss", "aria", { width: 3, bottom: 24, support: "basket" }),
            ],
          },
        ],
      },
      { at: 30, actors: { lico: { seated: true, pose: "think" } } },
    ],
    { cell: 19, furniture: [label(), stool()] },
  ),
};
