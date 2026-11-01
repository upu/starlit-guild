import { actor, npc, scene } from "./story-stage-later-shared.ts";
import { receptionWellItems } from "./story-stage-reception-well-items.ts";

const items = receptionWellItems();
const servant = (turn = false) => ({
  ...npc("worker", "使用人", 80),
  bottom: 45,
  left: !turn,
  inspect: false,
});
const cook = () => ({
  ...npc("cook", "料理人", 92.5),
  bottom: 76,
  left: false,
  kitchen: "pot" as const,
});

export const receptionWell = scene(
  "manor-well",
  [
    actor("aria", 60, { bottom: 36, left: false, nameAbove: true }),
    actor("leon", 94, { bottom: 16, left: false }),
    actor("mira", 30, { bottom: 22, left: false }),
    actor("finn", 71, { bottom: 18, left: true, carry: true }),
  ],
  [
    { at: 0, items: items(), extras: [servant()] },
    { at: 1, actors: { aria: { left: false, pose: "offer" } } },
    {
      at: 2,
      actors: {
        aria: {
          x: 20,
          bottom: 65,
          left: false,
          pose: "think",
          via: [
            { x: 99, bottom: 36 },
            { x: 99, bottom: 50 },
            { x: 20, bottom: 50 },
          ],
        },
      },
    },
    { at: 3, actors: { finn: { carry: false, left: true, pose: "surprise" } } },
    { at: 4, actors: { aria: { left: false, pose: "think", via: undefined } } },
    {
      at: 6,
      actors: { leon: { inspect: true } },
      sequence: [
        { after: 450, items: items({ bag: "ground", rope: "snagged" }) },
        { after: 900, items: items({ fastener: "floor" }), extras: [servant(true)] },
        { after: 1700, actors: { leon: { inspect: false, pose: "surprise" } } },
      ],
    },
    {
      at: 10,
      actors: { leon: { x: 84, bottom: 14, inspect: false, left: false } },
      sequence: [
        { after: 400, actors: { leon: { inspect: true } } },
        { after: 850, items: items({ fastener: "hand" }) },
        {
          after: 1550,
          actors: { leon: { inspect: false, carry: true } },
          items: items({ bag: "hand", fastener: "stored", rope: "packed" }),
        },
        {
          after: 2300,
          actors: {
            leon: {
              x: 83.5,
              bottom: 76,
              via: [
                { x: 99, bottom: 32 },
                { x: 99, bottom: 61 },
              ],
            },
          },
          extras: [servant(true), cook()],
        },
        {
          after: 4500,
          items: items({ bag: "cook" }),
          actors: { leon: { carry: false, pose: "offer", left: false } },
        },
        {
          after: 5300,
          extras: [
            servant(true),
            { ...cook(), x: 96, bottom: 80, kitchen: undefined, via: [{ x: 95, bottom: 78 }] },
          ],
          items: items({ bag: "cook", cookBottom: 80, byHandle: true }),
          actors: {
            leon: {
              x: 12,
              bottom: 20,
              left: true,
              pose: "idle",
              via: [
                { x: 99, bottom: 48 },
                { x: 99, bottom: -2 },
                { x: 12, bottom: -2 },
              ],
            },
          },
        },
        { after: 8700, extras: [servant(true)], items: items({ bag: "kitchen" }) },
      ],
    },
    {
      at: 12,
      actors: {
        aria: { x: 10, bottom: 46, left: true, inspect: false, via: [{ x: 20, bottom: 46 }] },
      },
      sequence: [{ after: 1000, actors: { aria: { inspect: true, via: undefined } } }],
    },
    {
      at: 14,
      actors: { leon: { left: true, pose: "offer", via: undefined } },
      items: items({ map: true }),
    },
    { at: 15, actors: { aria: { inspect: false, pose: "offer", left: true } } },
    {
      at: 16,
      actors: {
        leon: { x: 24, bottom: 36, left: true, pose: "idle" },
        mira: { x: 80, bottom: 4, left: true, via: [{ x: 30, bottom: 4 }] },
      },
      items: items({ map: false }),
    },
    { at: 17, actors: { finn: { carry: true, left: true } }, items: items({ pushing: true }) },
  ],
  {
    exit: ["aria", "leon", "mira", "finn"],
    exitSide: "left",
    exitRoutes: {
      aria: { x: -35, bottom: 60, via: [{ x: 3, bottom: 50 }] },
      leon: {
        x: -22,
        bottom: 60,
        via: [
          { x: 13, bottom: 43 },
          { x: 3, bottom: 50 },
        ],
      },
      mira: {
        x: -10,
        bottom: 60,
        via: [
          { x: 71, bottom: 18 },
          { x: 35, bottom: 30 },
          { x: 10, bottom: 45 },
          { x: 3, bottom: 50 },
        ],
      },
      finn: {
        x: -2,
        bottom: 60,
        via: [
          { x: 35, bottom: 30 },
          { x: 10, bottom: 45 },
          { x: 3, bottom: 50 },
        ],
      },
    },
  },
);
