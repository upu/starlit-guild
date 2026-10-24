import { actor, ground, scene, type LaterBeat } from "./story-stage-later-shared.ts";
import { mossCartDriver, mossCartItems } from "./story-stage-moss-trail.ts";

const companions = () => [
  actor("aria", 12, { bottom: 14, left: false }),
  actor("leon", 34, { bottom: 12, left: false, routeNotes: "read" }),
  actor("mira", 58, { bottom: 15, left: true }),
  actor("finn", 80, { bottom: 12, left: true }),
];
export const secondDayDeparture = scene(
  "brekka-alley",
  companions(),
  [
    { at: 0 },
    { at: 3, actors: { leon: { routeNotes: "read" } } },
    { at: 4, actors: { aria: { pose: "think" } } },
    {
      at: 5,
      actors: { leon: { routeNotes: undefined }, mira: { left: false }, finn: { left: false } },
    },
  ],
  {
    cell: 24,
    exit: ["aria", "leon", "mira", "finn"],
    exitLanes: { aria: 8, leon: 16, mira: 24, finn: 32 },
  },
);

const scraps = () => [
  { ...ground("moss", 10, 34, 1.6), id: "moss-scrap-1" },
  { ...ground("moss", 16, 31, 1.2), id: "moss-scrap-2" },
  { ...ground("moss", 21, 27, 1.4), id: "moss-scrap-3" },
];
const below = () => [
  actor("aria", 21, { bottom: 22, left: true }),
  actor("leon", 45, { bottom: 15, left: true }),
  actor("mira", 28, { bottom: -7, left: false }),
  actor("finn", 64, { bottom: -2, left: false }),
];
const above = () => [
  actor("aria", 21, { bottom: 80, left: false }),
  actor("leon", 36, { bottom: 80, left: false }),
  actor("mira", 49, { bottom: 80, left: false }),
  actor("finn", 60, { bottom: 80, left: false }),
];
const leftSteps = [
  { x: 43, bottom: 27 },
  { x: 53, bottom: 50 },
  { x: 57, bottom: 64 },
  { x: 57, bottom: 76 },
];
const rightSteps = [
  { x: 54, bottom: 27 },
  { x: 64, bottom: 50 },
  { x: 68, bottom: 64 },
  { x: 68, bottom: 76 },
];
const ascent: LaterBeat = {
  at: 7,
  actors: { aria: { inspect: false, left: false }, leon: { routeNotes: undefined, left: false } },
  extras: [mossCartDriver(120, 0)],
  items: [...mossCartItems(false, 0), ...scraps()],
  sequence: [
    { after: 100, actors: { aria: { x: 21, bottom: 80, via: leftSteps } } },
    { after: 600, actors: { leon: { x: 36, bottom: 80, via: rightSteps } } },
    { after: 1300, actors: { mira: { x: 49, bottom: 80, via: leftSteps } } },
    { after: 2000, actors: { finn: { x: 60, bottom: 80, via: rightSteps } } },
  ],
};

export const secondDayReturn = scene(
  "brekka-fork",
  companions(),
  [
    {
      at: 0,
      actors: { leon: { routeNotes: undefined }, mira: { left: false }, finn: { left: false } },
      extras: [mossCartDriver(70, 32)],
      items: mossCartItems(false, 32),
      sequence: [{ after: 80, extras: [mossCartDriver(120, 32)] }],
    },
    { at: 1, actors: { aria: { pose: "greet" } } },
    {
      at: 2,
      actors: { leon: { routeNotes: "write" } },
      sequence: [{ after: 1800, actors: { leon: { routeNotes: "read" } } }],
    },
    {
      at: 3,
      background: "brekka-tower-path",
      cut: true,
      cast: below(),
      extras: [mossCartDriver(98, 0)],
      items: [...mossCartItems(false, 0), ...scraps()],
    },
    { at: 4, actors: { aria: { x: 13, bottom: 29, inspect: true } } },
    { at: 6, actors: { finn: { pose: "greet" } } },
    ascent,
    {
      at: 8,
      cut: true,
      cast: above(),
      extras: [mossCartDriver(98, 68)],
      items: [...mossCartItems(false, 68), ...scraps()],
      sequence: [{ after: 80, extras: [mossCartDriver(120, 68)] }],
    },
    {
      at: 9,
      actors: { finn: { pose: "greet" } },
      sequence: [
        {
          after: 800,
          actors: {
            finn: {
              x: 30,
              bottom: -75,
              via: [...rightSteps.toReversed(), { x: 35, bottom: 12 }],
            },
          },
        },
      ],
    },
    { at: 10, actors: { mira: { pose: "greet" } } },
  ],
  { cell: 24 },
);
