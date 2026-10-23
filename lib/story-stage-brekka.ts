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
import { diningScene } from "./story-stage-furniture.ts";
import { lanternWork } from "./story-stage-lantern-work.ts";
import { lindeDeparture, lindeReturn } from "./story-stage-linde-requests.ts";
const owner = () => npc("merchant", "店主", 73);
export const brekkaStages: Record<string, LaterStage> = {
  "linde-requests-departure": lindeDeparture,
  "linde-requests-return": lindeReturn,
  "lantern-detour-departure": scene(
    "hill-path",
    quartet(),
    [
      { at: 0, extras: [npc("worker", "荷運び人", 72, "explain", true)] },
      {
        at: 1,
        actors: { leon: { pose: "offer" } },
        items: [held("map", "leon", { wrist: true, width: 6.5 })],
      },
      { at: 4, actors: { aria: { pose: "greet" } } },
      { at: 7, actors: { finn: { pose: "tease" } } },
      { at: 8, actors: { leon: { carry: true } } },
    ],
    { exit: ["aria", "leon", "mira", "finn"] },
  ),
  "lantern-detour-return": lanternWork,
  "brekka-arrival-departure": diningScene(
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
      { at: 22, actors: { leon: { seated: false, bottom: 8 } } },
      {
        at: 24,
        actors: {
          aria: { seated: false, bottom: 8 },
          mira: { seated: false },
          finn: { seated: false },
        },
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
