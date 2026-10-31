import { storyStageCue, storyStageExitCue } from "../story-stage.ts";
import type { StoryStageCue } from "../story-stage-cues.ts";
import { transplantNightStudyCue } from "./transplant-night-cue.ts";

/** Aria joins the rear of the cart before the party leaves the frame. */
export function transplantDepartureExitCue(): StoryStageCue | null {
  const last = storyStageCue("moss-transplant-departure", 37);
  const exit = storyStageExitCue("moss-transplant-departure");
  if (!last || !exit) return null;
  const painted = transplantNightStudyCue(last);
  const settled = painted.sequence?.at(-1);
  if (!settled) return null;
  const departing = transplantNightStudyCue(exit);
  const regroup = settled.actors.map((actor) =>
    actor.id === "aria"
      ? { ...actor, x: 49.5, bottom: 44.4, via: undefined, lane: undefined, left: false }
      : { ...actor, via: undefined, lane: undefined },
  );
  const onward = departing.actors.map((actor) =>
    actor.id === "aria"
      ? {
          ...actor,
          x: 103.5,
          bottom: 44.4,
          left: false,
          push: "extend" as const,
          reachOver: "transplant-cart",
          paceMsPerUnit: 80,
          via: undefined,
          lane: undefined,
        }
      : actor.id === "finn"
        ? { ...actor, paceMsPerUnit: 80, via: undefined, lane: undefined }
        : { ...actor, via: undefined, lane: undefined },
  );
  return {
    ...painted,
    actors: regroup,
    items: settled.items,
    sequence: [{ after: 1600, actors: onward, items: settled.items, extras: settled.extras }],
    description: "夜の運搬路。アリアが荷車の後ろへ回り、皆で出発する。",
  };
}
