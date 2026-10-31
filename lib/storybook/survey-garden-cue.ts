import type { StoryStageCue } from "../story-stage-cues.ts";
import { surveyGardenActor, surveyGardenExtra } from "./survey-garden-actors.ts";
import { surveyGardenItem } from "./survey-garden-items.ts";

export function surveyGardenStudyCue(cue: StoryStageCue): StoryStageCue {
  const adjust = (moment: Pick<StoryStageCue, "actors" | "items" | "extras">) => {
    const items = moment.items ?? [];
    return {
      actors: moment.actors.map((actor) => surveyGardenActor(actor, items)),
      extras: moment.extras?.map((extra) => surveyGardenExtra(extra, items)),
      items: items.map(surveyGardenItem),
    };
  };
  return {
    ...cue,
    ...adjust(cue),
    finishBeforeAdvance: cue.finishBeforeAdvance || !!cue.sequence?.length,
    sequence: cue.sequence?.map((step) => ({ ...step, ...adjust(step) })),
  };
}
