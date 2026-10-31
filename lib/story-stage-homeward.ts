import type { StageExtra, StageItem } from "./story-stage-cues.ts";
import { actor, ground, held, npc, scene, type LaterBeat } from "./story-stage-later-shared.ts";

export const homewardMedicine = (carried = true): StageItem => ({
  ...(carried
    ? held("medicine-closed", "mira", { x: 2.2, bottom: 22, width: 8 })
    : ground("medicine-closed", 24, 30, 8)),
  id: "medicine",
});
export const homewardBottles = (carried = true): StageItem => ({
  ...(carried
    ? held("empty-bottles", "leon", { x: -3, bottom: 16, width: 8 })
    : ground("empty-bottles", 65, 27, 8)),
  id: "bottle-bag",
});
export const homewardLoad = (): StageItem[] => [homewardMedicine(), homewardBottles()];
export const homewardCast = () => [
  actor("aria", 34, { bottom: 28, dressed: true, left: false }),
  actor("leon", 52, { bottom: 26, dressed: true, carry: true, left: false }),
  actor("mira", 70, { bottom: 30, dressed: true, carry: true, left: true }),
];
const carrier = (x: number, hatGreeting = false): StageExtra => ({
  ...npc("worker", "運び手", x),
  bottom: 20,
  carry: !hatGreeting,
  hatGreeting,
  left: false,
});
const passingLoad = (): StageItem[] => [
  ...homewardLoad(),
  { ...ground("empty-cart", 8, 18, 25), extra: "worker", left: true },
  { ...ground("trade-parcels", -4, 15, 7.5), carrier: "empty-cart", id: "passing-goods" },
];
const roadPass: LaterBeat = {
  at: 4,
  background: "mountain-road",
  cast: homewardCast(),
  extras: [carrier(100)],
  items: passingLoad(),
  sequence: [
    {
      after: 200,
      actors: {
        aria: { x: 29, bottom: 48 },
        leon: { x: 46, bottom: 47 },
        mira: { x: 63, bottom: 46 },
      },
    },
    { after: 900, extras: [carrier(60)] },
    { after: 4500, extras: [carrier(60, true)] },
    { after: 5300, extras: [carrier(-30)] },
  ],
};

export const homewardTraffic: LaterBeat = {
  ...roadPass,
  at: 0,
  sequence: [...(roadPass.sequence ?? []).slice(0, 2), { after: 3400, extras: [carrier(-30)] }],
};

export const homewardDeparture = scene(
  "village-house",
  homewardCast(),
  [
    {
      at: 0,
      extras: [{ ...npc("parent", "家の人", 6, "wave"), bottom: 57, limp: true }],
      actors: { mira: { carry: false, packing: true } },
      items: [{ ...homewardMedicine(false), x: 67.8, bottom: 30 }, homewardBottles()],
      sequence: [
        { after: 700, actors: { mira: { packing: false, carry: true } }, items: homewardLoad() },
      ],
    },
    roadPass,
  ],
  { exit: ["aria", "leon", "mira"], exitSide: "left", exitLanes: { aria: 45, leon: 45, mira: 45 } },
);
