import type { StageExtra, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { nightStudyCue } from "./night-cue.ts";
import { berneStreetCue } from "./berne-street-cue.ts";

function foundationExtra(extra: StageExtra, plans: boolean): StageExtra {
  if (plans && extra.id === "keeper")
    return { ...extra, wristPoints: { ...extra.wristPoints, 1: [92, 68] } };
  if (!plans && extra.id === "worker" && extra.x === 40 && extra.bottom === 18)
    return { ...extra, x: 43, bottom: 26 };
  return extra;
}

function planItem(item: StageItem): StageItem {
  if (item.support === "inspection-table") item = { ...item, pitch: 55 };
  if (item.id === "district-plan")
    return { ...item, width: 4.5, ...(item.extra ? { x: 0, bottom: 0, wrist: true } : {}) };
  if (item.id === "shipping-copy" && item.actor === "finn")
    return { ...item, x: 0, bottom: 0, wrist: true };
  return item;
}

const luggageWidths: Partial<Record<StageItem["art"], number>> = {
  "medicine-closed": 5.2,
  basket: 5.5,
  "delivery-bag": 7,
};

export function foundationStudyCue(cue: StoryStageCue, plans: boolean): StoryStageCue {
  const prepared = plans ? nightStudyCue(cue) : berneStreetCue(cue);
  const adjust = (actors: StoryStageCue["actors"], items: StageItem[], extras?: StageExtra[]) => ({
    actors: actors.map((actor) => ({
      ...actor,
      ...(actor.id === "mira" && actor.inspect ? { packing: false } : {}),
      ...(plans && actor.id === "finn"
        ? { wristPoints: { ...actor.wristPoints, 4: [38, 65] as [number, number] } }
        : {}),
      ...(!plans && actor.id === "finn" && actor.x === 52 ? { bottom: 28 } : {}),
    })),
    items: items.map((item): StageItem => {
      const width = luggageWidths[item.art];
      if (width !== undefined) item = { ...item, width };
      if (plans) return planItem(item);
      return item.id === "shipping-copy" && item.actor === "leon"
        ? {
            ...item,
            width: 3.5,
            x: 0,
            bottom: 0,
            wrist: true,
            wristAnchor: "bottom",
            wristOffset: { x: 3.5, bottom: 0 },
          }
        : item;
    }),
    extras: extras?.map((extra) => foundationExtra(extra, plans)),
  });
  return {
    ...prepared,
    ...adjust(prepared.actors, prepared.items ?? [], prepared.extras),
    finishBeforeAdvance: prepared.finishBeforeAdvance || !!prepared.sequence?.length,
    sequence: prepared.sequence?.map((step) => ({
      ...step,
      ...adjust(step.actors, step.items, step.extras),
    })),
  };
}
