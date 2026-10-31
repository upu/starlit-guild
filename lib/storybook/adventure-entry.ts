import type { StageExtra, StoryStageCue } from "../story-stage-cues.ts";
import { studyCue } from "./carry-cue.ts";

/** A watched ending continues after the work; standalone replays still show the work itself. */
export function afterAdventureCue(
  id: string,
  completedQuest: string | undefined,
  cue: StoryStageCue | false | null,
): StoryStageCue | false | null {
  if (!cue || id !== "tower-moss-removal-return" || completedQuest !== "tower-moss-removal")
    return cue;
  const front = studyCue(id, 1, true);
  if (!front) return cue;
  const keeper: StageExtra = { id: "keeper", x: -15, bottom: 6, left: false };
  const actors = front.actors.map((actor) => ({
    ...actor,
    paceMsPerUnit: 34 / 0.6,
    via: [{ x: actor.x, bottom: 6 }],
  }));
  return {
    ...front,
    description: cue.description,
    background: "tower-foot",
    cut: true,
    finishBeforeAdvance: true,
    initial: { aria: -55, leon: -35 },
    initialBottom: { aria: 6, leon: 6 },
    actors,
    extras: [keeper],
    sequence: [
      {
        after: 350,
        actors,
        items: front.items ?? [],
        extras: [{ ...keeper, x: 77, bottom: 30, via: [{ x: 77, bottom: 6 }] }],
      },
    ],
  };
}
