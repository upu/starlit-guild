import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";

const reach: Partial<StageActor> = { left: true, inspect: true, mossStudy: "reach" };
const holding: Partial<StageActor> = {
  left: true,
  inspect: false,
  carry: true,
  mossStudy: "brace",
  carryWalkFrames: [8, 9, 22, 23],
};
const arrival: Partial<StageActor> = {
  x: 43,
  bottom: 50,
  left: true,
  inspect: true,
  carry: false,
  mossStudy: "spread",
  via: undefined,
};
const aside: Partial<StageActor> = {
  x: 55,
  bottom: 50,
  left: true,
  inspect: false,
  nameAbove: true,
};

/** Gather a little moss, carry it around the other specimens, and place it in Leon's bowl. */
export function forestCollectionCue(cue: StoryStageCue): StoryStageCue {
  const actors = (aria: Partial<StageActor>, leon: Partial<StageActor> = {}) =>
    cue.actors.map((actor) => ({ ...actor, ...(actor.id === "aria" ? aria : leon) }));
  const items = (filled: boolean) =>
    (cue.items ?? []).map((item): StageItem =>
      item.id === "forest" ? { ...item, art: filled ? "moss" : "dish" } : item,
    );
  return {
    ...cue,
    actors: actors(reach),
    items: items(false),
    finishBeforeAdvance: true,
    sequence: [
      {
        after: 850,
        actors: actors({ ...reach, mossStudy: "show" }, aside),
        items: items(false),
        extras: cue.extras,
      },
      { after: 1700, actors: actors(holding, aside), items: items(false), extras: cue.extras },
      {
        after: 2300,
        actors: actors(
          {
            ...holding,
            x: 43,
            bottom: 50,
            via: [
              { x: 18, bottom: 59 },
              { x: 43, bottom: 59 },
            ],
            paceMsPerUnit: 90,
          },
          aside,
        ),
        items: items(false),
        extras: cue.extras,
      },
      { after: 5900, actors: actors(arrival, aside), items: items(false), extras: cue.extras },
      { after: 6600, actors: actors(arrival, aside), items: items(true), extras: cue.extras },
      {
        after: 7300,
        actors: actors({ ...arrival, mossStudy: undefined }, aside),
        items: items(true),
        extras: cue.extras,
      },
    ],
  };
}
