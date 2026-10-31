import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { nightStudyCue } from "./night-cue.ts";

const groundHands: Partial<Record<StageActor["id"], [number, number]>> = {
  aria: [70, 103],
  leon: [63, 100],
  mira: [66, 100],
  finn: [69, 97],
};
function porchActors(cue: StoryStageCue, items: StageItem[]): StageActor[] {
  return nightStudyCue(cue).actors.map((actor) => {
    const lap = groundHands[actor.id] ?? [68, 100];
    const bread = items.some(
      (item) => item.actor === actor.id && ["bread-roll", "bread-half"].includes(item.art),
    );
    return {
      ...actor,
      perch: actor.seated || actor.perch,
      nameAbove: actor.seated || actor.nameAbove,
      pose: actor.seated && bread ? "offer" : actor.pose,
      carryWalkFrames: [8, 9, 22, 23] as const,
      ...(actor.id === "mira"
        ? {
            packing: false,
            carryWalkFrames: [8, 9, 22, 23] as const,
            carry:
              actor.carry ||
              items.some((item) => item.id === "prescription" && item.actor === "mira"),
          }
        : {}),
      wristPoints: {
        ...actor.wristPoints,
        ...(actor.id === "finn"
          ? {
              14: [79, 75] as [number, number],
              15: [79, 75] as [number, number],
              16: [79, 75] as [number, number],
              13: [91, 90] as [number, number],
              8: [80, 74] as [number, number],
              9: [81, 73] as [number, number],
              22: [82, 75] as [number, number],
              23: [81, 75] as [number, number],
            }
          : {}),
        ...(actor.id === "mira"
          ? {
              0: [80, 95] as [number, number],
              3: [80, 95] as [number, number],
              4: [47, 80] as [number, number],
              14: [80, 80] as [number, number],
              15: [80, 80] as [number, number],
              8: [84, 77] as [number, number],
              9: [84, 77] as [number, number],
              22: [84, 77] as [number, number],
              23: [84, 77] as [number, number],
            }
          : {}),
        36: lap,
        38: lap,
        39: lap,
        40: lap,
        42: lap,
        43: lap,
        37: [92, 93],
        41: [92, 93],
      },
    };
  });
}

function porchItem(item: StageItem): StageItem {
  if (item.id === "tea-tray") return porchTray(item);
  if (item.art === "medicine-closed") return porchMedicine(item);
  if (item.art === "lap-napkin") return { ...item, width: Math.min(item.width ?? 7, 7) };
  if (item.art === "bread-roll" || item.art === "bread-half") return porchBread(item);
  if (item.actor && ["prescription", "visit-notebook"].includes(item.id))
    return {
      ...item,
      x: 0,
      bottom: 0,
      width: item.id === "prescription" ? 2.5 : 3.5,
      wrist: true,
      wristAnchor: "bottom",
    };
  return item;
}

function porchTray(item: StageItem): StageItem {
  return {
    ...item,
    width: 8,
    ...(item.actor ? { x: 0, bottom: 0, wrist: true, wristAnchor: "bottom" as const } : {}),
  };
}

function porchMedicine(item: StageItem): StageItem {
  return {
    ...item,
    width: 5.2,
    ...(item.actor ? { x: 0, bottom: 0, wrist: true, wristAnchor: undefined } : {}),
  };
}

function porchBread(item: StageItem): StageItem {
  return {
    ...item,
    width: item.art === "bread-roll" ? 2.5 : 1.9,
    ...(item.actor ? { x: 0, bottom: 0, wrist: true, wristAnchor: "bottom" as const } : {}),
  };
}

export function porchStudyCue(cue: StoryStageCue): StoryStageCue {
  return {
    ...cue,
    finishBeforeAdvance: cue.finishBeforeAdvance || !!cue.sequence?.length,
    actors: porchActors(cue, cue.items ?? []),
    items: cue.items?.map(porchItem),
    sequence: cue.sequence?.map((step) => ({
      ...step,
      actors: porchActors({ ...cue, actors: step.actors }, step.items),
      items: step.items.map(porchItem),
    })),
  };
}
