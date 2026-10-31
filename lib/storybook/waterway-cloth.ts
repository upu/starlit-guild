import type { StoryStageCue, StageActor } from "../story-stage-cues.ts";

/** Keep the two palms adjacent until the clean half has been returned. */
export function waterwayClothCue(cue: StoryStageCue): StoryStageCue {
  const ariaX = cue.actors.find((actor) => actor.id === "aria")?.x ?? 44;
  const actors = (owner: StageActor["id"]) =>
    cue.actors.map((actor) => ({
      ...actor,
      x: actor.id === "leon" ? ariaX + 9.5 : actor.x,
      left: actor.id === "leon",
      carry: actor.id === owner,
    }));
  const items = (owner: StageActor["id"]) =>
    (cue.items ?? []).map((item) => (item.art === "cloth" ? { ...item, actor: owner } : item));
  return {
    ...cue,
    actors: actors("aria"),
    items: items("aria"),
    finishBeforeAdvance: true,
    sequence: [
      { after: 900, actors: actors("leon"), items: items("leon"), extras: cue.extras },
      { after: 2300, actors: actors("aria"), items: items("aria"), extras: cue.extras },
      { after: 3100, actors: cue.actors, items: items("aria"), extras: cue.extras },
    ],
  };
}
