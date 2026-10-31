import type { StoryStageCue } from "../story-stage-cues.ts";
import { receptionWellActor, receptionWellExtra } from "./reception-well-actors.ts";
import { receptionWellItem } from "./reception-well-items.ts";

export function receptionWellStudyCue(cue: StoryStageCue): StoryStageCue {
  const adjust = (moment: Pick<StoryStageCue, "actors" | "items" | "extras">) => {
    const items = moment.items ?? [];
    return {
      actors: moment.actors.map((actor) => receptionWellActor(actor, items)),
      items: items.map(receptionWellItem),
      extras: moment.extras?.map(receptionWellExtra),
    };
  };
  return {
    ...cue,
    initial:
      cue.initial?.finn === undefined
        ? cue.initial
        : { ...cue.initial, finn: cue.initial.finn - 1.8 },
    initialBottom:
      cue.initialBottom?.finn === undefined
        ? cue.initialBottom
        : { ...cue.initialBottom, finn: cue.initialBottom.finn - 7.5 },
    ...adjust(cue),
    finishBeforeAdvance:
      cue.finishBeforeAdvance ||
      !!cue.sequence?.length ||
      cue.actors.some((actor) => !!actor.via?.length),
    sequence: cue.sequence?.map((step) => ({ ...step, ...adjust(step) })),
  };
}
