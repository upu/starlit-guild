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
import { foundingGift, foundingJar, storedFoundingGift } from "./story-stage-founding-gift.ts";
import { foundingSample, licoSampleBag } from "./story-stage-founding-sample.ts";
import { foundingBags, liftFoundingBag, foundingReturnCargo } from "./story-stage-founding-bag.ts";
import { foundingRecords } from "./story-stage-founding-records.ts";
import { foundingQuill } from "./story-stage-founding-quill.ts";
import {
  openFoundingNotes,
  foldFoundingNotes,
  retainFoundingNotes,
  topSheet,
} from "./story-stage-founding-notes.ts";
const representativeChair = (id: ResidentId) => ({
  ...chair(actor(id, 67, { left: true }), 19),
  id: "representative-chair",
});
const registrationItems = (items: ReturnType<typeof table>[]) => [
  ...diningItems(items).map((p) =>
    p.art === "ledger"
      ? { ...p, art: "paper" as const, width: 7, pitch: p.support === "table" ? 55 : undefined }
      : p,
  ),
  licoSampleBag(),
];

function registrationBeats(beats: LaterBeat[]): LaterBeat[] {
  return beats.map((beat) => ({
    ...beat,
    finishBeforeAdvance: beat.finishBeforeAdvance ?? !!beat.sequence?.length,
    items: beat.items && registrationItems(beat.items),
    sequence: beat.sequence?.map((step) => ({
      ...step,
      items: step.items && registrationItems(step.items),
    })),
  }));
}
export const foundingStages: Record<string, LaterStage> = {
  "starlit-guild-founding-departure": scene(
    "tower-records",
    quintet(),
    foundingRecords(
      foundingBags([
        {
          at: 0,
          items: [ground("ledger", 27, 42, 9), ground("basket", 60, 40, 9)],
          extras: [npc("keeper", undefined, 27)],
        },
        { at: 1, extras: [npc("keeper", undefined, 27, "explain", true)] },
        {
          at: 8,
          finishBeforeAdvance: true,
          actors: { lico: { bottom: 20, mossStudy: "spread", left: true } },
          sequence: [{ after: 1800, actors: { lico: { bottom: 14, mossStudy: undefined } } }],
        },
        { at: 9, actors: { lico: { inspect: false } } },
        liftFoundingBag,
        {
          at: 19,
          actors: { lico: { carry: false, mossStudy: "reach", left: true } },
          items: [foundingJar("lico"), ground("basket", 60, 40, 9)],
        },
        { at: 24, actors: { lico: { reaction: "surprise" } } },
        foundingGift,
        { at: 31, actors: { lico: { pose: "greet" } } },
        {
          at: 37,
          background: "hill-path",
          extras: [],
          items: [...storedFoundingGift(), ...foundingReturnCargo()],
        },
        {
          at: 38,
          finishBeforeAdvance: true,
          actors: { lico: { x: 91, bottom: -5, left: false, inspect: true } },
        },
        {
          at: 40,
          finishBeforeAdvance: true,
          actors: {
            aria: {
              x: 94,
              bottom: -21,
              left: false,
              inspect: true,
              via: [{ x: 87, bottom: -30 }],
            },
          },
        },
      ]),
    ),
  ),
  "starlit-guild-founding-return": scene(
    "warehouse-office",
    quintet().map((a) =>
      a.id === "finn"
        ? { ...a, seated: true, chair: true }
        : a.id === "mira"
          ? { ...a, bottom: 0 }
          : a,
    ),
    registrationBeats(
      foundingQuill(
        retainFoundingNotes([
          { at: 0, items: [table()], extras: [npc("keeper", "倉庫の大家", 26, "explain", true)] },
          { at: 5, items: [table(), onTable("ledger")] },
          { at: 8, actors: { aria: { pose: "think" } } },
          ...foundingSample,
          {
            at: 22,
            furniture: [representativeChair("finn")],
            actors: {
              // Leave a clear aisle between the clerk and the chair.
              lico: { x: 78, bottom: -2, via: undefined },
              finn: {
                x: 67,
                bottom: 14,
                seated: true,
                chair: true,
                left: true,
                via: [
                  { x: 91, bottom: 55 },
                  { x: 87, bottom: 55 },
                  { x: 87, bottom: 14 },
                ],
              },
            },
            sequence: [{ after: 3100, actors: { finn: { via: undefined } } }],
            extras: [npc("keeper", "倉庫の大家", 26), npc("merchant", "町の受付", 73)],
            items: [table(), onTable("ledger")],
          },
          { at: 25, actors: { aria: { pose: "greet", reaction: "nod" } } },
          registrationPaper,
          {
            at: 36,
            items: [table(), onTable("ledger")],
            extras: [
              npc("keeper", "倉庫の大家", 26),
              npc("merchant", "町の受付", 73, "explain", true),
            ],
          },
          {
            at: 42,
            actors: {
              lico: { x: 78, bottom: -2, via: undefined },
              finn: {
                pose: "tease",
                seated: false,
                x: 91,
                bottom: 37,
                via: [
                  { x: 87, bottom: 14 },
                  { x: 87, bottom: 55 },
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
          openFoundingNotes,
          { at: 56, actors: { aria: { pose: "greet", reaction: "nod" } } },
          {
            at: 59,
            extras: [
              npc("keeper", "倉庫の大家", 26),
              npc("merchant", "町の受付", 73, "explain", true),
            ],
          },
          foldFoundingNotes,
          {
            at: 64,
            finishBeforeAdvance: true,
            actors: {
              leon: {
                seated: false,
                writing: true,
                x: 31,
                bottom: 18,
                left: false,
                via: [
                  // Walk in front of Mira before approaching the desk.
                  { x: 67, bottom: -16 },
                  { x: 31, bottom: -16 },
                ],
              },
              aria: { x: 17 },
              // A small step toward the desk clears her silhouette as Leon passes.
              mira: { x: 55, bottom: 10, via: undefined },
              lico: { x: 83 },
            },
            items: [table(50), topSheet(true)],
            sequence: [{ after: 4000, actors: { leon: { via: undefined, writing: true } } }],
          },
          {
            at: 65,
            actors: { leon: { writing: false, pose: "offer" } },
            items: [table(), held("ledger", "leon", { wrist: true })],
          },
        ]),
      ),
    ),
    { cell: 19, furniture: [representativeChair("finn")] },
  ),
};
