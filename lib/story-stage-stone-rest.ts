import { actor, ground, held, npc, quartet, scene } from "./story-stage-later-shared.ts";
import { chair, diningCast, diningItems } from "./story-stage-furniture.ts";
import type { StageItem } from "./story-stage-cues.ts";

const mason = () => npc("worker", "石工", 27);
const desk = () => diningItems([ground("table", 52, 16, 32)])[0];
const surface = (art: StageItem["art"], x = 52, width = 8): StageItem => ({
  ...ground(art, x, 27, width),
  support: "table",
});
const cup = () => held("teacup", "mira", { id: "mira-cup", width: 3.5, x: 3, bottom: 23 });
const fixtures = () => [
  ...diningCast().map((a) =>
    chair(a.id === "mira" ? a : { ...a, x: a.x + (a.id === "aria" ? -2 : 2) }),
  ),
  ground("brazier", 91, 32, 7),
];
const comparison = () => [desk(), surface("cloth", 45, 10), surface("replacement", 45, 8), cup()];
const resting = () => [
  desk(),
  surface("tea-four", 51, 13),
  surface("medicine", 64, 6),
  { ...ground("kettle", 91, 37, 6), support: "brazier" },
];

export const stoneRest = scene("stone-yard", quartet(), [
  { at: 0, items: [ground("replacement", 46, 16, 12), ground("cloth", 57)], extras: [mason()] },
  {
    at: 4,
    background: "storeroom",
    night: true,
    cast: [
      actor("aria", 35, { pose: "offer" }),
      actor("leon", 65, { pose: "offer" }),
      actor("mira", 39, { bottom: 22, seated: true, chair: true }),
      actor("finn", 82),
    ],
    furniture: fixtures(),
    items: comparison(),
  },
  { at: 7, extras: [{ ...mason(), pose: "explain", speaking: true }] },
  {
    at: 12,
    actors: {
      finn: {
        x: 35,
        bottom: 36,
        left: true,
        pose: "offer",
        via: [
          { x: 86, bottom: 53 },
          { x: 35, bottom: 53 },
        ],
      },
    },
    items: [...comparison(), { ...ground("paper", 3, 44, 6), extra: "worker" }],
    sequence: [
      { after: 3300, items: [...comparison(), held("paper", "finn", { width: 6 })] },
      {
        after: 4000,
        actors: {
          finn: {
            x: 53,
            bottom: 14,
            left: false,
            via: [
              { x: 29, bottom: 36 },
              { x: 29, bottom: 6 },
              { x: 53, bottom: 6 },
            ],
          },
        },
      },
      { after: 6200, items: [...comparison(), held("paper", "leon", { width: 6 })] },
    ],
  },
  {
    at: 15,
    actors: {
      mira: { pose: "think", seated: false, chair: true },
      finn: {
        x: 82,
        bottom: 14,
        via: [
          { x: 53, bottom: 0 },
          { x: 82, bottom: 0 },
        ],
      },
    },
    sequence: [{ after: 500, actors: { mira: { seated: true } } }],
  },
  {
    at: 20,
    actors: {
      leon: {
        x: 85,
        bottom: 30,
        left: false,
        pose: "offer",
        via: [
          { x: 80, bottom: 14 },
          { x: 85, bottom: 14 },
        ],
      },
      aria: { pose: "offer" },
    },
    items: [
      desk(),
      surface("replacement", 45, 8),
      cup(),
      held("kettle", "leon", { width: 6 }),
      held("teacup", "aria", { width: 3.5 }),
    ],
  },
  {
    at: 21,
    actors: {
      finn: {
        x: 61,
        bottom: 22,
        seated: true,
        chair: true,
        via: [
          { x: 82, bottom: 44 },
          { x: 61, bottom: 44 },
        ],
      },
    },
    furniture: [...diningCast().map((a) => chair(a)), ground("brazier", 91, 32, 7)],
    items: resting(),
    sequence: [
      {
        after: 750,
        actors: {
          aria: { seated: true, chair: true },
          leon: {
            x: 65,
            bottom: 14,
            left: true,
            seated: true,
            chair: true,
            via: [
              { x: 85, bottom: 14 },
              { x: 80, bottom: 14 },
            ],
          },
        },
      },
    ],
  },
]);
