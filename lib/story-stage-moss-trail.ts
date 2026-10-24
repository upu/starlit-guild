import { actor, ground, scene } from "./story-stage-later-shared.ts";
import type { StageExtra, StageItem } from "./story-stage-cues.ts";

export const tiredMira = scene(
  "brekka-foyer",
  [
    actor("aria", 28, { bottom: 14, left: false }),
    actor("leon", 17, { bottom: 7, left: false }),
    actor("mira", 55, { bottom: 25, left: false, allNighter: "reach" }),
    actor("finn", 76, { bottom: 24, left: true }),
  ],
  [
    {
      at: 0,
      items: [
        { ...ground("chair", 42, 20, 8.5), id: "spare-chair" },
        { ...ground("chair", 61, 8, 8.5), id: "finn-chair" },
      ],
      sequence: [{ after: 1000, actors: { mira: { allNighter: "pause" } } }],
    },
    { at: 1, actors: { aria: { pose: "surprise" } } },
    { at: 2, actors: { mira: { allNighter: "answer" } } },
    { at: 3, actors: { mira: { allNighter: "think" }, finn: { x: 71, pose: "think" } } },
  ],
);

export const mossCartDriver = (x: number, bottom = 36): StageExtra => ({
  id: "worker",
  name: "御者",
  x,
  bottom,
  left: true,
  pullCart: true,
});
export const mossCartItems = (dropped = false, bottom = 36): StageItem[] => [
  { ...ground("basket-cart", -17.3, bottom + 4.3, 33), extra: "worker" },
  { ...ground("cart-wheel", -7.8, 1.2, 14.6), carrier: "basket-cart" },
  dropped
    ? { ...ground("moss", 64.9, 38, 1.8), id: "wheel-moss", dropInPlace: true }
    : { ...ground("moss", -7.8, 10.5, 1.8), id: "wheel-moss", carrier: "basket-cart" },
];

export const followMossCart = scene(
  "brekka-alley",
  [actor("aria", 0, { bottom: 14, left: false }), actor("leon", 14, { bottom: 12, left: false })],
  [
    {
      at: 0,
      extras: [mossCartDriver(61)],
      items: mossCartItems(),
      sequence: [
        { after: 80, extras: [mossCartDriver(75)] },
        { after: 400, actors: { aria: { x: 10 }, leon: { x: 24 } } },
      ],
    },
    {
      at: 1,
      extras: [mossCartDriver(80)],
      actors: { aria: { x: 16, pose: "think" }, leon: { x: 30 } },
    },
    {
      at: 2,
      extras: [mossCartDriver(90)],
      actors: { aria: { x: 23 }, leon: { x: 37, pose: "greet" } },
    },
    {
      at: 3,
      extras: [mossCartDriver(120)],
      items: mossCartItems(true),
      actors: { aria: { x: 33, pose: "surprise" }, leon: { x: 47 } },
    },
  ],
);
