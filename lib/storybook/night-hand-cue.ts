import type { StoryStageCue } from "../story-stage-cues.ts";
import { nightHandActor } from "./night-hand-actors.ts";
import { nightHandItems } from "./night-hand-items.ts";
import { receptionDisplayExtra } from "./reception-display-actors.ts";

export function nightHandStudyCue(cue: StoryStageCue): StoryStageCue {
  const bridge = cue.background === "bridge-night";
  const adjust = (moment: Pick<StoryStageCue, "actors" | "items" | "extras">) => ({
    actors: moment.actors.map((actor) =>
      nightHandActor(
        actor,
        moment.items ?? [],
        bridge,
        moment.actors.some(
          (a) => a.id === "finn" && (a.handAction === "pat-ready" || a.handAction === "pat-touch"),
        ),
      ),
    ),
    items: nightHandItems(moment.items ?? [], bridge),
    extras: moment.extras?.map(receptionDisplayExtra),
  });
  return {
    ...cue,
    ...adjust(cue),
    initialBottom: bridge ? { ...cue.initialBottom, finn: 38.8 } : cue.initialBottom,
    finishBeforeAdvance:
      cue.finishBeforeAdvance ||
      !!cue.sequence?.length ||
      cue.actors.some((actor) => !!actor.via?.length),
    sequence: cue.sequence?.map((step) => ({ ...step, ...adjust(step) })),
  };
}
