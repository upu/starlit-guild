import { actor, ground, scene } from "./story-stage-later-shared.ts";

const cargo = [
  { ...ground("empty-cart", 42, 28, 26), id: "reception-cart", left: true },
  { ...ground("wrapped-stone", -9, 16, 6.2), id: "recovered-parcel", carrier: "reception-cart" },
  { ...ground("empty-garden-pot", -2, 11, 7), id: "front-pot", carrier: "reception-cart" },
];

export const bridgeReturn = scene(
  "bridge-night",
  [
    actor("aria", 27, { bottom: 46, left: false }),
    actor("leon", -8, { bottom: 12, left: false }),
    actor("mira", 80, { bottom: 30, left: true }),
    actor("finn", 58, { bottom: 37, left: false, handAction: "guard", dressed: true }),
  ],
  [
    { at: 0, items: cargo, sequence: [{ after: 600, actors: { leon: { x: 31 } } }] },
    {
      at: 1,
      actors: {
        aria: {
          x: 91,
          bottom: 15,
          via: [
            { x: 21, bottom: -7 },
            { x: 91, bottom: -7 },
          ],
        },
        leon: { x: 55, bottom: 7, left: false },
      },
    },
    { at: 4, actors: { finn: { handAction: "palm" } } },
    {
      at: 6,
      actors: { mira: { x: 66, bottom: 37, pose: "offer", nameAbove: true } },
      sequence: [
        {
          after: 700,
          actors: { finn: { handAction: "pat-ready", reachOver: "recovered-parcel" } },
        },
        { after: 1000, actors: { finn: { handAction: "pat-touch" } } },
        { after: 1350, actors: { finn: { handAction: "pat-ready" } } },
        { after: 1800, actors: { finn: { handAction: "palm", reachOver: undefined } } },
      ],
    },
    {
      at: 11,
      actors: {
        finn: { handAction: "guard" },
        mira: { x: 78, bottom: 55, left: true, pose: "idle" },
      },
      sequence: [{ after: 1000, actors: { mira: { lookAcross: true } } }],
    },
  ],
  { night: true },
);
