import type { StageItem } from "./story-stage-cues.ts";
import { ground, held, type LaterBeat } from "./story-stage-later-shared.ts";
import {
  roadController,
  roadSign,
  roadMedicine,
  roadHoney,
  roadDolls,
  movingRoadCargo,
  leavingCarrier,
} from "./story-stage-blockade-road.ts";

export const honeyBag = (open = false): StageItem => ({
  ...ground(open ? "honey-bag-open" : "honey-bag", 76, 24, 8),
  id: "honey-bag",
});
export const heldBag = () => held("honey-bag", "mira", { x: -4, bottom: 20, width: 8 });
const stowedHoney = (stored = true): StageItem => ({
  ...ground("honey", 0, 3, 6),
  carrier: "honey-bag",
  stored,
});
const base = (open = false) => [roadSign(), roadMedicine(open), honeyBag(), stowedHoney()];
const retreat = (leaving = false): StageItem[] => {
  const dolls = roadDolls(leaving ? 111 : 84, leaving ? 112 : 62).map((p) =>
    p.id === "golem" ? { ...p, left: true, travelMs: 2300 } : p,
  );
  return dolls.map((p) =>
    p.id === "small-puppet" ? { ...p, carrier: "golem", x: -12.8, bottom: 15, figure: "kneel" } : p,
  );
};
const bandage = (owner: "aria" | "mira", tilt = 0) =>
  held("cloth", owner, { id: "bandage", bottom: owner === "aria" ? 25 : 24, width: 3, tilt });
const pickupDolls = (held = false): StageItem[] =>
  roadDolls(84, 62).map((p) => {
    if (p.id === "golem") return { ...p, figure: "kneel" };
    if (p.id === "small-puppet" && held)
      return { ...p, carrier: "golem", x: -10, bottom: 7.5, figure: "kneel" };
    return p;
  });
const pickupItems = (held = false): StageItem[] => [
  roadSign(),
  roadMedicine(),
  roadHoney(),
  heldBag(),
  ...pickupDolls(held),
  ...movingRoadCargo(),
];

export const departureAndCare: LaterBeat[] = [
  {
    at: 21,
    extras: [roadController({ pose: "point" }), leavingCarrier()],
    items: pickupItems(),
    sequence: [
      { after: 650, items: pickupItems(true) },
      {
        after: 1600,
        items: [
          roadSign(),
          roadMedicine(),
          roadHoney(),
          heldBag(),
          ...retreat(),
          ...movingRoadCargo(),
        ],
      },
    ],
  },
  {
    at: 22,
    actors: { mira: { x: 72, bottom: 24, left: false } },
    extras: [roadController({ x: 111, bottom: 64 }), leavingCarrier()],
    items: [
      roadSign(),
      roadMedicine(),
      roadHoney(),
      heldBag(),
      ...retreat(true),
      ...movingRoadCargo(),
    ],
    sequence: [
      {
        after: 650,
        actors: { mira: { inspect: true } },
        items: [
          roadSign(),
          roadMedicine(),
          roadHoney(),
          honeyBag(true),
          ...retreat(true),
          ...movingRoadCargo(),
        ],
      },
      {
        after: 1400,
        items: [
          roadSign(),
          roadMedicine(),
          honeyBag(true),
          stowedHoney(false),
          ...retreat(true),
          ...movingRoadCargo(),
        ],
      },
      {
        after: 2200,
        items: [
          roadSign(),
          roadMedicine(),
          honeyBag(true),
          stowedHoney(),
          ...retreat(true),
          ...movingRoadCargo(),
        ],
      },
      { after: 2800, items: [...base(), ...retreat(true), ...movingRoadCargo()] },
      { after: 3400, actors: { mira: { inspect: false, pose: "offer" } } },
    ],
  },
  {
    at: 24,
    actors: {
      aria: { x: 60, bottom: 23, left: false, pose: "think" },
      leon: { x: 45, bottom: 25 },
    },
    items: base(),
  },
  { at: 27, actors: { mira: { pose: "think" } } },
  {
    at: 29,
    actors: {
      leon: { x: 52, bottom: 22, left: false, inspect: true },
      aria: { x: 60, bottom: 38, via: [{ x: 50, bottom: 38 }] },
    },
    sequence: [
      { after: 1000, items: base(true) },
      {
        after: 1900,
        actors: {
          leon: { x: 45, bottom: 22, inspect: false },
          aria: { x: 60, bottom: 23, left: true, via: undefined },
        },
      },
    ],
  },
  {
    at: 30,
    actors: {
      aria: { inspect: true, left: true },
      mira: { x: 68, bottom: 22, left: true, seated: true },
    },
    items: [...base(true), bandage("aria")],
    sequence: [
      { after: 800, actors: { aria: { left: false } } },
      { after: 1500, items: [...base(true), bandage("aria", 12)] },
      { after: 2300, items: [...base(true), bandage("aria", -8)] },
      { after: 3100, items: [...base(true), bandage("mira")] },
      { after: 4000, actors: { aria: { x: 58, bottom: 42, inspect: false } } },
    ],
  },
  {
    at: 31,
    actors: {
      mira: { x: 72, bottom: 24, seated: false, left: false },
      leon: { x: 52, bottom: 22, carry: true, left: false },
    },
    items: [
      roadSign(),
      { ...held("medicine-closed", "leon", { width: 8, bottom: 22 }), id: "medicine" },
      heldBag(),
      stowedHoney(),
      bandage("mira"),
    ],
  },
];
