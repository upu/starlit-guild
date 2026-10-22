import { keystoneInspection, keystoneFoundation } from "./story-stage-keystone.ts";
import { bernePaving } from "./story-stage-berne-paving.ts";
import { berneVisit } from "./story-stage-berne-visit.ts";
import { stoneRest } from "./story-stage-stone-rest.ts";
import { stoneYard } from "./story-stage-stone-yard.ts";
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
        items: [
          table(50),
          onTable("teapot", 52, 4.5),
          { ...onTable("teacup", 40, 2.8), id: "aria-cup" },
          { ...onTable("teacup", 58, 2.8), id: "leon-cup" },
          { ...onTable("teacup", 44, 2.8), id: "mira-cup" },
          ground("medicine-closed", 29, 25, 8),
          ground("delivery-bag", 76, 14, 8),
          ground("basket", 25, 12, 7),
        ],
        extras: [npc("merchant", "店主", 25)],
      },
      { at: 1, extras: [npc("merchant", "店主", 25, "explain", true)] },
    ],
    {},
    false,
  ),
  "berne-road-return": overlookRest,
  "berne-house-calls-departure": bernePaving,
  "berne-house-calls-return": berneVisit,
  "missing-keystone-departure": keystoneInspection,
  "missing-keystone-return": keystoneFoundation,
  "matching-lantern-stone-departure": stoneYard,
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
