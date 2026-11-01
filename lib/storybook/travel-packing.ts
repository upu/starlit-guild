import { transplantReturnStudyCue } from "./transplant-return-cue.ts";
import { picnicDepartureCue } from "./picnic-cue.ts";
import { waterwayDepartureExitCue } from "./waterway-opening-cue.ts";
import { sharedPoseContacts } from "./shared-pose-contacts.ts";
import { walnutExitCue } from "./walnut-cue.ts";
import { storyStageExitCue, type StoryStageCue } from "../story-stage.ts";
import { lanternStudyCue } from "./lantern-cue.ts";
import { brekkaDiningStudyCue } from "./brekka-dining-cue.ts";
import { mossSecondDayStudyCue } from "./moss-second-day-cue.ts";
import { mossBedsStudyCue } from "./moss-beds-cue.ts";
import { seedlingsStudyCue } from "./seedlings-cue.ts";
import { nightStudyCue } from "./night-cue.ts";
import { forestDepartureCue } from "./forest-cue.ts";
import { basketStudyCue, basketStories } from "./basket-cue.ts";
import { clearedWaterwayCue } from "./waterway-cue.ts";
import { waterwayRepairExitCue } from "./waterway-repair-cue.ts";
import { waterwayReturnExitCue } from "./waterway-return-cue.ts";
import { mossCollectionCue } from "./moss-collection.ts";
import { medicineRoomCue } from "./medicine-cue.ts";
import { mountainStudyCue } from "./mountain-cue.ts";
import { berneStreetCue } from "./berne-street-cue.ts";
import { foundationStudyCue } from "./foundation-cue.ts";
import { receptionWellStudyCue } from "./reception-well-cue.ts";
import { townReturnStudyCue } from "./town-return-cue.ts";
import { foundingDepartureExitCue } from "./founding-departure-exit.ts";
import { transplantDepartureExitCue } from "./transplant-departure-exit.ts";

export const storybookTravelStories = [
  "village-trade-departure",
  "evening-trade-road-departure",
  "evening-trade-road-return",
];

export function travelPackingCue(cue: StoryStageCue, id: string, line: number): StoryStageCue {
  const startingPack = id === "evening-trade-road-departure" && line === 0;
  const packing = startingPack || (id === "evening-trade-road-return" && line === 8);
  const result = {
    ...cue,
    initial: startingPack ? { ...cue.initial, aria: 25 } : cue.initial,
    actors: cue.actors.map((actor) => {
      if (packing && actor.id === "aria") return { ...actor, x: 25, left: true };
      // The painted pull pose reaches behind the body; stand beyond the shaft tip first.
      return actor.id === "leon" && actor.x === 81 ? { ...actor, x: 89, bottom: 11 } : actor;
    }),
  };
  return id === "evening-trade-road-return" && line === 8 ? finishPacking(result) : result;
}

function finishPacking(cue: StoryStageCue): StoryStageCue {
  const rested = (id: string) =>
    cue.actors.map((actor) =>
      actor.id === id ? { ...actor, inspect: false, packing: false, left: false } : actor,
    );
  const waiting = rested("aria");
  return {
    ...cue,
    finishBeforeAdvance: true,
    sequence: [
      { after: 1700, actors: waiting, items: [] },
      {
        after: 2700,
        actors: waiting.map((actor) => ({ ...actor, inspect: false, packing: false })),
        items: [],
      },
    ],
  };
}

export function storybookExitCue(id: string) {
  if (id === "moss-transplant-departure") return transplantDepartureExitCue();
  return id === "starlit-guild-founding-departure"
    ? foundingDepartureExitCue()
    : otherStorybookExitCue(id);
}

function otherStorybookExitCue(id: string) {
  const cue = storyStageExitCue(id);
  if (!cue) return cue;
  const special: Partial<Record<string, (c: StoryStageCue) => StoryStageCue>> = {
    "old-waterway-departure": waterwayDepartureExitCue,
    "hilltop-picnic-departure": (c) => sharedPoseContacts(picnicDepartureCue(c, Infinity), id),
    ...Object.fromEntries(
      householdStories.map((id) => [id, (c: StoryStageCue) => householdStudyCue(c, id, Infinity)]),
    ),
    "town-deliveries-return": townReturnStudyCue,
    "interlude-promised-walnuts": walnutExitCue,
    "merrill-seedlings-return": seedlingsStudyCue,
    "moss-transplant-return": transplantReturnStudyCue,
    "brekka-moss-beds-return": mossBedsStudyCue,
    "glowing-moss-trail-next-day-departure": mossSecondDayStudyCue,
    "brekka-arrival-departure": brekkaDiningStudyCue,
    "lantern-detour-departure": lanternStudyCue,
    "garden-reception-departure": receptionWellStudyCue,
  };
  const apply = special[id];
  if (apply) return apply(cue);
  if (id === "missing-keystone-return") return foundationStudyCue(cue, false);
  if (["mountain-road", "mountain-fork-empty"].includes(cue.background ?? ""))
    return mountainStudyCue(cue, id, Infinity);
  if (id === "berne-house-calls-departure") return berneStreetCue(cue);
  if (id === "moonlit-herbs-departure") return herbExit(cue);
  if (basketStories.includes(id)) return basketExit(cue, id);
  if (id === "forest-wetland-departure") return forestDepartureCue(cue);
  if (id.startsWith("moss-night-road-")) return nightExit(cue, id);
  if (!storybookTravelStories.includes(id)) return cue;
  return {
    ...cue,
    actors: cue.actors.map((actor) =>
      actor.id === "leon" ? { ...actor, x: actor.x + 8, bottom: 11 } : actor,
    ),
  };
}

function herbExit(cue: StoryStageCue): StoryStageCue {
  return medicineRoomCue({
    ...cue,
    actors: cue.actors.map((actor) =>
      actor.id === "mira"
        ? { ...actor, pose: "think", carry: false, left: true }
        : {
            ...actor,
            carry: true,
            bottom: actor.id === "leon" ? -6 : 3,
            via:
              actor.id === "leon"
                ? [
                    { x: 52, bottom: -6 },
                    { x: 84, bottom: -6 },
                  ]
                : undefined,
          },
    ),
    items: cue.items?.map((item) =>
      item.art === "cloth"
        ? { ...item, x: 0, bottom: 0, width: 5, wrist: true, wristAnchor: "bottom" }
        : item,
    ),
  });
}

function basketExit(cue: StoryStageCue, id: string): StoryStageCue {
  const basket = basketStudyCue(cue, id);
  if (id === "tower-restoration-departure") return waterwayRepairExitCue(basket);
  if (id === "tower-restoration-return") return clearedWaterwayCue(waterwayReturnExitCue(basket));
  const held = id === "tower-moss-removal-departure" ? mossCollectionCue(basket, 17, true) : basket;
  return held.background === "drain-cleared" ? clearedWaterwayCue(held) : held;
}

function nightExit(cue: StoryStageCue, id: string): StoryStageCue {
  const painted = nightStudyCue(cue);
  if (id !== "moss-night-road-return") return painted;
  return {
    ...painted,
    actors: painted.actors.map((actor, index) => ({
      ...actor,
      via:
        index === 0
          ? [
              { x: 42, bottom: 42 },
              { x: 23, bottom: 63 },
              { x: -3, bottom: 78 },
            ]
          : [
              { x: 58, bottom: 42 },
              { x: 77, bottom: 63 },
              { x: 103, bottom: 78 },
            ],
    })),
  };
}
import { householdStories, householdStudyCue } from "./households-cue.ts";
