import type { StoryStageCue, StageActor } from "../story-stage-cues.ts";

export function herbHandoverCue(cue: StoryStageCue, line: number): StoryStageCue {
  const items = (received: boolean) =>
    (cue.items ?? []).map((item) => {
      if (item.art === "herbs")
        return { ...item, actor: received ? ("aria" as const) : ("mira" as const) };
      if (item.art === "cloth")
        return received
          ? {
              ...item,
              actor: "leon" as const,
              x: 0,
              bottom: 0,
              width: 5,
              wrist: true,
              wristAnchor: "bottom" as const,
            }
          : { ...item, actor: undefined, x: 61, bottom: 29, width: 5, support: "table" };
      return item;
    });
  if (line < 13) return line >= 10 ? { ...cue, items: items(false) } : cue;
  const actors = (received: boolean): StageActor[] =>
    cue.actors.map((actor) => {
      if (actor.id === "aria")
        return {
          ...actor,
          x: 64,
          bottom: 3,
          left: false,
          via: received
            ? undefined
            : [
                { x: 43, bottom: 0 },
                { x: 64, bottom: 0 },
              ],
          carry: received,
        };
      if (actor.id === "mira") return { ...actor, x: 73, bottom: 3, left: false, pose: "offer" };
      return { ...actor, x: 52, bottom: 10, carry: received };
    });
  return {
    ...cue,
    finishBeforeAdvance: true,
    actors: actors(false),
    items: items(false),
    sequence: [
      { after: 2500, actors: actors(true), items: items(true), extras: cue.extras },
      {
        after: 3300,
        actors: actors(true).map((actor) =>
          actor.id === "mira" ? { ...actor, bottom: 14, left: true, pose: "think" } : actor,
        ),
        items: items(true),
        extras: cue.extras,
      },
    ],
  };
}
