import type { StageActor, StoryStageCue } from "@/lib/story-stage-cues";

/** Keep existing prop/NPC actions ordered after the occupant has stood up. */
export function riseBeforeWalking(cue: StoryStageCue, id: "finn" | "leon"): StoryStageCue {
  const phase = (seatTransition?: "lower" | "settle", seated = false): StageActor[] =>
    cue.actors.map((actor) =>
      actor.id === id
        ? {
            ...actor,
            x: 67,
            bottom: 14,
            via: undefined,
            writing: false,
            seated,
            seatTransition,
          }
        : actor,
    );
  const state = { items: cue.items ?? [], extras: cue.extras };
  return {
    ...cue,
    actors: phase(undefined, true),
    finishBeforeAdvance: true,
    sequence: [
      { ...state, after: 150, actors: phase("settle") },
      { ...state, after: 350, actors: phase("lower") },
      { ...state, after: 550, actors: phase() },
      { ...state, after: 750, actors: cue.actors },
      ...(cue.sequence ?? []).map((step) => ({ ...step, after: step.after + 750 })),
    ],
  };
}

export function finnSitsDown(cue: StoryStageCue): StoryStageCue {
  const phase = (seatTransition?: "lower" | "settle", seated = false): StageActor[] =>
    cue.actors.map((actor) =>
      actor.id === "finn"
        ? {
            ...actor,
            seated,
            seatTransition,
            ...(seatTransition || seated ? { via: undefined } : {}),
          }
        : actor,
    );
  const state = { items: cue.items ?? [], extras: cue.extras };
  return {
    ...cue,
    actors: phase(),
    finishBeforeAdvance: true,
    sequence: [
      { ...state, after: 2300, actors: phase("lower") },
      { ...state, after: 2500, actors: phase("settle") },
      { ...state, after: 2700, actors: phase(undefined, true) },
      ...(cue.sequence ?? []),
    ],
  };
}
