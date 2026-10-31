import type { StoryStageCue } from "@/lib/story-stage-cues";

/** Both grips settle on the supported parcel before either person lifts. */
export function sharedPickupCue(cue: StoryStageCue, line: number): StoryStageCue {
  const approaching = line === 13;
  const actors = cue.actors.map((actor) => ({
    ...actor,
    x: actor.id === "leon" ? 43 : 30,
    bottom: 14,
    lane: actor.id === "leon" && approaching ? 0 : undefined,
    carry: false,
    place: !approaching,
    placeHoldMs: 750,
    pose: "offer" as const,
  }));
  return {
    ...cue,
    finishBeforeAdvance: true,
    box: "table",
    boxOffset: { x: -5.5, bottom: 0 },
    actors,
    sequence: approaching
      ? undefined
      : [
          {
            after: 700,
            actors: actors.map((actor) => ({ ...actor, place: false, carry: true })),
            items: cue.items ?? [],
            extras: cue.extras,
            box: "shared",
            boxOffset: { x: 0, bottom: 5 },
          },
        ],
  };
}
