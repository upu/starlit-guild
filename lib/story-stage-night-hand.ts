import { actor, npc, scene } from "./story-stage-later-shared.ts";
import { nightHandItems } from "./story-stage-night-hand-items.ts";

const items = nightHandItems();
const servant = () => ({ ...npc("merchant", "交代の使用人", 81), bottom: 47, left: false });

export const nightHand = scene(
  "manor-display-back",
  [
    actor("aria", 35, { bottom: 47, left: false, nameAbove: true }),
    actor("leon", 12, { bottom: 24, left: false }),
    actor("mira", 65, { bottom: 12, left: true }),
    actor("finn", 47, { bottom: 35, left: false }),
  ],
  [
    {
      at: 0,
      items: items(),
      extras: [servant()],
      sequence: [
        {
          after: 800,
          items: items({ cover: "lifting" }),
          extras: [{ ...servant(), pose: "point" }],
        },
        { after: 1500, items: items({ clip: "loose" }) },
      ],
    },
    {
      at: 2,
      actors: { finn: { handAction: "catch" } },
      sequence: [{ after: 350, items: items({ clip: "hand" }) }],
    },
    {
      at: 3,
      items: items({ cover: "closed" }),
      sequence: [
        { after: 100, items: items({ clip: "floor" }) },
        { after: 700, actors: { finn: { handAction: "wipe" } } },
        { after: 800, extras: [{ ...servant(), x: 122, via: [{ x: 94, bottom: 47 }] }] },
        { after: 3500, extras: [], items: items({ servantGone: true }) },
      ],
    },
    { at: 4, actors: { finn: { handAction: "guard" } } },
    {
      at: 7,
      actors: {
        mira: {
          x: 55,
          bottom: 35,
          left: true,
          pose: "offer",
          nameAbove: true,
          via: [
            { x: 76, bottom: 15 },
            { x: 76, bottom: 29 },
          ],
        },
      },
      sequence: [{ after: 2100, items: items({ cloth: "mira" }) }],
    },
    {
      at: 9,
      actors: { finn: { handAction: "palm" }, mira: { pose: "offer", via: undefined } },
      sequence: [
        { after: 350, items: items({ cloth: "finn" }) },
        { after: 1000, items: items({ cloth: "stained" }) },
      ],
    },
    {
      at: 11,
      actors: {
        leon: {
          x: 74,
          bottom: 30,
          left: false,
          pose: "idle",
          via: [
            { x: 12, bottom: -12 },
            { x: 88, bottom: -12 },
            { x: 88, bottom: 30 },
          ],
        },
      },
    },
    {
      at: 12,
      actors: { aria: { x: 44, bottom: 45, left: false, carry: true } },
      sequence: [
        { after: 650, items: items({ potCarried: true }) },
        {
          after: 1400,
          actors: {
            aria: {
              x: 94,
              bottom: 34,
              via: [
                { x: 44, bottom: 65 },
                { x: 90, bottom: 65 },
              ],
            },
          },
        },
      ],
    },
    { at: 16, actors: { finn: { dressed: true } }, items: items({ cloth: "hidden" }) },
  ],
  { night: true },
);
