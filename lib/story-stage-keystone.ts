import type { StageExtra } from "./story-stage-cues.ts";
import { actor, npc, scene, type LaterBeat } from "./story-stage-later-shared.ts";
import { foundationItems, inspectionRecords } from "./story-stage-keystone-items.ts";

const mason = (patch: Partial<StageExtra> = {}): StageExtra => ({
  ...npc("worker", "石工", 34),
  bottom: 42,
  left: true,
  ...patch,
});
const keeper = (patch: Partial<StageExtra> = {}): StageExtra => ({
  ...npc("keeper", "管理人", 65),
  bottom: 27,
  left: true,
  ...patch,
});
const inspectionCast = () => [
  actor("aria", 26, { bottom: 20, left: false }),
  actor("leon", 51, { bottom: 21, left: false }),
  actor("mira", 22, { bottom: 40, left: false }),
  actor("finn", 87, { bottom: 10, left: true }),
];
function preparePlans(): LaterBeat[] {
  return [
    { at: 0, extras: [mason(), keeper()], items: inspectionRecords() },
    {
      at: 2,
      extras: [mason(), keeper({ pose: "explain", speaking: true })],
      items: inspectionRecords({ district: "keeper" }),
      sequence: [
        { after: 900, items: inspectionRecords({ district: "table" }) },
        {
          after: 1700,
          extras: [mason(), keeper()],
        },
      ],
    },
    {
      at: 3,
      actors: { aria: { x: 35, bottom: 22 } },
      sequence: [{ after: 1000, actors: { aria: { inspect: true } } }],
    },
    { at: 4, extras: [mason({ pose: "point", speaking: true }), keeper()] },
    { at: 5, extras: [mason(), keeper()] },
  ];
}
function borrowRecord(): LaterBeat[] {
  return [
    {
      at: 6,
      actors: { aria: { inspect: false }, finn: { x: 78, bottom: 21, pose: "offer" } },
      sequence: [
        { after: 1200, items: inspectionRecords({ district: "table", receipt: "hand" }) },
        { after: 2000, items: inspectionRecords({ district: "table", receipt: "folding" }) },
        { after: 2700, items: inspectionRecords({ district: "table", receipt: "folded" }) },
      ],
    },
    { at: 7, actors: { finn: { pose: "offer" } } },
    { at: 8, actors: { leon: { pose: "offer" } } },
    { at: 9, actors: { finn: { pose: "offer" } } },
    {
      at: 11,
      actors: { finn: { pose: "offer" } },
      sequence: [
        { after: 900, items: inspectionRecords({ district: "table", receipt: "returned" }) },
        { after: 1700, actors: { finn: { x: 87, bottom: 10, pose: "tease" } } },
      ],
    },
  ];
}
export const keystoneInspection = scene("berne-foundation-grass", inspectionCast(), [
  ...preparePlans(),
  ...borrowRecord(),
]);

const groundKeeper = (speaking = false) =>
  keeper({ x: 75, bottom: 42, pose: speaking ? "explain" : "idle", speaking });
const groundMason = (patch: Partial<StageExtra> = {}) => mason({ x: 40, bottom: 18, ...patch });
function inspectFoundation(): LaterBeat[] {
  return [
    { at: 0, items: foundationItems(), extras: [groundMason({ inspect: true }), groundKeeper()] },
    {
      at: 1,
      extras: [groundMason({ inspect: false, pose: "point", speaking: true }), groundKeeper()],
    },
    { at: 2, extras: [groundMason(), groundKeeper()], actors: { leon: { pose: "offer" } } },
    {
      at: 3,
      extras: [groundMason({ inspect: true }), groundKeeper()],
      sequence: [
        {
          after: 1300,
          extras: [
            groundMason({ inspect: false, x: 31, bottom: 45, via: [{ x: 29, bottom: 31 }] }),
            groundKeeper(),
          ],
        },
        {
          after: 3000,
          extras: [groundMason({ x: 31, bottom: 45, inspect: true }), groundKeeper()],
        },
      ],
    },
    {
      at: 4,
      extras: [groundMason({ x: 31, bottom: 45, pose: "point", speaking: true }), groundKeeper()],
    },
    { at: 5, extras: [groundMason({ x: 31, bottom: 45 }), groundKeeper()] },
    { at: 6, extras: [groundMason({ x: 31, bottom: 45 }), groundKeeper(true)] },
    { at: 7, extras: [groundMason({ x: 31, bottom: 45 }), groundKeeper()] },
    { at: 8, actors: { leon: { pose: "offer", reaction: "surprise" } } },
    {
      at: 13,
      actors: { finn: { pose: "think" } },
      sequence: [
        {
          after: 850,
          actors: {
            finn: { x: 52, bottom: 21, left: true, via: [{ x: 61, bottom: 10 }] },
            leon: { nameOffset: 25 },
          },
        },
        { after: 2400, actors: { finn: { inspect: true } } },
      ],
    },
    { at: 14, actors: { finn: { inspect: true, pose: "think" } } },
    { at: 15, actors: { leon: { pose: "offer" } } },
    { at: 16, actors: { finn: { inspect: true, pose: "think" } } },
  ];
}
const packForManor: LaterBeat = {
  at: 17,
  actors: { finn: { inspect: false }, leon: { nameOffset: 0 } },
  sequence: [
    {
      after: 800,
      items: foundationItems(true),
      actors: {
        aria: { left: true },
        leon: {
          x: 86,
          bottom: 8,
          left: false,
          via: [
            { x: 83, bottom: 31 },
            { x: 91, bottom: 21 },
          ],
        },
        mira: { x: 19, bottom: 30, via: [{ x: 15, bottom: 32 }] },
      },
    },
    {
      after: 3000,
      actors: {
        aria: { inspect: true, packing: true },
        leon: { inspect: true, packing: true },
        mira: { inspect: true, packing: true },
      },
    },
    {
      after: 3800,
      items: foundationItems(true, true),
      actors: {
        aria: { inspect: false, packing: false },
        leon: { inspect: false, packing: false },
        mira: { inspect: false, packing: false, carry: true },
      },
    },
  ],
};
export const keystoneFoundation = scene(
  "berne-foundation-open",
  [
    actor("aria", 23, { bottom: 12 }),
    actor("leon", 59, { bottom: 36, left: true, pose: "offer" }),
    actor("mira", 22, { bottom: 41, left: false }),
    actor("finn", 78, { bottom: 13, left: true }),
  ],
  [...inspectFoundation(), packForManor],
  {
    exit: ["aria", "leon", "mira", "finn"],
    exitRoutes: {
      aria: { x: 24, bottom: -55, via: [{ x: 24, bottom: 0 }] },
      leon: { x: 76, bottom: -55, via: [{ x: 76, bottom: 0 }] },
      mira: {
        x: 33,
        bottom: -55,
        via: [
          { x: 26, bottom: 18 },
          { x: 33, bottom: 0 },
        ],
      },
      finn: { x: 63, bottom: -55, via: [{ x: 63, bottom: 6 }] },
    },
  },
);
