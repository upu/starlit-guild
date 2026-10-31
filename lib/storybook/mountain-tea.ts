import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";

function teaActor(actor: StageActor, line: number): StageActor {
  if (actor.id === "aria")
    return {
      ...actor,
      pose: actor.seated && line >= 4 && line < 10 ? "offer" : actor.pose,
      wristPoints: { ...actor.wristPoints, 4: [80, 80], 37: [79, 78], 41: [79, 78] },
    };
  if (actor.id === "leon") return { ...actor, wristPoints: { ...actor.wristPoints, 4: [94, 72] } };
  return {
    ...actor,
    nameAbove: line === 4 || actor.nameAbove,
    left: actor.seated || actor.inspect ? actor.left : false,
    wristPoints: { ...actor.wristPoints, 4: [47, 80], 37: [85, 87], 41: [85, 87] },
  };
}

function teaItem(item: StageItem): StageItem {
  // Keep the pot beside the seated palm, with the handle facing Aria.
  if (item.id === "tea-stone") return { ...item, x: 45.5, bottom: 18 };
  if (item.id === "teapot" && item.support === "tea-stone")
    return { ...item, x: 45.5, bottom: 23, left: false };
  if (!item.actor) return item;
  if (item.art === "empty-cup")
    return { ...item, x: 0, bottom: 0, wrist: true, wristAnchor: "bottom" };
  if (item.art === "kettle")
    return {
      ...item,
      x: 0,
      bottom: 0,
      left: false,
      wrist: true,
      wristAnchor: "top",
      wristOffset: { x: 0.5, bottom: 3 },
    };
  return item;
}

export function mountainTeaCue(cue: StoryStageCue, line: number): StoryStageCue {
  return {
    ...cue,
    finishBeforeAdvance: line === 4 || cue.finishBeforeAdvance,
    actors: cue.actors.map((actor) => teaActor(actor, line)),
    items: cue.items?.map(teaItem),
    sequence: cue.sequence?.map((step) => ({
      ...step,
      actors: step.actors.map((actor) => teaActor(actor, line)),
      items: step.items.map(teaItem),
    })),
  };
}
