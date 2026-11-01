import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";

const diningActor = (actor: StageActor): StageActor =>
  actor.id === "mira" ? { ...actor, x: 42, bottom: 28 } : actor;

function diningItem(item: StageItem): StageItem {
  if (item.art !== "chair") return item;
  const mira = item.id === "chair-mira";
  return {
    ...item,
    seatFor: undefined,
    width: 8.5,
    x: (mira ? 42 : item.x) + (item.left ? 1.5 : -1.5),
    bottom: mira ? 30 : item.bottom,
  };
}

export function roadsideDiningCue(cue: StoryStageCue): StoryStageCue {
  return {
    ...cue,
    actors: cue.actors.map(diningActor),
    items: cue.items?.map(diningItem),
    sequence: cue.sequence?.map((step) => ({
      ...step,
      actors: step.actors.map(diningActor),
      items: step.items.map(diningItem),
    })),
  };
}
