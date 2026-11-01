import type { StoryStageCue, StageActor, StageMoment } from "../story-stage-cues.ts";
export function lindeRise(cue: StoryStageCue): StoryStageCue {
  const actors = (phase?: "lower" | "settle", seated = false): StageActor[] =>
    cue.actors.map((a) =>
      a.id === "mira"
        ? {
            ...a,
            x: 40,
            bottom: 25,
            left: false,
            seated,
            seatTransition: phase,
            pose: "idle",
            via: undefined,
          }
        : a,
    );
  const target = cue.actors.map((a) =>
    a.id === "mira" ? { ...a, healing: "treat" as const, bottom: 22.5 } : a,
  );
  const state = { items: cue.items ?? [], extras: cue.extras };
  const phases: StageMoment[] = [
    { ...state, after: 150, actors: actors("settle") },
    { ...state, after: 350, actors: actors("lower") },
    { ...state, after: 550, actors: actors() },
    { ...state, after: 750, actors: target },
    {
      ...state,
      after: 2000,
      actors: target.map((a) => (a.id === "mira" ? { ...a, healing: "rise" } : a)),
    },
  ];
  return {
    ...cue,
    actors: actors(undefined, true),
    finishBeforeAdvance: true,
    sequence: [...phases, ...(cue.sequence ?? []).map((s) => ({ ...s, after: s.after + 1500 }))],
  };
}
