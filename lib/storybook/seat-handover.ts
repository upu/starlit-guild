import type { StageActor, StoryStageCue } from "@/lib/story-stage-cues";

function approachChair(actors: StageActor[]): StageActor[] {
  return actors.map((actor) =>
    actor.id === "leon"
      ? {
          ...actor,
          seated: false,
          // Pass in front of the desk, clear of Mira's waiting position.
          via: [
            { x: 35, bottom: -14 },
            { x: 67, bottom: -14 },
          ],
        }
      : actor.id === "mira"
        ? { ...actor, nameOffset: 0 }
        : actor,
  );
}

function turnChairPose(actors: StageActor[]): StageActor[] {
  return actors.map((actor) =>
    actor.id === "mira"
      ? {
          ...actor,
          x: 63.5,
          bottom: 13,
          via: undefined,
          seated: false,
          left: false,
          visit: "slide",
          reachOver: "representative-chair",
        }
      : actor,
  );
}

function sitLeon(actors: StageActor[], seatTransition?: "lower" | "settle"): StageActor[] {
  return actors.map((actor) =>
    actor.id === "leon"
      ? { ...actor, via: undefined, seated: !seatTransition, seatTransition }
      : actor,
  );
}

function turnedChair(items: NonNullable<StoryStageCue["items"]>) {
  return items.map((item) => (item.id === "representative-chair" ? { ...item, turn: 180 } : item));
}

function seatedMira(actors: StageActor[]): StageActor[] {
  return actors.map((actor) =>
    actor.id === "mira" ? { ...actor, x: 67, bottom: 14, via: undefined, seated: true } : actor,
  );
}

/** Rise in place before walking; the next occupant approaches around the front. */
export function miraLeavesChair(cue: StoryStageCue): StoryStageCue {
  const handover = cue.sequence?.[0];
  if (!handover || handover.after !== 650) return cue;
  const rise = (seatTransition?: "lower" | "settle"): StageActor[] =>
    cue.actors.map((actor) =>
      actor.id === "mira"
        ? {
            ...actor,
            x: 67,
            bottom: 14,
            via: undefined,
            seated: false,
            seatTransition,
          }
        : actor,
    );
  const seated = seatedMira(cue.actors);
  const leaving = cue.actors.map((actor) =>
    actor.id === "mira" ? { ...actor, nameOffset: 0 } : actor,
  );
  const turning = turnChairPose(cue.actors);
  const approach = approachChair(handover.actors);
  const state = { items: cue.items ?? [], extras: cue.extras };
  return {
    ...cue,
    actors: seated,
    finishBeforeAdvance: true,
    sequence: [
      { ...state, after: 150, actors: rise("settle") },
      { ...state, after: 350, actors: rise("lower") },
      { ...state, after: 550, actors: rise() },
      { ...state, after: 750, actors: turning },
      { ...state, items: turnedChair(state.items), after: 1300, actors: turning },
      { ...state, items: turnedChair(state.items), after: 2100, actors: leaving },
      { ...handover, items: turnedChair(handover.items), after: 2950, actors: approach },
      {
        ...handover,
        items: turnedChair(handover.items),
        after: 5450,
        actors: sitLeon(approach, "lower"),
      },
      {
        ...handover,
        items: turnedChair(handover.items),
        after: 5650,
        actors: sitLeon(approach, "settle"),
      },
      { ...handover, items: turnedChair(handover.items), after: 5850, actors: sitLeon(approach) },
    ],
  };
}
