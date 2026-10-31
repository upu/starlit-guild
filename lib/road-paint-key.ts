import type { RoadLook } from "./chapter-road-presentation.ts";
import { journeyCartQuest } from "./road-journey-cart.ts";
import { picnicHandheld } from "./road-picnic.ts";
import { berneHandheld } from "./road-berne-journey.ts";
type Identity = { key: string; quest: string };
const fixedSite = (look: RoadLook) =>
  !!(
    look.housecalls ||
    look.lindeDelivery ||
    look.lanternRoad ||
    look.mossBeds ||
    look.berneCalls ||
    look.foundation ||
    look.stoneSelection ||
    look.manorSurvey ||
    look.gardenReception ||
    look.nightBridge ||
    look.restoration
  );
const fixedRoad = (look: RoadLook) =>
  !!(
    look.waterway ||
    look.packing ||
    look.signpost ||
    look.blockade ||
    fixedSite(look) ||
    look.brekkaJourney
  );
/** Keep the completed cart run alive for its final visual retrieval and approach. */
export function roadPaintKey(
  id: string,
  run: { quest: string; started: number } | null,
  look: RoadLook,
  previous?: Identity,
): Identity {
  const quest = look.quest ?? "";
  if (
    !run &&
    (journeyCartQuest(look) || fixedRoad(look) || picnicHandheld(look) || berneHandheld(look)) &&
    previous?.quest === quest
  )
    return previous;
  return { quest, key: `${id}:${run?.quest ?? "idle"}:${String(run?.started)}` };
}
