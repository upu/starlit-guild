import {
  scene,
  quartet,
  duo,
  held,
  ground,
  table,
  onTable,
  npc,
  type LaterStage,
} from "./story-stage-later-shared.ts";
const owner = () => npc("merchant", "店主", 73);
export const brekkaStages: Record<string, LaterStage> = {
  "linde-requests-departure": scene("dining-room", quartet(), [
    {
      at: 0,
      actors: {
        aria: { seated: true },
        leon: { seated: true },
        mira: { seated: true },
        finn: { seated: true },
      },
      items: [table(), onTable("tea")],
      extras: [owner()],
    },
    {
      at: 6,
      items: [table(), onTable("ledger")],
      extras: [{ ...owner(), pose: "explain", speaking: true }],
    },
    { at: 13, actors: { aria: { pose: "surprise", reaction: "surprise" } } },
    { at: 19, extras: [{ ...owner(), pose: "point" }] },
    { at: 20, actors: { aria: { reaction: "surprise" } } },
    { at: 26, items: [table(), onTable("ledger"), held("ledger", "mira", { id: "letter" })] },
  ]),
  "linde-requests-return": scene("dining-room", quartet(), [
    {
      at: 0,
      actors: {
        aria: { seated: true },
        leon: { seated: true },
        mira: { seated: true },
        finn: { seated: true },
      },
      items: [table(), onTable("ledger")],
      extras: [owner()],
    },
    { at: 5, items: [table(), onTable("ledger"), held("ledger", "mira", { id: "letter" })] },
    { at: 7, actors: { aria: { reaction: "surprise" } } },
    { at: 15, extras: [{ ...owner(), pose: "explain", speaking: true }] },
  ]),
  "lantern-detour-departure": scene(
    "hill-path",
    quartet(),
    [
      { at: 0, extras: [npc("worker", "荷運び人", 72, "explain", true)] },
      { at: 1, items: [held("map", "leon")] },
      { at: 4, actors: { aria: { pose: "greet" } } },
      { at: 7, actors: { finn: { pose: "tease" } } },
    ],
    { exit: ["aria", "leon", "mira", "finn"] },
  ),
  "lantern-detour-return": scene("village-house", quartet(), [
    {
      at: 0,
      actors: { leon: { x: 61, bottom: 29, inspect: true, left: true } },
      items: [ground("stone-lantern", 51, 32, 17), ground("tools", 44)],
      extras: [npc("worker", "荷運び人", 74)],
    },
    {
      at: 2,
      actors: { aria: { x: 42, bottom: 35, pose: "offer", left: false } },
      items: [
        ground("stone-lantern", 51, 32, 17),
        held("cloth", "aria", { width: 4, x: 5, support: "stone-lantern" }),
        ground("tools", 44),
      ],
    },
    {
      at: 7,
      night: true,
      actors: {
        leon: { x: 55, bottom: 14, inspect: false },
        aria: { x: 40, bottom: 10, inspect: true },
      },
      extras: [{ ...npc("worker", "荷運び人", 61), bottom: 35 }],
      items: [{ ...ground("stone-lantern", 51, 32, 17), glow: "bright" }, ground("tools", 32)],
    },
    { at: 8, actors: { aria: { inspect: false, pose: "greet" } } },
    { at: 9, extras: [npc("worker", "荷運び人", 74, "explain", true)] },
    {
      at: 18,
      items: [
        { ...ground("stone-lantern", 51, 32, 17), glow: "bright" },
        ground("ledger", 74, 44, 9),
      ],
    },
    {
      at: 21,
      items: [{ ...ground("stone-lantern", 51, 32, 17), glow: "bright" }, held("ledger", "aria")],
    },
  ]),
  "brekka-arrival-departure": scene(
    "dining-room",
    quartet(),
    [
      {
        at: 0,
        actors: {
          aria: { seated: true },
          leon: { seated: true },
          mira: { seated: true },
          finn: { seated: true },
        },
        items: [table(), onTable("tea")],
        extras: [owner()],
      },
      { at: 1, extras: [{ ...owner(), pose: "explain", speaking: true }] },
      {
        at: 12,
        actors: { aria: { reaction: "nod" }, leon: { reaction: "nod" } },
        items: [table(), onTable("juice", 46, 6), onTable("ale", 54, 5)],
      },
      {
        at: 20,
        items: [table(), onTable("juice", 46, 6), onTable("ale", 54, 5), onTable("bread", 50, 7)],
      },
      { at: 22, actors: { leon: { seated: false } } },
      {
        at: 24,
        actors: { aria: { seated: false }, mira: { seated: false }, finn: { seated: false } },
      },
    ],
    { exit: ["aria", "leon", "mira", "finn"] },
  ),
  "brekka-arrival-return": scene("patient-room", quartet(), [
    {
      at: 0,
      actors: { finn: { visible: false } },
      items: [table(), onTable("tea"), ground("medicine", 68)],
      extras: [npc("keeper", "患者", 25, "explain", true), npc("doctor", "町の医者", 73)],
    },
    { at: 2, extras: [npc("keeper", "患者", 25), npc("doctor", "町の医者", 73, "explain", true)] },
    { at: 10, actors: { mira: { pose: "offer" } } },
    {
      at: 12,
      background: "brekka-alley",
      actors: { finn: { visible: true } },
      extras: [],
      items: [held("medicine", "mira")],
    },
    { at: 14, actors: { aria: { reaction: "surprise" } } },
    { at: 27, actors: { mira: { x: 72, pose: "offer" }, leon: { left: true } } },
  ]),
  "glowing-moss-trail-departure": scene(
    "dining-room",
    quartet(),
    [
      {
        at: 0,
        actors: { mira: { pose: "think" } },
        items: [held("ledger", "mira"), ground("medicine", 68)],
      },
      { at: 1, actors: { aria: { pose: "think" } } },
      { at: 3, actors: { finn: { x: 76, pose: "think" } } },
    ],
    { night: true },
  ),
  "glowing-moss-trail-return": scene("brekka-alley", duo(), [
    { at: 0, items: [ground("basket-cart", 76, 37, 25)] },
    { at: 1, actors: { aria: { x: 37, pose: "think" } } },
    {
      at: 3,
      items: [ground("basket-cart", 105, 37, 25), ground("moss", 50, 13, 7)],
      actors: { aria: { inspect: true } },
    },
  ]),
  "glowing-moss-trail-next-day-departure": scene(
    "brekka-alley",
    quartet(),
    [
      { at: 0, items: [held("ledger", "leon")], actors: { mira: { x: 66 }, finn: { x: 82 } } },
      { at: 4, actors: { aria: { pose: "think" } } },
      { at: 5, items: [held("ledger", "leon"), ground("basket-cart", 83, 37, 25)] },
    ],
    { exit: ["aria", "leon", "mira", "finn"] },
  ),
  "glowing-moss-trail-next-day-return": scene("brekka-alley", quartet(), [
    { at: 0, items: [ground("basket-cart", 81, 37, 25), held("ledger", "leon")] },
    { at: 3, background: "moss-beds", items: [held("ledger", "leon"), ground("moss", 47, 15, 6)] },
    { at: 4, actors: { aria: { inspect: true } } },
    { at: 8, actors: { aria: { inspect: false } } },
    { at: 9, actors: { finn: { x: 112, pose: "greet" } } },
  ]),
};
