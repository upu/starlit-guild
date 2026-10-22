import { scene, quintet, held, ground, npc } from "./story-stage-later-shared.ts";

const cart = (stuck = true, x = 52) => ({
  ...ground("seedling-cart", x, stuck ? 28 : 32, 25),
  tilt: stuck ? -12 : 0,
});
const tools = () => ground("tools", 36, 13, 9);
const carried = () => [held("seedlings", "lico", { width: 10, bottom: 17 }), tools(), cart()];
const placed = () => [
  ground("seedlings", 27, 14, 10),
  ground("picnic-cloth", 27, 12, 13),
  tools(),
  cart(),
];

export const transplantDeparture = scene("moss-beds", quintet(), [
  {
    at: 0,
    items: [ground("seedlings", 50, 34, 16), held("ledger", "lico"), ground("tools", 39)],
    extras: [npc("keeper", undefined, 27)],
  },
  { at: 5, extras: [npc("keeper", undefined, 27, "explain", true)] },
  { at: 9, actors: { leon: { pose: "think" } } },
  {
    at: 13,
    actors: { mira: { x: 110 } },
    items: [ground("seedlings", 50, 34, 16), ground("tools", 39), held("medicine", "mira")],
  },
  {
    at: 16,
    night: true,
    actors: {
      mira: { x: 51 },
      lico: { carry: true, left: false, x: 83 },
      leon: { carry: true, left: false },
    },
    items: [
      held("seedlings", "lico", { width: 10, bottom: 17 }),
      held("tools", "leon", { width: 9, bottom: 17 }),
      cart(false, 48),
    ],
    extras: [],
    sequence: [
      {
        after: 2200,
        actors: {
          aria: { x: 23 },
          leon: { x: 39 },
          mira: { x: 55 },
          finn: { x: 71 },
          lico: { x: 84 },
        },
        items: [
          held("seedlings", "lico", { width: 10, bottom: 17 }),
          held("tools", "leon", { width: 9, bottom: 17 }),
          cart(false),
        ],
      },
    ],
  },
  {
    at: 20,
    actors: { lico: { x: 78, left: true }, mira: { x: 54 }, finn: { bottom: 30 } },
    items: [
      held("seedlings", "lico", { width: 10, bottom: 17 }),
      held("tools", "leon", { width: 9, bottom: 17 }),
      cart(),
    ],
  },
  {
    at: 25,
    actors: { leon: { carry: false, x: 34, bottom: 34, left: true } },
    items: carried(),
    sequence: [{ after: 800, actors: { leon: { sword: true } } }],
  },
  { at: 29, actors: { aria: { x: 64, lane: 0, pose: "offer" } } },
  {
    at: 31,
    actors: {
      aria: { carry: true, x: 65, left: false },
      lico: { carry: false },
      mira: { inspect: true },
    },
    items: [held("seedlings", "aria", { width: 10, bottom: 17 }), tools(), cart()],
    sequence: [
      { after: 700, actors: { aria: { x: 31, lane: 0, left: true } } },
      {
        after: 2800,
        actors: { aria: { carry: false, place: true, pose: "offer", lane: undefined } },
        items: placed(),
      },
      { after: 3600, actors: { aria: { x: 42, lane: 0, place: false, pose: "think" } } },
    ],
  },
  {
    at: 35,
    actors: { lico: { x: 31, lane: 0, carry: false }, mira: { inspect: false, pose: "offer" } },
    sequence: [
      {
        after: 2700,
        actors: { lico: { carry: true, left: true, lane: undefined } },
        items: [
          held("seedlings", "lico", { width: 10, bottom: 17 }),
          ground("picnic-cloth", 27, 12, 13),
          tools(),
          cart(),
        ],
      },
    ],
  },
  {
    at: 37,
    actors: {
      aria: { x: 54, bottom: 25, pose: "offer" },
      mira: { x: 64, bottom: 25, pose: "offer" },
      finn: { x: 65, bottom: 40, pose: "offer" },
    },
    sequence: [
      {
        after: 900,
        items: [held("seedlings", "lico", { width: 10, bottom: 17 }), tools(), cart(false)],
      },
      {
        after: 1800,
        actors: {
          aria: { x: 112, lane: 3 },
          lico: { x: 114, left: false, lane: 0 },
          mira: { x: 117, lane: 16 },
          finn: { x: 119, bottom: 40, pull: true, left: false },
        },
        items: [
          held("seedlings", "lico", { width: 10, bottom: 17 }),
          tools(),
          { ...cart(false, -13), bottom: 6, actor: "finn" },
        ],
      },
    ],
  },
]);
