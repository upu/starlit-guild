import type { StageMoment, StoryStageCue } from "../story-stage-cues.ts";
import { circuitActor, circuitItem } from "./founding-paper-contacts.ts";

/** Receive at one edge, turn with the sheet, then offer its other edge. */
export function foundingPaperCircuit(cue: StoryStageCue): StoryStageCue {
  const steps = [...(cue.sequence ?? [])];
  for (const after of [4200, 6900, 8500, 14900]) {
    const previous = steps.filter((s) => s.after < after).at(-1);
    if (previous) steps.push({ ...previous, after });
    steps.sort((a, b) => a.after - b.after);
  }
  const adjust = (s: StageMoment) => ({
    ...s,
    actors: s.actors.map((a) => circuitActor(a, s.after)),
    items: s.items.map((i) => circuitItem(i, s.after)),
    after:
      s.after +
      (s.after >= 4500 ? 700 : 0) +
      (s.after >= 7200 ? 400 : 0) +
      (s.after >= 14400 ? 1700 : 0),
  });
  return { ...cue, finishBeforeAdvance: true, sequence: steps.map(adjust) };
}
