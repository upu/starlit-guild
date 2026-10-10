import {
  scene,
  quartet,
  held,
  ground,
  table,
  onTable,
  npc,
  type LaterStage,
} from "./story-stage-later-shared.ts";
const servant = (speaking = false) =>
  npc("worker", "使用人", 72, speaking ? "explain" : "idle", speaking);
export const manorStages: Record<string, LaterStage> = {
  "riverside-manor-departure": scene("manor-garden", quartet(), [
    { at: 0, actors: { finn: { x: 77, pose: "greet" } } },
    { at: 3, extras: [npc("cook", "料理人", 77, "explain", true)] },
    {
      at: 5,
      actors: { finn: { pose: "tease" } },
      items: [table(52), onTable("cloth", 52, 15), held("key", "finn", { width: 3 })],
    },
    { at: 8, extras: [npc("cook", "料理人", 77, "point", true)] },
    { at: 9, actors: { mira: { pose: "think" } } },
  ]),
  "riverside-manor-return": scene(
    "manor-garden",
    quartet(),
    [
      {
        at: 0,
        items: [table(52), onTable("keystone", 52)],
        extras: [npc("worker", "庭師", 74), npc("merchant", "庭の主人", 29)],
      },
      {
        at: 2,
        extras: [npc("worker", "庭師", 74), npc("merchant", "庭の主人", 29, "explain", true)],
      },
      { at: 6, items: [table(52), onTable("cloth", 52, 15)], extras: [] },
      { at: 15, actors: { aria: { reaction: "surprise" } } },
      { at: 19, actors: { aria: { pose: "greet" } } },
      {
        at: 21,
        items: [table(52), onTable("keystone", 52), held("ledger", "leon"), held("cloth", "aria")],
      },
    ],
    { exit: ["aria", "leon", "mira", "finn"] },
  ),
  "manor-survey-departure": scene("berne-street", quartet(), [
    { at: 0, items: [held("tools", "leon"), held("pot", "finn")] },
    {
      at: 9,
      background: "manor-garden",
      actors: { aria: { pose: "think" } },
      extras: [npc("worker", "門番", 75)],
    },
    { at: 11, actors: { aria: { reaction: "surprise" }, finn: { pose: "greet" } } },
    {
      at: 12,
      items: [held("tools", "leon"), ground("pot", 75, 39, 10)],
      extras: [npc("cook", "料理人", 75, "explain", true)],
    },
    { at: 15, items: [held("tools", "leon"), held("cloth", "finn")] },
  ]),
  "manor-survey-return": scene("manor-garden", quartet(), [
    { at: 0, items: [table(52), onTable("cloth", 52, 15)], extras: [npc("worker", "庭師", 75)] },
    { at: 2, actors: { finn: { pose: "tease" } } },
    { at: 3, actors: { leon: { pose: "think" } } },
    {
      at: 10,
      actors: { finn: { x: 77 }, aria: { x: 27, pose: "offer" } },
      items: [table(52), onTable("cloth", 52, 15)],
    },
    { at: 13, actors: { mira: { x: 67, inspect: true } } },
    { at: 14, actors: { finn: { x: 82, pose: "offer" } } },
  ]),
  "garden-reception-departure": scene(
    "manor-garden",
    quartet(),
    [
      { at: 0, items: [ground("handcart", 63, 28, 25), held("tools", "leon")] },
      { at: 2, actors: { aria: { x: 33 } } },
      { at: 4, actors: { aria: { x: 20, pose: "think" } } },
      { at: 6, actors: { leon: { reaction: "surprise" } }, extras: [servant()] },
      {
        at: 10,
        actors: { leon: { inspect: true } },
        items: [ground("handcart", 63, 28, 25), ground("tools", 72, 36, 12)],
      },
      { at: 12, actors: { aria: { inspect: true }, leon: { inspect: false } } },
      { at: 14, items: [held("map", "leon"), ground("handcart", 63, 28, 25)] },
      { at: 15, actors: { aria: { inspect: false, pose: "offer" } } },
    ],
    { exit: ["aria", "leon", "mira", "finn"] },
  ),
  "garden-reception-return": scene("manor-garden", quartet(), [
    { at: 0, actors: { aria: { inspect: true } }, items: [table(51), onTable("cloth", 51, 14)] },
    { at: 1, actors: { aria: { inspect: false } } },
    { at: 2, extras: [servant()] },
    { at: 7, actors: { aria: { pose: "offer" } } },
    { at: 10, actors: { leon: { pose: "offer" } } },
    {
      at: 13,
      items: [table(51), onTable("cloth", 51, 14), held("cloth", "leon", { id: "spare-cloth" })],
    },
    {
      at: 18,
      items: [table(51), onTable("cloth", 51, 14), held("cloth", "finn", { id: "spare-cloth" })],
    },
  ]),
  "keystone-night-road-departure": scene("manor-garden", quartet(), [
    { at: 0, night: true, items: [table(57), onTable("keystone", 57)], extras: [servant()] },
    { at: 2, actors: { finn: { x: 76, inspect: true } } },
    { at: 3, actors: { finn: { inspect: false } }, items: [table(57), onTable("cloth", 57, 15)] },
    { at: 7, actors: { mira: { x: 63, pose: "offer" } } },
    {
      at: 9,
      items: [table(57), onTable("cloth", 57, 15), held("cloth", "finn", { id: "bandage" })],
    },
    { at: 11, actors: { leon: { x: 48, pose: "offer" } } },
    { at: 12, actors: { aria: { x: 31, pose: "offer" } } },
  ]),
  "keystone-night-road-return": scene(
    "bridge-night",
    quartet(),
    [
      { at: 0, actors: { leon: { x: 41 } }, items: [ground("cloth", 53, 15, 14)] },
      {
        at: 6,
        actors: { mira: { x: 65, inspect: true }, finn: { pose: "offer" } },
        items: [ground("cloth", 53, 15, 14), held("cloth", "mira", { id: "bandage" })],
      },
      { at: 11, actors: { mira: { inspect: false } } },
    ],
    { night: true, initial: { leon: -8 } },
  ),
};
