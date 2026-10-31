import type { StageActor, StageExtra, StageItem, StoryStageCue } from "../story-stage-cues.ts";

function surveyActor(actor: StageActor, items: StageItem[]): StageActor {
  if (actor.id !== "finn") return actor;
  const holding = items.some((item) => item.actor === "finn");
  const point: [number, number] = [79, 75];
  const received = items.some((item) => item.art === "survey-pot" && item.extra === "cook");
  const cloth = items.some((item) => item.art === "scrubbing-rag");
  return {
    ...actor,
    ...(actor.x === 67.5 && received && !cloth ? { x: 61 } : {}),
    carry: holding,
    carryWalkFrames: [8, 9, 22, 23],
    wristPoints: {
      ...actor.wristPoints,
      14: point,
      15: point,
      16: point,
      8: point,
      9: point,
      22: point,
      23: point,
    },
  };
}

function surveyCook(extra: StageExtra): StageExtra {
  if (extra.id !== "cook") return extra;
  const point: [number, number] = [71, 82];
  return {
    ...extra,
    ...(extra.x === 76.3 ? { x: 74, left: true } : {}),
    ...(extra.x === 81 && extra.bottom === 60 ? { x: 76, bottom: 70 } : {}),
    via: extra.via?.map((point) => (point.x === 84 ? { ...point, x: 79 } : point)),
    wristPoints: {
      4: point,
      5: point,
      6: point,
      7: point,
      11: point,
      12: point,
      13: point,
      14: point,
      15: point,
    },
  };
}

function surveyItem(item: StageItem): StageItem {
  if (item.art === "tool-rucksack") return { ...item, x: -2.2, width: 6.5 };
  if (item.art === "survey-pot")
    return {
      ...item,
      width: 6.5,
      x: 0,
      bottom: 0,
      wrist: true,
      wristAnchor: "top",
      wristOffset: { x: 0, bottom: 2 },
    };
  if (item.art === "pot-lid")
    return item.extra
      ? {
          ...item,
          x: 0,
          bottom: 0,
          width: 5.8,
          wrist: true,
          wristAnchor: "bottom",
          wristOffset: { x: 4.1, bottom: 5.7 },
        }
      : { ...item, width: 5.8, bottom: 2.5 };
  if (item.art === "scrubbing-rag")
    return {
      ...item,
      x: 0,
      bottom: 0,
      width: 3,
      wrist: true,
      wristAnchor: "top",
      wristOffset: item.extra ? { x: 3.3, bottom: 4.2 } : { x: 0, bottom: 1 },
    };
  return item;
}

/** Keep the borrowed pot, lid and cleaning rag attached through each handover. */
export function surveyDoorStudyCue(cue: StoryStageCue): StoryStageCue {
  const adjust = (moment: Pick<StoryStageCue, "actors" | "items" | "extras">) => {
    const items = moment.items ?? [];
    return {
      actors: moment.actors.map((actor) => surveyActor(actor, items)),
      extras: moment.extras?.map(surveyCook),
      items: items.map(surveyItem),
    };
  };
  return {
    ...cue,
    ...adjust(cue),
    finishBeforeAdvance: cue.finishBeforeAdvance || !!cue.sequence?.length,
    sequence: cue.sequence?.map((step) => ({ ...step, ...adjust(step) })),
  };
}
