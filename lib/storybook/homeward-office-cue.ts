import type { StageActor, StoryStageCue } from "../story-stage-cues.ts";
import { homewardStudyCue } from "./homeward-cue.ts";

/** Open the office cut with separate silhouettes and put the case beside Mira. */
function homewardArrivalCue(cue: StoryStageCue): StoryStageCue {
  const adjusted = homewardStudyCue(cue, 1);
  const actors = (cast: StageActor[]) =>
    cast.map((actor) => {
      if (actor.id === "leon" && actor.x === 69) return { ...actor, x: 78 };
      if (actor.id === "mira" && actor.x === 22) return { ...actor, left: true };
      return actor;
    });
  return {
    ...adjusted,
    actors: actors(adjusted.actors),
    initial: { ...adjusted.initial, leon: 78 },
    sequence: adjusted.sequence?.map((step) => ({
      ...step,
      actors: actors(step.actors),
    })),
  };
}

function keepOfficeClear(cue: StoryStageCue, line: number): StoryStageCue {
  const items = (props: NonNullable<StoryStageCue["items"]>) =>
    props.map((item) => (item.id === "medicine" && !item.actor ? { ...item, x: 16 } : item));
  const actors = (cast: StageActor[]) =>
    cast.map((actor) => {
      if (line <= 9 && actor.id === "mira" && actor.x === 32 && actor.bottom === 30)
        return { ...actor, x: 25, bottom: 42 };
      if (actor.id === "leon" && actor.x === 62 && actor.bottom === 48)
        return { ...actor, nameAbove: true };
      return actor;
    });
  return {
    ...cue,
    actors: actors(cue.actors),
    items: cue.items && items(cue.items),
    sequence: cue.sequence?.map((step) => ({
      ...step,
      actors: actors(step.actors),
      items: items(step.items),
    })),
  };
}

/** Keep the teapot's right-facing spout over each successive cup. */
export function homewardTeaCue(cue: StoryStageCue, line: number): StoryStageCue {
  cue = keepOfficeClear(cue, line);
  if (line === 1) return homewardArrivalCue(cue);
  if (line === 10) {
    const stopApproach = (actors: StageActor[]) =>
      actors.map((actor) => (actor.id === "aria" ? { ...actor, via: undefined } : actor));
    return {
      ...cue,
      finishBeforeAdvance: true,
      actors: stopApproach(cue.actors),
      sequence: cue.sequence?.map((step) => ({ ...step, actors: stopApproach(step.actors) })),
    };
  }
  if (line !== 9) return cue;
  const move = (actors: StageActor[], clearRoute = false) =>
    actors.map((actor) => {
      if (actor.id !== "aria") return actor;
      const x = actor.x === 43 ? 37 : actor.x === 48 ? 42 : actor.x === 53 ? 47 : actor.x;
      return {
        ...actor,
        x,
        via: clearRoute
          ? undefined
          : actor.via?.map((point) => (point.x === 43 ? { ...point, x: 37 } : point)),
      };
    });
  return {
    ...cue,
    finishBeforeAdvance: true,
    actors: move(cue.actors),
    sequence: cue.sequence?.map((step) => ({ ...step, actors: move(step.actors, true) })),
  };
}
