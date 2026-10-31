import type { StageMoment, StoryStageCue } from "@/lib/story-stage-cues";

function packInFront(step: StageMoment): StageMoment {
  return {
    ...step,
    items: step.items.map((item) =>
      item.id === "lico-sample-bag"
        ? { ...item, x: 2.5, behindOwner: false, support: "table" }
        : item,
    ),
  };
}

/** Let the specimen reach the pack before hiding it and starting the return walk. */
export function storeResearchSample(cue: StoryStageCue): StoryStageCue {
  const steps = cue.sequence;
  const storing = steps?.find((step) => step.after === 3200);
  if (!steps || !storing) return cue;
  const approaching = {
    ...storing,
    items: storing.items.map((item) =>
      item.carrier === "lico-sample-bag"
        ? { ...item, stored: false, bottom: 3, travelMs: 700 }
        : item,
    ),
  };
  return {
    ...cue,
    finishBeforeAdvance: true,
    sequence: [
      ...steps
        .filter((step) => step.after < 3200)
        .map((step) => (step.after === 2400 ? packInFront(step) : step)),
      packInFront(approaching),
      packInFront({ ...storing, after: 4000 }),
      { ...storing, after: 4200 },
      ...steps
        .filter((step) => step.after > 3200)
        .map((step) => ({
          ...step,
          after: step.after + 1400,
        })),
    ],
  };
}
