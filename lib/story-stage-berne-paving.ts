import type { StageItem } from "./story-stage-cues.ts";
import { actor, ground, held, npc, scene } from "./story-stage-later-shared.ts";
function luggage(map = false): StageItem[] {
  return [
    held("basket", "aria", { x: 3, bottom: 17, width: 7 }),
    held("medicine-closed", "mira", { x: 2.2, bottom: 22, width: 8 }),
    {
      ...(map
        ? ground("delivery-bag", 70, 18, 8)
        : held("delivery-bag", "leon", { x: -3, bottom: 18, width: 8 })),
      id: "leon-bag",
    },
    ...(map ? [held("map", "leon", { id: "route-map", x: -1, bottom: 23, width: 6 })] : []),
  ];
}
const passer = (speaking = false) => ({
  ...npc("merchant", "通りの人", 56, speaking ? "explain" : "idle", speaking),
  bottom: 47,
});
export const bernePaving = scene(
  "berne-paving",
  [
    actor("aria", 54, { bottom: 20, left: true }),
    actor("leon", 66, { bottom: 18, left: true }),
    actor("mira", 74, { bottom: 36, left: true, carry: true }),
    actor("finn", 89, { bottom: 23, left: true }),
  ],
  [
    { at: 0, items: luggage(), extras: [passer()] },
    { at: 1, actors: { aria: { x: 49, pose: "offer" } } },
    { at: 2, extras: [passer(true)] },
    { at: 3, extras: [passer()] },
    { at: 4, extras: [passer(true)] },
    {
      at: 5,
      extras: [passer()],
      actors: { leon: { writing: true } },
      items: luggage(true),
      sequence: [{ after: 2300, actors: { leon: { writing: false } }, items: luggage() }],
    },
    { at: 9, actors: { leon: { pose: "think" }, finn: { pose: "tease" } } },
  ],
  {
    exit: ["aria", "leon", "mira", "finn"],
    exitRoutes: {
      aria: {
        x: 50,
        bottom: 115,
        via: [
          { x: 51, bottom: 32 },
          { x: 42, bottom: 48 },
          { x: 50, bottom: 90 },
        ],
      },
      leon: {
        x: 58,
        bottom: 115,
        via: [
          { x: 68, bottom: 45 },
          { x: 60, bottom: 80 },
        ],
      },
      mira: {
        x: 63,
        bottom: 115,
        via: [
          { x: 72, bottom: 60 },
          { x: 64, bottom: 85 },
        ],
      },
      finn: {
        x: 68,
        bottom: 115,
        via: [
          { x: 82, bottom: 55 },
          { x: 70, bottom: 80 },
        ],
      },
    },
  },
);
