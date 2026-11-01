import { actor, ground, held, scene, type LaterBeat } from "./story-stage-later-shared.ts";
import { tastingItems as items } from "./story-stage-walnut-items.ts";

const pale = { remaining: ["medium", "dark"] as const, cake: "light" as const };
const medium = { remaining: ["dark"] as const, cake: "medium" as const };
// The narrow bench has its own back edge; the floor cloth stays in front of the boots.
const bench = ground("low-bench", 60.5, 26, 26);
const opening: LaterBeat[] = [
  {
    at: 0,
    actors: { leon: { pose: "offer" } },
    items: [
      held("packing-cloth", "leon", { width: 6, bottom: 29.5, x: -4.5 }),
      ground("basket", 76, 24, 6),
      ground("travel-flask", 60.5, 23, 4),
    ],
    sequence: [
      { after: 500, items: items() },
      { after: 1100, items: items({ remaining: ["light", "medium", "dark"] }) },
    ],
  },
  {
    at: 7,
    actors: { aria: { x: 56, scoot: true, pose: "offer" } },
    sequence: [{ after: 900, actors: { aria: { scoot: false } } }],
  },
  {
    at: 8,
    actors: { aria: { pose: "offer" }, leon: { pose: "offer" } },
    items: items({ ...pale, hold: "whole" }),
    sequence: [
      { after: 700, items: items({ ...pale, hold: "split" }) },
      { after: 1500, items: items({ ...pale, hold: "pass" }) },
      {
        after: 2300,
        items: items({ ...pale, hold: "lap" }),
        actors: { aria: { pose: "idle" }, leon: { pose: "idle" } },
      },
    ],
  },
  {
    at: 14,
    items: items({ ...pale, hold: "lap" }),
    sequence: [
      {
        after: 400,
        actors: { aria: { pose: "think" }, leon: { pose: "think" } },
        items: items({ ...pale, hold: "bite" }),
      },
      {
        after: 1600,
        actors: { aria: { pose: "think" }, leon: { pose: "idle" } },
        items: items({ remaining: ["medium", "dark"] }),
      },
    ],
  },
  {
    at: 20,
    actors: { aria: { pose: "offer" }, leon: { pose: "offer" } },
    items: items({ ...medium, hold: "whole" }),
    sequence: [
      { after: 700, items: items({ ...medium, hold: "split", nuts: "ground" }) },
      { after: 1400, items: items({ ...medium, hold: "pass", nuts: "ground" }) },
      {
        after: 2200,
        actors: { aria: { perch: false, inspect: true } },
        items: items({ ...medium, hold: "lap", nuts: "picked" }),
      },
      {
        after: 3200,
        actors: { aria: { perch: true, inspect: false, pose: "idle" }, leon: { pose: "idle" } },
        items: items({ ...medium, hold: "lap", nuts: "ground" }),
      },
    ],
  },
  {
    at: 23,
    actors: { aria: { pose: "think" }, leon: { pose: "think" } },
    items: items({ ...medium, hold: "bite", nuts: "ground" }),
    sequence: [
      {
        after: 1500,
        actors: { aria: { pose: "idle" }, leon: { pose: "idle" } },
        items: items({ ...medium, hold: "lap", nuts: "ground" }),
      },
    ],
  },
];
const darkCake: LaterBeat[] = [
  {
    at: 35,
    actors: { aria: { pose: "think" }, leon: { pose: "think", reaction: "nod" } },
    items: items({ ...medium, hold: "bite", nuts: "ground" }),
    sequence: [
      {
        after: 1300,
        actors: { aria: { pose: "offer" }, leon: { pose: "offer", reaction: undefined } },
        items: items({ cake: "dark", hold: "whole", nuts: "ground", nudge: true }),
      },
    ],
  },
  {
    at: 38,
    actors: { aria: { pose: "offer" } },
    items: items({ cake: "dark", hold: "whole", nuts: "ground", nudge: true }),
    sequence: [
      {
        after: 700,
        items: items({ cake: "dark", hold: "underside", nuts: "ground", nudge: true }),
      },
    ],
  },
  {
    at: 41,
    actors: { aria: { pose: "offer" }, leon: { pose: "offer" } },
    items: items({ cake: "dark", hold: "split", nuts: "ground", nudge: true }),
    sequence: [
      { after: 800, items: items({ cake: "dark", hold: "pass", nuts: "ground", nudge: true }) },
      { after: 1600, items: items({ cake: "dark", hold: "lap", nuts: "ground", nudge: true }) },
    ],
  },
  {
    at: 42,
    actors: { aria: { pose: "think" } },
    items: items({ cake: "dark", hold: "aria-bite", nuts: "ground", nudge: true }),
    sequence: [
      { after: 1000, items: items({ nuts: "ground", nudge: true }) },
      { after: 1700, actors: { aria: { perch: false, inspect: true } } },
      { after: 2500, items: items({ nuts: "ground", nudge: true, flask: "lift" }) },
      {
        after: 3400,
        actors: { aria: { perch: true, inspect: false, pose: "idle" } },
        items: items({ nuts: "ground", nudge: true, flask: "held" }),
      },
    ],
  },
  { at: 44, items: items({ nuts: "ground", nudge: true }) },
];
const ending: LaterBeat[] = [
  {
    at: 49,
    actors: { leon: { perch: false, inspect: true }, aria: { perch: false, inspect: true } },
    items: items({ nuts: "ground", nudge: true }),
    sequence: [
      {
        after: 1000,
        actors: {
          aria: { perch: true, inspect: false, pose: "offer" },
          leon: { perch: true, inspect: false, pose: "offer" },
        },
        items: items({ nuts: "split", nudge: true }),
      },
      { after: 1800, items: items({ nuts: "pass", nudge: true }) },
      {
        after: 2600,
        actors: { aria: { pose: "idle" }, leon: { pose: "idle" } },
        items: items({ nuts: "lap", nudge: true }),
      },
    ],
  },
  {
    at: 54,
    actors: { aria: { pose: "think" }, leon: { pose: "think" } },
    items: items({ nuts: "bite", nudge: true }),
    sequence: [
      { after: 1200, actors: { aria: { pose: "idle" }, leon: { pose: "offer" } }, items: items() },
      { after: 2200, items: items({ tidy: "fold" }) },
      {
        after: 3000,
        actors: { aria: { seated: false, perch: false }, leon: { seated: false, perch: false } },
        items: items({ tidy: "packed" }),
      },
    ],
  },
];
export const walnutTasting = scene(
  "roadside-rest",
  [
    actor("aria", 54, { bottom: 24, left: false, seated: true, perch: true, nameOffset: -16 }),
    actor("leon", 65, { bottom: 24, left: true, seated: true, perch: true, nameOffset: 16 }),
  ],
  [...opening, ...darkCake, ...ending],
  {
    furniture: [bench],
    exit: ["aria", "leon"],
    exitSide: "left",
    exitRoutes: {
      aria: {
        x: -10,
        bottom: -40,
        via: [
          { x: 50, bottom: 18 },
          { x: 20, bottom: 8 },
          { x: 0, bottom: -5 },
          { x: -5, bottom: -23 },
        ],
      },
      leon: {
        x: -18,
        bottom: -45,
        via: [
          { x: 65, bottom: 14 },
          { x: 15, bottom: 10 },
          { x: 1, bottom: -10 },
          { x: -7, bottom: -26 },
        ],
      },
    },
  },
);
