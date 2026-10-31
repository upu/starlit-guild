import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { nightStudyCue } from "./night-cue.ts";

const widths: Partial<Record<StageItem["art"], number>> = {
  basket: 5.5,
  "medicine-closed": 5.2,
  "delivery-bag": 7,
  map: 5,
};
function luggage(item: StageItem): StageItem {
  const width = widths[item.art];
  if (!item.actor || width === undefined) return item;
  return {
    ...item,
    width,
    x: 0,
    bottom: 0,
    wrist: true,
    wristAnchor: item.art === "delivery-bag" ? "top" : item.art === "map" ? "bottom" : undefined,
    ...(item.art === "delivery-bag" ? { wristOffset: { x: 0, bottom: 3.4 } } : {}),
  };
}

export function berneStreetCue(cue: StoryStageCue): StoryStageCue {
  const moment = (actors: StoryStageCue["actors"], items: StageItem[]) => ({
    actors: nightStudyCue({ ...cue, actors }).actors.map((actor): StageActor => ({
      ...actor,
      carry: !actor.writing && items.some((item) => item.actor === actor.id),
      ...(actor.id === "mira"
        ? {
            carryWalkFrames: [8, 9, 22, 23],
            wristPoints: {
              ...actor.wristPoints,
              14: [80, 80] as [number, number],
              15: [80, 80] as [number, number],
              8: [84, 77] as [number, number],
              9: [84, 77] as [number, number],
              22: [84, 77] as [number, number],
              23: [84, 77] as [number, number],
            },
          }
        : {}),
      ...(actor.id === "leon"
        ? {
            wristPoints: {
              ...actor.wristPoints,
              17: [83, 73] as [number, number],
              18: [83, 73] as [number, number],
            },
          }
        : {}),
    })),
    items: items.map(luggage),
  });
  return {
    ...cue,
    ...moment(cue.actors, cue.items ?? []),
    finishBeforeAdvance: cue.finishBeforeAdvance || !!cue.sequence?.length,
    sequence: cue.sequence?.map((step) => ({ ...step, ...moment(step.actors, step.items) })),
  };
}
