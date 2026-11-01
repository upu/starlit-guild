import { actor, npc, scene } from "./story-stage-later-shared.ts";
import { receptionDisplayItems as items } from "./story-stage-reception-items.ts";

export const receptionDisplay = scene(
  "manor-display-back",
  [
    actor("aria", 9, { bottom: 45, left: false, pose: "offer" }),
    actor("leon", 30, { bottom: 29, left: false }),
    actor("mira", 22, { bottom: 13, left: false }),
    actor("finn", 67, { bottom: 12, left: true, carry: true }),
  ],
  [
    {
      at: 0,
      items: items({ marker: "hand" }),
      extras: [{ ...npc("merchant", "交代の使用人", 81), bottom: 47, left: false }],
      sequence: [{ after: 800, items: items() }],
    },
    { at: 1, actors: { aria: { pose: "offer", left: false } } },
    {
      at: 2,
      extras: [
        { ...npc("merchant", "交代の使用人", 81), bottom: 47, left: false, pose: "explain" },
      ],
    },
    { at: 4, actors: { finn: { carry: false, pose: "think", left: false } } },
    {
      at: 7,
      actors: {
        aria: {
          x: 43,
          bottom: 50,
          left: false,
          nameAbove: true,
          pose: "offer",
          via: [
            { x: 9, bottom: 28 },
            { x: 20, bottom: 39 },
            { x: 29, bottom: 51 },
          ],
        },
      },
    },
    { at: 10, actors: { leon: { left: false, pose: "offer" } } },
    { at: 11, actors: { mira: { left: false, pose: "offer" } } },
    {
      at: 13,
      actors: {
        leon: { x: 33, bottom: 5, left: false, pose: "offer", via: [{ x: 33, bottom: 16 }] },
        finn: { x: 44, bottom: 5, left: true, pose: "offer", via: [{ x: 60, bottom: 3 }] },
      },
      sequence: [{ after: 400, items: items({ cloth: "leon" }) }],
    },
    { at: 14, actors: { leon: { pose: "offer" } } },
    { at: 16, actors: { leon: { pose: "offer" } } },
    { at: 17, actors: { finn: { pose: "offer" } } },
    {
      at: 18,
      items: items({ cloth: "leon" }),
      sequence: [
        { after: 400, items: items({ cloth: "finn" }) },
        {
          after: 1200,
          actors: {
            finn: { x: 38, bottom: 16, left: false, pose: "offer", via: undefined },
            leon: { pose: "idle" },
          },
        },
        { after: 2200, items: items({ cloth: "rim" }) },
        {
          after: 3000,
          actors: { finn: { pose: "idle" } },
          items: items({ cloth: "rim", covered: true }),
        },
      ],
    },
  ],
);
