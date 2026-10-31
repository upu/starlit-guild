import type { StageExtra, StoryStageCue } from "../story-stage-cues.ts";
import { nightStudyCue } from "./night-cue.ts";
import { stoneRestActor } from "./stone-rest-actors.ts";
import { stoneRestItem } from "./stone-rest-items.ts";
import { restTeaTransitions } from "./stone-rest-transitions.ts";

export function stoneRestStudyCue(cue: StoryStageCue): StoryStageCue {
  cue = restTeaTransitions(cue);
  const adjust = (moment: Pick<StoryStageCue, "actors" | "items" | "extras">) => {
    const items = moment.items ?? [];
    return {
      actors: nightStudyCue({ ...cue, actors: moment.actors }).actors.map((actor) =>
        stoneRestActor(actor, items),
      ),
      items: items.map(stoneRestItem),
      extras: moment.extras?.map((extra): StageExtra =>
        extra.id === "worker"
          ? { ...extra, wristPoints: { ...extra.wristPoints, 8: [48, 75], 9: [48, 75] } }
          : extra,
      ),
    };
  };
  return {
    ...cue,
    ...adjust(cue),
    finishBeforeAdvance: cue.finishBeforeAdvance || !!cue.sequence?.length,
    sequence: cue.sequence?.map((step) => ({ ...step, ...adjust(step) })),
  };
}
