import { transplantStudyCue } from "./transplant-loading-cue.ts";
import { householdStories, householdStudyCue } from "./households-cue.ts";
import { overlookStudyCue } from "./overlook-cue.ts";
import { walnutStudyCue } from "./walnut-cue.ts";
import { lunchStudyCue } from "./lunch-cue.ts";
import { foundingDepartureStudyCue } from "./founding-departure-cue.ts";
import type { StoryStageCue } from "../story-stage.ts";
import { storyStageCue } from "../story-stage.ts";
import { foundingReturnStudyCue } from "./founding-return-cue.ts";
import { merchantPlacement } from "./merchant-placement.ts";
import { townReturnStudyCue } from "./town-return-cue.ts";
import { sharedPickupCue } from "./shared-pickup.ts";
import { towerSampleCue } from "./tower-sample.ts";
import { storybookTravelStories, travelPackingCue } from "./travel-packing.ts";
import { nightDialogueCue } from "./night-dialogue.ts";
import { forestStudyCue, forestDepartureCue } from "./forest-cue.ts";
import { waterwayStudyCue, clearedWaterwayCue } from "./waterway-cue.ts";
import { waterwayRepairDepartureCue } from "./waterway-repair-cue.ts";
import { waterwayReturnCue } from "./waterway-return-cue.ts";
import { basketStudyCue, basketStories } from "./basket-cue.ts";
import { mossCollectionCue } from "./moss-collection.ts";
import { waterwayCompletionCue } from "./waterway-completion.ts";
import { medicineRoomCue } from "./medicine-cue.ts";
import { homewardTeaCue } from "./homeward-office-cue.ts";
import { homewardStudyCue } from "./homeward-cue.ts";
import { herbHandoverCue } from "./herb-handover.ts";
import { mountainStudyCue } from "./mountain-cue.ts";
import { workshopCarrierCue, workshopStudyCue } from "./workshop-cue.ts";
import { roadsideDiningCue } from "./dining-cue.ts";
import { berneStreetCue } from "./berne-street-cue.ts";
import { porchStudyCue } from "./porch-cue.ts";
import { foundationStudyCue } from "./foundation-cue.ts";
import { manorDoorStudyCue } from "./manor-door-cue.ts";
import { manorDisplayStudyCue } from "./manor-display-cue.ts";
import { stoneYardStudyCue } from "./stone-yard-cue.ts";
import { stoneRestStudyCue } from "./stone-rest-cue.ts";
import { surveyDoorStudyCue } from "./survey-door-cue.ts";
import { surveyGardenStudyCue } from "./survey-garden-cue.ts";
import { receptionWellStudyCue } from "./reception-well-cue.ts";
import { receptionDisplayStudyCue } from "./reception-display-cue.ts";
import { nightHandStudyCue } from "./night-hand-cue.ts";
import { restorationStudyCue } from "./restoration-cue.ts";
import { lindeStudyCue } from "./linde-cue.ts";
import { lanternStudyCue } from "./lantern-cue.ts";
import { brekkaDiningStudyCue } from "./brekka-dining-cue.ts";
import { brekkaVisitStudyCue } from "./brekka-visit-cue.ts";
import { mossTrailStudyCue } from "./moss-trail-cue.ts";
import { mossSecondDayStudyCue } from "./moss-second-day-cue.ts";
import { mossBedsStudyCue } from "./moss-beds-cue.ts";
import { registryStudyCue } from "./registry-cue.ts";
import { recordsFieldStudyCue } from "./records-field-cue.ts";
import { seedlingsStudyCue } from "./seedlings-cue.ts";
import { sharedPoseContacts } from "./shared-pose-contacts.ts";
import { picnicDepartureCue, picnicReturnCue } from "./picnic-cue.ts";
import { waterwayDepartureCue } from "./waterway-opening-cue.ts";

// The near-left corner remains on the tabletop and inside Aria's forward reach.
const tableBoxOffset = { x: -5.5, bottom: 0 };

export function studyCue(id: string, line: number, painted: boolean) {
  const cue = authoredStudyCue(id, line, painted);
  return cue && painted ? sharedPoseContacts(cue, id) : cue;
}

function authoredStudyCue(id: string, line: number, painted: boolean) {
  const cue = storyStageCue(id, line);
  if (!cue || !painted) return cue;
  if (id === "interlude-promised-walnuts") return walnutStudyCue(cue, line);
  if (id === "interlude-walnut-lunch") return lunchStudyCue(cue, line);
  const chapterFour = chapterFourCue(cue, id, line);
  if (chapterFour) return chapterFour;
  const chapterThree = chapterThreeCue(cue, id);
  if (chapterThree) return chapterThree;
  const chapterTwo = chapterTwoCue(cue, id, line);
  if (chapterTwo) return chapterTwo;
  return paintedCue(basketStories.includes(id) ? basketStudyCue(cue, id, line) : cue, id, line);
}
function chapterTwoCue(cue: StoryStageCue, id: string, line: number) {
  if (id === "hilltop-picnic-departure") return picnicDepartureCue(cue, line);
  if (id === "hilltop-picnic-return") return picnicReturnCue(cue, line);
  if (householdStories.includes(id)) return householdStudyCue(cue, id, line);
  if (cue.background === "workshop-yard")
    return id === "sweet-blockade-return" ? workshopCarrierCue(cue, line) : workshopStudyCue(cue);
  if (id === "medicine-road-home-return" && cue.background === "mountain-road")
    return homewardStudyCue(workshopStudyCue(cue), line);
  if (["mountain-road", "mountain-fork-empty"].includes(cue.background ?? ""))
    return mountainStudyCue(cue, id, line);
  if (cue.background === "medicine-room") return chapterTwoMedicineCue(cue, id, line);
  return undefined;
}
function chapterTwoMedicineCue(cue: StoryStageCue, id: string, line: number) {
  const adjusted = medicineRoomCue(
    id === "moonlit-herbs-departure" ? herbHandoverCue(cue, line) : cue,
    id,
    line,
  );
  return id === "medicine-road-home-return" ? homewardTeaCue(adjusted, line) : adjusted;
}
const fieldStudies = [
  { prefix: "merrill-seedlings-", adapt: seedlingsStudyCue },
  { prefix: "brekka-moss-beds-", adapt: mossBedsStudyCue },
  { prefix: "glowing-moss-trail-next-day-", adapt: mossSecondDayStudyCue },
];
function chapterFourCue(cue: StoryStageCue, id: string, line: number) {
  if (id === "starlit-guild-founding-departure") return foundingDepartureStudyCue(cue, line);
  const field = fieldStudies.find(({ prefix }) => id.startsWith(prefix));
  if (field) return field.adapt(cue);
  if (id.startsWith("moss-transplant-")) return transplantStudyCue(cue, id, line);
  if (id.startsWith("lico-records-")) return recordsCue(cue, id, line);
  if (id === "glowing-moss-trail-departure" || id === "glowing-moss-trail-return")
    return mossTrailStudyCue(cue);
  if (id === "brekka-arrival-return") return brekkaVisitStudyCue(cue);
  if (id === "brekka-arrival-departure") return brekkaDiningStudyCue(cue, line === 24);
  if (id.startsWith("lantern-detour-")) return lanternStudyCue(cue);
  if (id.startsWith("linde-requests-"))
    return lindeStudyCue(cue, id.endsWith("departure") && line === 26);
  return undefined;
}
function recordsCue(cue: StoryStageCue, id: string, line: number) {
  if (cue.background === "registry") return registryStudyCue(cue);
  if (cue.background === "moss-beds") return recordsFieldStudyCue(cue, id, line);
  return undefined;
}

const chapterThreeStudies: Partial<Record<string, (cue: StoryStageCue) => StoryStageCue>> = {
  "berne-road-return": overlookStudyCue,
  "berne-restoration-departure": restorationStudyCue,
  "berne-restoration-return": restorationStudyCue,
  "keystone-night-road-departure": nightHandStudyCue,
  "keystone-night-road-return": nightHandStudyCue,
  "garden-reception-return": receptionDisplayStudyCue,
  "garden-reception-departure": receptionWellStudyCue,
  "manor-survey-return": surveyGardenStudyCue,
  "manor-survey-departure": surveyDoorStudyCue,
  "matching-lantern-stone-return": stoneRestStudyCue,
  "matching-lantern-stone-departure": stoneYardStudyCue,
  "riverside-manor-return": manorDisplayStudyCue,
  "riverside-manor-departure": manorDoorStudyCue,
};

function chapterThreeCue(cue: StoryStageCue, id: string) {
  const apply = chapterThreeStudies[id];
  if (apply) return apply(cue);
  if (id.startsWith("missing-keystone-")) return foundationStudyCue(cue, id.endsWith("departure"));
  if (id === "berne-road-departure") return roadsideDiningCue(cue);
  if (id === "berne-house-calls-departure") return berneStreetCue(cue);
  if (cue.background === "berne-porch") return porchStudyCue(cue);
  return undefined;
}

function paintedCue(cue: StoryStageCue, id: string, line: number): StoryStageCue {
  if (id.startsWith("tower-restoration-")) return repairCue(cue, id, line);
  if (id === "tower-moss-removal-departure")
    return clearedWaterwayCue(mossCollectionCue(cue, line));
  if (id === "old-waterway-return") return waterwayStudyCue(cue, line);
  if (cue.background === "drain-cleared") return clearedWaterwayCue(cue);
  if (id === "forest-wetland-return") return forestStudyCue(cue, line);
  if (id === "forest-wetland-departure") return forestDepartureCue(cue, line);
  if (id.startsWith("moss-night-road-")) return nightDialogueCue(cue, id, line);
  if (storybookTravelStories.includes(id)) return travelPackingCue(cue, id, line);
  if (id === "tower-road-return") return towerSampleCue(cue, line);
  if (id === "starlit-guild-founding-return") return foundingReturnStudyCue(cue, line);
  return sceneStudies[id]?.(cue, line) ?? cue;
}

function repairCue(cue: StoryStageCue, id: string, line: number) {
  return id.endsWith("departure")
    ? waterwayRepairDepartureCue(cue, line)
    : clearedWaterwayCue(waterwayReturnCue(cue, line));
}

const sceneStudies: Partial<Record<string, (cue: StoryStageCue, line: number) => StoryStageCue>> = {
  "old-waterway-departure": waterwayDepartureCue,
  "tower-moss-removal-return": waterwayCompletionCue,
  "town-deliveries-departure": merchantCue,
  "town-deliveries-return": townReturnStudyCue,
};

function merchantCue(cue: StoryStageCue, line: number): StoryStageCue {
  cue = merchantPlacement(cue, line);
  if (line === 0) return cue;
  if (line === 7) return loweringCue(cue);
  if (line >= 13) return sharedPickupCue(cue, line);
  if (line >= 3 && line <= 6) return carryStudyCue(cue, line);
  return cue.box === "table" ? { ...cue, boxOffset: tableBoxOffset } : cue;
}

/** Waist-height hands registered against the 192px prototype cells. */
export function carryStudyCue(cue: StoryStageCue, line: number): StoryStageCue {
  return {
    ...cue,
    boxOffset: line >= 5 ? { x: -4, bottom: 2.5 } : { x: -3, bottom: 5 },
    actors: cue.actors.map((actor) =>
      actor.id === "aria" ? { ...actor, pose: line === 4 || line === 6 ? "think" : "idle" } : actor,
    ),
  };
}

function loweringCue(cue: StoryStageCue): StoryStageCue {
  const holding = cue.actors.map((actor) =>
    actor.id === "aria" ? { ...actor, place: false, carry: true, pose: "think" as const } : actor,
  );
  return {
    ...cue,
    finishBeforeAdvance: true,
    box: "high",
    boxOffset: { x: -4, bottom: 2.5 },
    actors: holding,
    sequence: [
      {
        after: 350,
        actors: cue.actors.map((actor) =>
          actor.id === "aria" ? { ...actor, placeHoldMs: 200 } : actor,
        ),
        items: [],
        extras: cue.extras,
        box: "table",
        boxOffset: tableBoxOffset,
      },
    ],
  };
}
