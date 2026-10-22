import {
  scene,
  actor,
  quintet,
  held,
  ground,
  table,
  onTable,
  npc,
  type LaterStage,
  type LaterBeat,
} from "./story-stage-later-shared.ts";
import { chair, diningItems } from "./story-stage-furniture.ts";
import type { ResidentId } from "./home-actor.ts";
import { registrationPaper } from "./story-stage-registration-paper.ts";
const representativeChair = (id: ResidentId) => ({
  ...chair(actor(id, 67, { left: true }), 19),
  id: "representative-chair",
});
const registrationItems = (items: ReturnType<typeof table>[]) =>
  diningItems(items).map((p) =>
    p.art === "ledger" ? { ...p, art: "paper" as const, width: 7 } : p,
  );

function registrationBeats(beats: LaterBeat[]): LaterBeat[] {
  return beats.map((beat) => ({
    ...beat,
    items: beat.items && registrationItems(beat.items),
    sequence: beat.sequence?.map((step) => ({
      ...step,
      items: step.items && registrationItems(step.items),
    })),
  }));
}
export const foundingStages: Record<string, LaterStage> = {
  "starlit-guild-founding-departure": scene("tower-foot", quintet(), [
    {
      at: 0,
      items: [ground("ledger", 27, 42, 9), ground("basket", 74)],
      extras: [npc("keeper", undefined, 27)],
    },
    { at: 1, extras: [npc("keeper", undefined, 27, "explain", true)] },
    { at: 8, actors: { lico: { inspect: true } } },
    { at: 9, actors: { lico: { inspect: false } } },
    { at: 18, actors: { lico: { carry: true } } },
    {
      at: 19,
      actors: { lico: { carry: false, pose: "offer" } },
      items: [held("sample-jar", "lico"), ground("basket", 74)],
    },
    { at: 24, actors: { lico: { reaction: "surprise" } } },
    { at: 27, items: [held("sample-jar", "aria"), ground("basket", 74)] },
    { at: 31, actors: { lico: { pose: "greet" } } },
    {
      at: 37,
      background: "hill-path",
      extras: [],
      items: [held("sample-jar", "aria"), held("basket", "leon"), held("ledger", "finn")],
    },
    { at: 38, actors: { lico: { inspect: true } } },
    { at: 40, actors: { aria: { inspect: true } } },
  ]),
  "starlit-guild-founding-return": scene(
    "warehouse-office",
    quintet().map((a) =>
      a.id === "finn"
        ? { ...a, seated: true, chair: true }
        : a.id === "mira"
          ? { ...a, bottom: 0 }
          : a,
    ),
    registrationBeats([
      { at: 0, items: [table()], extras: [npc("keeper", "倉庫の大家", 26, "explain", true)] },
      { at: 5, items: [table(), onTable("ledger")] },
      { at: 8, actors: { aria: { pose: "think" } } },
      {
        at: 16,
        actors: { aria: { x: 73, bottom: 0, lane: -15, carry: true, left: false } },
        items: [table(), onTable("ledger"), held("sample-dish", "aria", { width: 7, bottom: 21 })],
        sequence: [
          {
            after: 3100,
            actors: { aria: { carry: false, pose: "offer" } },
            items: [table(), onTable("ledger"), ground("sample-dish", 80, 5, 7)],
          },
        ],
      },
      {
        at: 18,
        actors: { lico: { x: 87, bottom: 4, left: true, inspect: true } },
        sequence: [
          {
            after: 1100,
            actors: { lico: { inspect: false, pose: "offer" } },
            items: [
              table(),
              onTable("ledger"),
              held("sample-dish", "lico", { width: 7, bottom: 21 }),
            ],
          },
        ],
      },
      {
        at: 21,
        actors: { lico: { inspect: true, packing: true }, aria: { x: 19, bottom: 14, lane: -15 } },
        sequence: [
          {
            after: 800,
            actors: { lico: { x: 83, bottom: 14, inspect: false, packing: false } },
            items: [table(), onTable("ledger")],
          },
        ],
      },
      {
        at: 22,
        extras: [npc("keeper", "倉庫の大家", 26), npc("merchant", "町の受付", 73)],
        items: [table(), onTable("ledger")],
      },
      { at: 25, actors: { aria: { pose: "greet", reaction: "nod" } } },
      registrationPaper,
      {
        at: 36,
        items: [table(), onTable("ledger")],
        extras: [npc("merchant", "町の受付", 73, "explain", true)],
      },
      {
        at: 42,
        actors: {
          finn: {
            pose: "tease",
            seated: false,
            x: 91,
            bottom: 37,
            via: [
              { x: 75, bottom: 14 },
              { x: 75, bottom: 55 },
              { x: 91, bottom: 55 },
            ],
          },
        },
        furniture: [representativeChair("mira")],
        sequence: [
          {
            after: 650,
            actors: { mira: { x: 67, bottom: 14, left: true, seated: true, chair: true } },
          },
        ],
      },
      { at: 47, actors: { aria: { pose: "think" } } },
      {
        at: 50,
        actors: { mira: { seated: false, x: 51, bottom: 0, via: [{ x: 67, bottom: 0 }] } },
        furniture: [representativeChair("leon")],
        sequence: [
          {
            after: 650,
            actors: { leon: { x: 67, bottom: 14, left: true, seated: true, chair: true } },
          },
        ],
      },
      { at: 52, items: [table(), held("ledger", "leon")] },
      { at: 56, actors: { aria: { pose: "greet", reaction: "nod" } } },
      { at: 59, extras: [npc("merchant", "町の受付", 73, "explain", true)] },
      { at: 60, items: [table(), onTable("ledger")] },
      {
        at: 64,
        actors: {
          leon: {
            seated: false,
            writing: true,
            x: 31,
            bottom: 18,
            left: false,
            via: [
              { x: 67, bottom: 6 },
              { x: 31, bottom: 6 },
            ],
          },
          aria: { x: 17 },
          mira: { x: 55 },
          lico: { x: 83 },
        },
        items: [table(50)],
      },
      {
        at: 65,
        actors: { leon: { writing: false, pose: "offer" } },
        items: [table(), held("ledger", "leon", { width: 7 })],
      },
    ]),
    { cell: 19, furniture: [representativeChair("finn")] },
  ),
};
