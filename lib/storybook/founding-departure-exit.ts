import { storyStageCue } from "../story-stage.ts";
import type { StageActor, StoryStageCue } from "../story-stage-cues.ts";
import { foundingDepartureStudyCue } from "./founding-departure-cue.ts";

/** After the final line, the two return from the stone before the group moves on. */
export function foundingDepartureExitCue(): StoryStageCue | null {
  const last = storyStageCue("starlit-guild-founding-departure", 41);
  if (!last) return null;
  const cue = foundingDepartureStudyCue(last, 41);
  const regroup = cue.actors.map((actor): StageActor => {
    if (actor.id === "aria")
      return {
        ...actor,
        x: actor.x - 10.15625,
        inspect: false,
        via: undefined,
        left: true,
        paceMsPerUnit: 110,
      };
    if (actor.id === "lico")
      return { ...actor, x: actor.x - 7, inspect: false, left: true, paceMsPerUnit: 110 };
    return actor;
  });
  const onward = regroup.map((actor) => ({
    ...actor,
    x: actor.x + 3.5,
    left: false,
    paceMsPerUnit: 140,
    via: undefined,
  }));
  return {
    ...cue,
    actors: regroup,
    sequence: [{ after: 1600, actors: onward, items: cue.items ?? [], extras: cue.extras }],
    description: "帰りの街道。石を見た二人が戻り、五人で出発する。",
  };
}
