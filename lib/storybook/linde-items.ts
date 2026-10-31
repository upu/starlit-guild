import type { StageItem } from "../story-stage-cues.ts";
export function lindeItem(i: StageItem): StageItem {
  if (i.id === "cleared-plate" && !i.extra) return { ...i, x: 71, bottom: 28 };
  if (i.id === "town-request" && i.x === 67 && !i.extra)
    return { ...i, x: 64, bottom: 30.5, pitch: 55 };
  if (i.art === "chair") return lindeChair(i);
  if (i.art === "delivery-bag") return { ...i, width: 6.5 };
  if (i.art === "trade-parcels") return { ...i, width: 10 };
  if (i.actor || i.extra) return lindeHeld(i);
  return i.support === "table" ? { ...i, bottom: tableHeight(i), pitch: paperPitch(i) } : i;
}
function lindeChair(i: StageItem): StageItem {
  return {
    ...i,
    width: 8.5,
    seatFor: undefined,
    x: i.x + (i.left ? 1.5 : -1.5),
    bottom: i.bottom + (chairShift[i.id] ?? 0),
  };
}
function lindeHeld(i: StageItem): StageItem {
  return {
    ...i,
    x: 0,
    bottom: 0,
    wrist: true,
    wristAnchor: "bottom",
    width: i.art === "paper" ? 5 : i.width,
    pitch: paperPitch(i),
  };
}
function paperPitch(i: StageItem) {
  return ["paper", "folded-paper", "sealed-letter"].includes(i.art) ? 55 : i.pitch;
}
const chairShift: Record<string, number> = { "chair-aria": 12, "chair-mira": 10, "chair-finn": 4 };
function tableHeight(i: StageItem) {
  const heights: Record<string, number> = {
    "aria-lunch": 34,
    "leon-lunch": 30.5,
    "mira-lunch": 37,
    "cleared-plate": 29,
    "town-request": i.x === 67 ? 28.5 : 33,
    "finn-request": i.x === 57 ? 34.5 : i.x === 59 ? 32.5 : 34,
    "mira-request": 36,
  };
  return heights[i.id] ?? i.bottom + 2;
}
