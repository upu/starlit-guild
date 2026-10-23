import { receptionWell } from "./story-stage-reception-well.ts";
import { nightHand } from "./story-stage-night-hand.ts";
import { bridgeReturn } from "./story-stage-bridge.ts";
import { receptionDisplay } from "./story-stage-reception-display.ts";
import { manorDoor } from "./story-stage-manor-door.ts";
import { manorDisplay } from "./story-stage-manor-display.ts";
import { surveyDoor } from "./story-stage-survey-door.ts";
import { surveyGarden } from "./story-stage-survey-garden.ts";
import type { LaterStage } from "./story-stage-later-shared.ts";
export const manorStages: Record<string, LaterStage> = {
  "riverside-manor-departure": manorDoor,
  "riverside-manor-return": manorDisplay,
  "manor-survey-departure": surveyDoor,
  "manor-survey-return": surveyGarden,
  "garden-reception-departure": receptionWell,
  "garden-reception-return": receptionDisplay,
  "keystone-night-road-departure": nightHand,
  "keystone-night-road-return": bridgeReturn,
};
