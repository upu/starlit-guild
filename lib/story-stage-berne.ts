import { stoneRest } from "./story-stage-stone-rest.ts";
import { overlookRest } from "./story-stage-low-seats.ts";
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
import { chair, diningCast, diningItems, diningScene } from "./story-stage-furniture.ts";
const crew = () => quartet();
const mason = () => npc("worker", "石工", 27);
const keeper = () => npc("keeper", undefined, 73);
export const berneStages: Record<string, LaterStage> = {
  "berne-road-departure": diningScene(
    [
      {
        at: 0,
        actors: { aria: { seated: true }, leon: { seated: true }, mira: { seated: true } },
        items: [table(50), onTable("tea", 50)],
        extras: [npc("merchant", "店主", 25)],
      },
      { at: 1, extras: [npc("merchant", "店主", 25, "explain", true)] },
    ],
    {},
    false,
  ),
  "berne-road-return": overlookRest,
  "berne-house-calls-departure": scene(
    "berne-street",
    crew(),
    [
      { at: 0, items: [held("medicine", "mira")], extras: [npc("merchant", "通りの人", 70)] },
      { at: 2, extras: [npc("merchant", "通りの人", 70, "explain", true)] },
      { at: 5, items: [held("medicine", "mira"), held("map", "leon")] },
      { at: 9, actors: { leon: { pose: "think" }, finn: { pose: "tease" } } },
    ],
    { exit: ["aria", "leon", "mira", "finn"] },
  ),
  "berne-house-calls-return": scene("village-house", crew(), [
    {
      at: 0,
      items: [ground("replacement", 51, 45, 9), held("medicine", "mira")],
      extras: [npc("keeper", "家の人", 73)],
    },
    { at: 2, extras: [npc("keeper", "家の人", 73, "explain", true)] },
    {
      at: 6,
      items: [ground("replacement", 51, 45, 9), held("ledger", "leon"), held("medicine", "mira")],
    },
    {
      at: 10,
      actors: { aria: { seated: true } },
      items: [
        ground("replacement", 51, 45, 9),
        ground("bread", 36),
        held("ledger", "mira"),
        ground("medicine", 45),
      ],
    },
    { at: 14, actors: { leon: { seated: true }, mira: { seated: true } } },
    {
      at: 17,
      actors: { finn: { seated: true } },
      items: [
        ground("replacement", 51, 45, 9),
        held("bread", "finn"),
        held("bread", "leon", { id: "leon-bread" }),
        ground("medicine", 45),
      ],
    },
    {
      at: 20,
      items: [
        ground("replacement", 51, 45, 9),
        held("bread", "mira"),
        ground("tea", 50),
        ground("medicine", 45),
      ],
    },
    { at: 22, extras: [npc("keeper", "家の人", 73, "explain", true)] },
  ]),
  "missing-keystone-departure": scene("tower-foot", crew(), [
    {
      at: 0,
      items: [table(51), onTable("map", 47), onTable("ledger", 57)],
      extras: [mason(), keeper()],
    },
    { at: 2, extras: [mason(), { ...keeper(), pose: "explain", speaking: true }] },
    { at: 3, actors: { aria: { inspect: true } } },
    { at: 4, extras: [{ ...mason(), pose: "point", speaking: true }, keeper()] },
    {
      at: 6,
      actors: { aria: { inspect: false } },
      items: [table(51), onTable("map", 47), held("ledger", "finn")],
    },
    { at: 8, actors: { leon: { pose: "offer" } } },
    {
      at: 11,
      items: [table(51), onTable("map", 47), onTable("ledger", 57)],
      actors: { finn: { pose: "tease" } },
    },
  ]),
  "missing-keystone-return": scene(
    "tower-foot",
    crew(),
    [
      { at: 0, items: [ground("tools", 50), held("map", "leon")], extras: [mason(), keeper()] },
      { at: 1, extras: [{ ...mason(), pose: "point", speaking: true }, keeper()] },
      { at: 5, actors: { aria: { reaction: "surprise" } } },
      { at: 6, extras: [mason(), { ...keeper(), pose: "explain", speaking: true }] },
      { at: 10, actors: { aria: { pose: "think" } } },
      { at: 13, actors: { finn: { inspect: true, pose: "think" } } },
      { at: 17, actors: { finn: { inspect: false } } },
    ],
    { exit: ["aria", "leon", "mira", "finn"] },
  ),
  "matching-lantern-stone-departure": scene("stone-yard", crew(), [
    {
      at: 0,
      items: [ground("replacement", 48, 15, 13), ground("keystone", 30, 12, 12)],
      extras: [mason()],
    },
    { at: 1, extras: [{ ...mason(), pose: "explain", speaking: true }] },
    { at: 4, actors: { finn: { pose: "think" } } },
    { at: 8, extras: [{ ...mason(), pose: "point", speaking: true }] },
    {
      at: 9,
      actors: { aria: { inspect: true } },
      items: [ground("replacement", 29, 17, 13), held("cloth", "leon")],
    },
    { at: 11, actors: { aria: { inspect: false, pose: "think" } } },
    { at: 13, actors: { mira: { x: 61, inspect: true } } },
    { at: 15, actors: { mira: { inspect: false, pose: "think" }, finn: { pose: "offer" } } },
    { at: 17, actors: { mira: { x: 72 } } },
  ]),
  "matching-lantern-stone-return": stoneRest,
  "berne-restoration-departure": scene("tower-foot", crew(), [
    {
      at: 0,
      items: [ground("keystone", 53, 22, 13), ground("tools", 29)],
      extras: [keeper(), mason()],
    },
    { at: 1, extras: [{ ...keeper(), pose: "point", speaking: true }, mason()] },
    { at: 3, actors: { aria: { pose: "think" } } },
    { at: 7, items: [ground("keystone", 53, 22, 13), held("ledger", "leon"), ground("tools", 29)] },
    {
      at: 8,
      items: [ground("keystone", 53, 22, 13), ground("ledger", 73, 41, 8), ground("tools", 29)],
    },
    { at: 10, items: [ground("keystone", 53, 22, 13), held("map", "leon"), ground("tools", 29)] },
    { at: 11, actors: { aria: { inspect: true, x: 28 } } },
    { at: 15, actors: { finn: { x: 85, pose: "greet" } } },
  ]),
  "berne-restoration-return": scene("tower-foot", crew(), [
    { at: 0, night: true, items: [ground("keystone", 53, 22, 13)], extras: [keeper()] },
    { at: 1, actors: { aria: { pose: "greet", reaction: "nod" } } },
    { at: 2, extras: [{ ...keeper(), pose: "explain", speaking: true }] },
    {
      at: 4,
      background: "dining-room",
      night: false,
      cast: diningCast().map((a) =>
        a.id === "finn" ? { ...a, x: 77, bottom: 33, seated: false } : a,
      ),
      furniture: diningCast().map((a) => chair(a)),
      items: diningItems([table(50), onTable("tea", 50)]),
      extras: [npc("merchant", "控えの持ち主", 90, "explain", true)],
    },
  ]),
};
