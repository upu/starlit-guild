import type { StageActor, StoryStageCue } from "../story-stage-cues.ts";

/** The remaining moss belongs to the masonry in the painted view, never to a loose prop. */
export function waterwayBankInspection(cue: StoryStageCue, line: number): StoryStageCue {
  const clearLooseMoss = (items: StoryStageCue["items"]) =>
    items?.filter((item) => item.id !== "remaining");
  const clearSightline = (extras: StoryStageCue["extras"]) =>
    extras?.map((extra) => (extra.id === "keeper" ? { ...extra, x: 89, bottom: 23 } : extra));
  const grounded = {
    ...cue,
    items: clearLooseMoss(cue.items),
    extras: clearSightline(cue.extras),
    sequence: cue.sequence?.map((beat) => ({
      ...beat,
      items: clearLooseMoss(beat.items) ?? [],
      extras: clearSightline(beat.extras),
    })),
  };
  if (line >= 7 && line <= 9) return inspectStone(grounded, line);
  return line === 10 ? returnToPath(grounded) : grounded;
}

function inspectStone(cue: StoryStageCue, line: number): StoryStageCue {
  const atStone = (kneel: boolean) =>
    cue.actors.map((actor): StageActor =>
      actor.id === "aria"
        ? {
            ...actor,
            x: 67,
            bottom: 40,
            left: false,
            inspect: kneel,
            via:
              line === 7
                ? [
                    { x: 32, bottom: 36 },
                    { x: 67, bottom: 36 },
                  ]
                : undefined,
          }
        : actor,
    );
  if (line !== 7) return { ...cue, actors: atStone(true) };
  return {
    ...cue,
    actors: atStone(false),
    finishBeforeAdvance: true,
    sequence: [
      { after: 2100, actors: atStone(true), items: cue.items ?? [], extras: cue.extras },
      { after: 2600, actors: atStone(true), items: cue.items ?? [], extras: cue.extras },
    ],
  };
}

function returnToPath(cue: StoryStageCue): StoryStageCue {
  const waiting = cue.actors.map((actor): StageActor =>
    actor.id === "aria"
      ? {
          ...actor,
          x: 67,
          bottom: 40,
          inspect: false,
          left: false,
        }
      : actor,
  );
  const returned = cue.actors.map((actor): StageActor =>
    actor.id === "aria"
      ? {
          ...actor,
          x: 42,
          bottom: 14,
          inspect: false,
          left: false,
          via: [
            { x: 67, bottom: 36 },
            { x: 32, bottom: 36 },
            { x: 32, bottom: 14 },
          ],
        }
      : actor,
  );
  return {
    ...cue,
    actors: waiting,
    finishBeforeAdvance: true,
    sequence: [
      { after: 350, actors: returned, items: cue.items ?? [], extras: cue.extras },
      { after: 2600, actors: returned, items: cue.items ?? [], extras: cue.extras },
    ],
  };
}
