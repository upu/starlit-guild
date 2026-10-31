import type { StageMoment, StoryStageCue } from "../story-stage-cues.ts";
import { receptionDisplayActor, receptionDisplayExtra } from "./reception-display-actors.ts";
import { receptionDisplayItem, potsOverDrape } from "./reception-display-items.ts";

function openingClothSteps(sequence: StageMoment[] = []) {
  return sequence.flatMap((step, index) => {
    if (
      step.after !== 1200 ||
      !step.items.some((item) => item.id === "spare-cloth" && item.actor === "finn")
    )
      return [{ ...step, after: step.after >= 2200 ? step.after + 900 : step.after }];
    const spread = {
      ...step,
      after: 1600,
      items: step.items.map((item) =>
        item.id === "spare-cloth" ? { ...item, art: "light-cloth" as const } : item,
      ),
    };
    const lower = {
      ...step,
      after: 2400,
      items: step.items.map((item) =>
        item.id === "spare-cloth" ? { ...item, art: "cart-drape" as const } : item,
      ),
    };
    return sequence[index + 1]?.after === 2200 ? [step, spread, lower] : [step];
  });
}

export function receptionDisplayStudyCue(cue: StoryStageCue): StoryStageCue {
  const adjust = (moment: Pick<StoryStageCue, "actors" | "items" | "extras">) => {
    const raw = moment.items ?? [];
    return {
      actors: moment.actors.map((actor) => receptionDisplayActor(actor, raw)),
      items: potsOverDrape(raw.map(receptionDisplayItem)),
      extras: moment.extras?.map(receptionDisplayExtra),
    };
  };
  return {
    ...cue,
    ...adjust(cue),
    initial:
      cue.initial?.finn === undefined
        ? cue.initial
        : { ...cue.initial, finn: cue.initial.finn - 1.8 },
    initialBottom:
      cue.initialBottom?.finn === undefined
        ? cue.initialBottom
        : { ...cue.initialBottom, finn: cue.initialBottom.finn - 7.5 },
    finishBeforeAdvance:
      cue.finishBeforeAdvance ||
      !!cue.sequence?.length ||
      cue.actors.some((actor) => !!actor.via?.length),
    sequence: openingClothSteps(cue.sequence).map((step) => ({ ...step, ...adjust(step) })),
  };
}
