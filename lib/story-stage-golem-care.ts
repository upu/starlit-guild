import { held, type LaterBeat } from "./story-stage-later-shared.ts";
import { golemFieldItems, type GolemMedicine } from "./story-stage-golem-items.ts";

const wrap = (owner: "mira" | "leon" | "aria", id = "hand-bandage", tilt = 0) =>
  held(owner === "mira" ? "cloth" : "wrist-bandage", owner, {
    id,
    width: owner === "mira" ? 3 : 1.3,
    bottom: owner === "mira" ? 26 : 25,
    tilt,
    wrist: owner !== "mira",
  });
const supplies = (medicine: GolemMedicine = "open") => golemFieldItems("guard", medicine);
const hand = (owner: "mira" | "leon", tilt = 0) => [
  ...supplies(),
  wrap(owner, "hand-bandage", tilt),
];
const arm = (owner: "mira" | "aria", tilt = 0) => [
  ...hand("leon"),
  wrap(owner, "arm-bandage", tilt),
];
const dressed = (medicine: GolemMedicine = "open") => [
  ...supplies(medicine),
  wrap("leon"),
  wrap("aria", "arm-bandage"),
];

export const golemCare: LaterBeat[] = [
  {
    at: 10,
    actors: {
      mira: { x: 41.8, bottom: 35.97, left: true },
      leon: { x: 35, bottom: 28, pose: "offer" },
    },
  },
  {
    at: 13,
    actors: { mira: { x: 68, bottom: 25, left: false }, leon: { pose: "offer" } },
    sequence: [
      { after: 1600, actors: { mira: { carry: false, inspect: true } }, items: supplies() },
    ],
  },
  {
    at: 15,
    actors: { aria: { left: false, pose: "think" } },
    items: hand("mira"),
    sequence: [
      { after: 650, actors: { mira: { x: 41.8, bottom: 35.97, inspect: false, left: true } } },
      { after: 1900, actors: { mira: { inspect: true } } },
    ],
  },
  {
    at: 17,
    actors: { mira: { inspect: true }, aria: { pose: "offer" }, leon: { pose: "offer" } },
    items: hand("mira"),
    sequence: [
      { after: 700, items: hand("mira", 12) },
      { after: 1400, items: hand("leon") },
      {
        after: 2000,
        actors: {
          mira: { x: 58.12, bottom: 37.27, inspect: false, left: true },
          aria: {
            x: 51,
            bottom: 28,
            left: false,
            via: [
              { x: 15, bottom: 15 },
              { x: 51, bottom: 15 },
            ],
          },
        },
        items: arm("mira"),
      },
      { after: 4400, actors: { mira: { inspect: true } }, items: arm("mira", -8) },
      { after: 5200, items: arm("aria") },
      {
        after: 5800,
        actors: {
          mira: {
            x: 50,
            bottom: 48,
            inspect: false,
            left: false,
            via: [
              { x: 59, bottom: 48 },
              { x: 50, bottom: 48 },
            ],
          },
          aria: {
            x: 30,
            bottom: 32,
            left: false,
            pose: "idle",
            via: [
              { x: 51, bottom: 15 },
              { x: 30, bottom: 15 },
            ],
          },
          leon: {
            x: 68,
            bottom: 25,
            inspect: true,
            left: false,
            via: [
              { x: 35, bottom: 10 },
              { x: 68, bottom: 10 },
            ],
          },
        },
      },
      {
        after: 8100,
        actors: { leon: { inspect: false, carry: true, via: undefined } },
        items: [
          ...dressed("closed").filter((p) => p.id !== "medicine"),
          held("medicine-closed", "leon", { id: "medicine", width: 8, bottom: 22 }),
        ],
      },
      { after: 8900, actors: { leon: { x: 36, bottom: 54, via: [{ x: 68, bottom: 54 }] } } },
      {
        after: 11100,
        actors: {
          leon: { x: 36, bottom: 62, carry: false, inspect: true, packing: false, via: undefined },
        },
        items: dressed("stowed"),
      },
      {
        after: 12300,
        actors: {
          mira: { x: 43, bottom: 62, via: undefined },
          leon: {
            x: 40,
            bottom: 20,
            inspect: false,
            packing: false,
            pose: "idle",
            via: [
              { x: 36, bottom: 40 },
              { x: 40, bottom: 40 },
            ],
          },
        },
      },
    ],
  },
];
