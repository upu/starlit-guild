import type { StageActor, StageExtra, StoryStageCue } from "../story-stage-cues.ts";

const ariaAtDrain = (actor: StageActor): StageActor =>
  actor.id === "aria" ? { ...actor, x: 26, bottom: 67, inspect: false, left: true } : actor;
const licoAtDrain = (actor: StageActor): StageActor =>
  actor.id === "lico"
    ? {
        ...actor,
        x: 40,
        bottom: 57,
        left: true,
        via: [
          { x: 60, bottom: 14 },
          { x: 60, bottom: 57 },
        ],
      }
    : actor;
const keeperAtDrain = (extra: StageExtra): StageExtra =>
  extra.id === "keeper" ? { ...extra, x: 12, bottom: 67, left: true } : extra;
const groupAtDrain = (actors: StageActor[]) =>
  actors.map((actor) => licoAtDrain(ariaAtDrain(actor)));

/** After the basket handoff, inspect the existing drainage before the next reply. */
export function transplantDrainFlow(cue: StoryStageCue, line: number): StoryStageCue {
  if (line === 9 && cue.sequence?.length) {
    const last = cue.sequence.at(-1);
    if (!last) return cue;
    return {
      ...cue,
      sequence: [
        ...cue.sequence,
        {
          ...last,
          after: 8800,
          actors: groupAtDrain(last.actors),
          extras: last.extras?.map(keeperAtDrain),
        },
      ],
    };
  }
  if (line < 10 || line > 14) return cue;
  const actors = groupAtDrain(cue.actors).map((actor) =>
    actor.id === "lico" ? { ...actor, via: undefined } : actor,
  );
  return {
    ...cue,
    actors,
    extras: cue.extras?.map(keeperAtDrain),
    initial: { ...cue.initial, aria: 26, lico: 40 },
    initialBottom: { ...cue.initialBottom, aria: 67, lico: 57 },
  };
}
