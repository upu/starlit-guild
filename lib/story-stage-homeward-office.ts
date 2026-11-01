import type { StageItem } from "./story-stage-cues.ts";
import { actor, ground, held, scene, type LaterBeat } from "./story-stage-later-shared.ts";
import { chair } from "./story-stage-furniture.ts";
import {
  homewardCast,
  homewardTraffic,
  homewardMedicine,
  homewardBottles,
} from "./story-stage-homeward.ts";

const desk = () => ground("table", 48, 28, 16);
const deskItem = (art: StageItem["art"], x: number, width: number): StageItem => ({
  ...ground(art, x, 40, width),
  support: "table",
});
const cups = (filled = 0): StageItem[] =>
  [43, 48, 53].map((x, i) => ({
    ...deskItem(i < filled ? "teacup" : "empty-cup", x, 2.8),
    id: `tea-${String(i)}`,
  }));
function officeItems({
  unloaded = true,
  receipt = "desk",
  filled = 0,
  potHeld = false,
  pouring = false,
  cupHeld = false,
  bottlesDown = unloaded,
}: {
  unloaded?: boolean;
  receipt?: "hand" | "desk";
  filled?: number;
  potHeld?: boolean;
  pouring?: boolean;
  cupHeld?: boolean;
  bottlesDown?: boolean;
} = {}): StageItem[] {
  return [
    homewardMedicine(!unloaded),
    { ...homewardBottles(!bottlesDown), ...(!bottlesDown ? {} : { x: 72, bottom: 47 }) },
    receipt === "hand"
      ? held("folded-paper", "aria", { width: 4.5, x: 3, bottom: 27.5 })
      : { ...deskItem("folded-paper", 53, 4.5), bottom: 41 },
    potHeld
      ? held("teapot", "aria", { width: 4.5, x: 3, bottom: 29, pouring, tilt: pouring ? -20 : 0 })
      : { ...deskItem("teapot", 46, 4.5), bottom: 42 },
    ...cups(filled).map((cup, i) =>
      cupHeld && i === 0
        ? held("teacup", "aria", { id: cup.id, x: 3, width: 2.8, bottom: 27 })
        : cup,
    ),
  ];
}
const officeArrival: LaterBeat = {
  at: 1,
  background: "medicine-room",
  extras: [],
  cast: [
    actor("aria", 64, { bottom: 26, dressed: true, left: true, pose: "offer" }),
    actor("leon", 69, { bottom: 29, dressed: true, left: true, carry: true }),
    actor("mira", 22, { bottom: 30, dressed: true, left: false, carry: true }),
  ],
  furniture: [desk(), chair(actor("mira", 32, { bottom: 30, left: false }))],
  items: officeItems({ unloaded: false, receipt: "hand" }),
  sequence: [
    {
      after: 700,
      actors: { mira: { carry: false, pose: "offer" }, leon: { x: 75, bottom: 47 } },
      items: officeItems({ receipt: "hand", bottlesDown: false }),
    },
    {
      after: 1500,
      actors: {
        mira: { x: 32 },
        aria: { x: 50, bottom: 29, left: false },
      },
    },
    {
      after: 2500,
      actors: { leon: { carry: false, pose: "offer" } },
      items: officeItems({ receipt: "hand" }),
    },
    { after: 3300, items: officeItems() },
    {
      after: 4100,
      actors: { aria: { x: 67, bottom: 24, left: true }, leon: { x: 62, bottom: 48 } },
    },
  ],
};
const prepareTea: LaterBeat = {
  at: 9,
  actors: {
    mira: { x: 32, pose: "offer" },
    aria: {
      x: 43,
      bottom: 24,
      left: false,
      via: [
        { x: 67, bottom: 17 },
        { x: 43, bottom: 17 },
      ],
    },
  },
  sequence: [
    { after: 2800, actors: { aria: { pose: "offer" } }, items: officeItems({ potHeld: true }) },
    { after: 3600, items: officeItems({ potHeld: true, pouring: true }) },
    { after: 4300, actors: { aria: { x: 48 } }, items: officeItems({ potHeld: true, filled: 1 }) },
    { after: 4900, items: officeItems({ potHeld: true, pouring: true, filled: 1 }) },
    { after: 5600, actors: { aria: { x: 53 } }, items: officeItems({ potHeld: true, filled: 2 }) },
    { after: 6200, items: officeItems({ potHeld: true, pouring: true, filled: 2 }) },
    { after: 7000, actors: { aria: { x: 43 } }, items: officeItems({ potHeld: true, filled: 3 }) },
    { after: 7900, items: officeItems({ filled: 3 }) },
    {
      after: 8700,
      actors: { mira: { x: 15, bottom: 62, via: [{ x: 25, bottom: 44 }], left: false } },
    },
    { after: 10900, actors: { mira: { pose: "offer", via: undefined } } },
  ],
};
export const homewardReturn = scene("mountain-road", homewardCast(), [
  homewardTraffic,
  officeArrival,
  { at: 3, actors: { aria: { pose: "greet" } } },
  { at: 6, actors: { aria: { reaction: "surprise" } } },
  prepareTea,
  {
    at: 10,
    actors: {
      mira: { x: 32, bottom: 30, via: [{ x: 22, bottom: 44 }], left: false },
      aria: { x: 39, bottom: 24, left: true, pose: "offer" },
    },
    items: officeItems({ filled: 3, cupHeld: true }),
    sequence: [
      {
        after: 2400,
        actors: { mira: { seated: true, chair: true, via: undefined, pose: "offer" } },
      },
    ],
  },
]);
