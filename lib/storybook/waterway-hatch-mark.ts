import type { StageExtra, StageItem, StoryStageCue } from "../story-stage-cues.ts";

// The chalk tip is registered at [23, 94] / [24, 102] in the two low poses.
const atHatch = { x: 72.6875, bottom: 57.71875 };
const atPath = { x: 89, bottom: 23 };
const marks: StageItem[] = [-48, 48].map((tilt, index) => ({
  id: `hatch-chalk-${String(index)}`,
  art: "chalk-mark",
  x: 65.1,
  bottom: 64.28125,
  width: 2.5,
  tilt,
}));

/** Mark the same closed stone lid that is opened on the following workday. */
export function waterwayHatchMark(cue: StoryStageCue, line: number): StoryStageCue {
  if (line < 10) return cue;
  const withMarks = (items: StoryStageCue["items"], count = 2) => [
    ...(items ?? []),
    ...marks.slice(0, count),
  ];
  if (line > 10)
    return {
      ...cue,
      items: withMarks(cue.items),
      sequence: cue.sequence?.map((beat) => ({ ...beat, items: withMarks(beat.items) })),
    };
  const keeper = (
    hatchMark: StageExtra["hatchMark"],
    position: typeof atHatch,
    via?: StageExtra["via"],
  ) =>
    cue.extras?.map((extra) =>
      extra.id === "keeper" ? { ...extra, ...position, hatchMark, left: false, via } : extra,
    );
  const approaching = keeper("idle", atHatch, [
    { x: 75, bottom: 23 },
    { x: 75, bottom: atHatch.bottom },
  ]);
  const returning = keeper("rest", atPath, [
    { x: 75, bottom: atHatch.bottom },
    { x: 75, bottom: 23 },
  ]);
  const actors = cue.sequence?.at(-1)?.actors ?? cue.actors;
  const beat = (after: number, extras: StoryStageCue["extras"], count: number) => ({
    after,
    actors,
    extras,
    items: withMarks(cue.items, count),
  });
  return {
    ...cue,
    extras: approaching,
    finishBeforeAdvance: true,
    sequence: [
      beat(350, approaching, 0),
      beat(2600, keeper("touch", atHatch), 0),
      beat(3050, keeper("stroke", atHatch), 1),
      beat(3450, keeper("touch", atHatch), 1),
      beat(3850, keeper("stroke", atHatch), 2),
      beat(4300, keeper("rest", atHatch), 2),
      beat(4550, returning, 2),
      beat(7150, keeper("idle", atPath), 2),
    ],
  };
}
