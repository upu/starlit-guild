import { receptionWell } from "./story-stage-reception-well.ts";
import { nightHand } from "./story-stage-night-hand.ts";
import { receptionDisplay } from "./story-stage-reception-display.ts";
import { manorDoor } from "./story-stage-manor-door.ts";
import { manorDisplay } from "./story-stage-manor-display.ts";
import { surveyDoor } from "./story-stage-survey-door.ts";
import { surveyGarden } from "./story-stage-survey-garden.ts";
import { scene, quartet, held, ground, type LaterStage } from "./story-stage-later-shared.ts";
export const manorStages: Record<string, LaterStage> = {
  "riverside-manor-departure": manorDoor,
  "riverside-manor-return": manorDisplay,
  "manor-survey-departure": surveyDoor,
  "manor-survey-return": surveyGarden,
  "garden-reception-departure": receptionWell,
  "garden-reception-return": receptionDisplay,
  "keystone-night-road-departure": nightHand,
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
