import type { StageExtra, StoryStageCue } from "@/lib/story-stage-cues";

export function merchantPlacement(cue: StoryStageCue, line: number): StoryStageCue {
  const merchant: StageExtra = {
    id: "merchant",
    name: "取引先の人",
    x: 41,
    bottom: 21,
    pose: cue.merchant?.pose ?? "idle",
    speaking: cue.merchant?.speaking,
  };
  const extras = [{ ...merchant, x: 52, bottom: 27 }];
  if (line !== 0)
    return { ...cue, extras, sequence: cue.sequence?.map((step) => ({ ...step, extras })) };
  const state = { actors: cue.actors, items: cue.items ?? [], box: "table" as const };
  const reach = {
    ...merchant,
    handOver: {
      item: "delivery-table",
      rect: [20, 81, 47, 27] as [number, number, number, number],
    },
  };
  return {
    ...cue,
    finishBeforeAdvance: true,
    box: "table",
    boxOffset: { x: -5.5, bottom: 9 },
    extras: [{ ...merchant, service: "carry" }],
    sequence: [
      {
        ...state,
        after: 900,
        extras: [{ ...reach, service: "place" }],
        boxOffset: { x: -5.5, bottom: 0 },
      },
      {
        ...state,
        after: 1650,
        extras: [{ ...reach, service: "raise" }],
        boxOffset: { x: -5.5, bottom: 0 },
      },
      { ...state, after: 2100, extras, boxOffset: { x: -5.5, bottom: 0 } },
    ],
  };
}
