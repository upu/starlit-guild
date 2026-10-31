import type { StageItem } from "../story-stage-cues.ts";

export function surveyGardenItem(item: StageItem): StageItem {
  if (item.art === "tool-rucksack") return { ...item, x: -2.2 };
  if (item.art === "garden-pot")
    return item.extra
      ? { ...item, x: 0, bottom: 0, width: 6, wrist: true }
      : { ...item, x: 81.25, bottom: 43.45, width: 6 };
  if (item.art === "work-gloves") return gloveItem(item);
  if (item.id === "case-key") return keyItem(item);
  return item;
}

function gloveItem(item: StageItem): StageItem {
  if (item.extra && item.bottom === 49) return { ...item, stored: true };
  const offer = item.x === 3.2 || !!item.extra;
  return {
    ...item,
    x: 0,
    bottom: 0,
    width: 3.2,
    wrist: true,
    wristAnchor: "top",
    wristOffset: offer ? { x: 0, bottom: 0 } : { x: -3.3, bottom: -4 },
  };
}

function keyItem(item: StageItem): StageItem {
  if (item.extra && item.bottom === 50) return { ...item, x: 0, bottom: 50, width: 1.5 };
  const inside = item.actor && item.bottom === 19;
  return {
    ...item,
    x: 0,
    bottom: 0,
    width: 1.5,
    wrist: true,
    wristAnchor: "top",
    wristOffset: inside ? { x: -3.3, bottom: -4 } : { x: 0, bottom: 0 },
  };
}
