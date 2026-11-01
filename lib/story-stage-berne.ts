import { restorationDeparture } from "./story-stage-restoration.ts";
import { restorationDining } from "./story-stage-restoration-dining.ts";
import { keystoneInspection, keystoneFoundation } from "./story-stage-keystone.ts";
import { bernePaving } from "./story-stage-berne-paving.ts";
import { berneVisit } from "./story-stage-berne-visit.ts";
import { stoneRest } from "./story-stage-stone-rest.ts";
import { stoneYard } from "./story-stage-stone-yard.ts";
import { overlookRest } from "./story-stage-low-seats.ts";
import {
  scene,
  actor,
  ground,
  table,
  onTable,
  npc,
  type LaterStage,
} from "./story-stage-later-shared.ts";
import { diningScene } from "./story-stage-furniture.ts";
const keeper = () => ({ ...npc("keeper", undefined, 57), bottom: 30 });
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
  "berne-restoration-departure": restorationDeparture,
  "berne-restoration-return": scene(
    "berne-foundation-restored",
    [
      actor("aria", 22, { bottom: 7, left: false }),
      actor("leon", 37, { bottom: 0, left: false }),
      actor("mira", 75, { bottom: 5, left: true }),
      actor("finn", 90, { bottom: 14, left: true, dressed: true, handAction: "guard" }),
    ],
    [
      { at: 0, items: [], extras: [keeper()] },
      { at: 1, actors: { aria: { pose: "greet", reaction: "nod" } } },
      { at: 2, extras: [{ ...keeper(), pose: "explain", speaking: true }] },
      restorationDining(),
    ],
  ),
};
