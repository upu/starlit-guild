import type { RoadLook } from "./road-look.ts";
import { MANOR_GARDEN_FIGURE_SCALE } from "./road-manor-garden.ts";
import { STONE_RETURN_FIGURE_SCALE } from "./road-stone-selection-return.ts";
import { SURVEY_RETURN_FIGURE_SCALE } from "./road-manor-survey-return.ts";
import { fieldCastScale, seedlingCastScale } from "./road-moss-beds-layout.ts";
import { FOUNDATION_RETURN_SCALE } from "./road-foundation-return.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { FOREST_RETURN_SCALE } from "./road-forest-return.ts";
import { WATERWAY_SEARCH_RETURN_SCALE } from "./road-waterway-search-return.ts";

export function fixedFigureScale(look?: RoadLook, view?: RoadViewport) {
  const field = fieldFigureScale(look, view);
  if (field !== undefined) return field;
  if (look?.foundation?.exposed) return FOUNDATION_RETURN_SCALE;
  if (look?.manorDelivery?.garden) return MANOR_GARDEN_FIGURE_SCALE;
  if (look?.stoneSelection?.sorted) return STONE_RETURN_FIGURE_SCALE;
  if (look?.manorSurvey?.gathering) return SURVEY_RETURN_FIGURE_SCALE;
  if (isArrival(look)) return 1.33;
  return 1;
}

function isArrival(look?: RoadLook) {
  return !!look?.gardenReception?.arrived || look?.nightBridge?.section === 2;
}

function fieldFigureScale(look?: RoadLook, view?: RoadViewport) {
  if (look?.waterwaySearchReturn?.scene) return WATERWAY_SEARCH_RETURN_SCALE;
  if (look?.forestReturn?.scene) return FOREST_RETURN_SCALE;
  if ((!look?.mossBeds?.records && !look?.mossBeds?.seedlings) || !view) return undefined;
  const portrait = view.height > view.width;
  return look.mossBeds.seedlings ? seedlingCastScale(portrait) : fieldCastScale(portrait);
}
