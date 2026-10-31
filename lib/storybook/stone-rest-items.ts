import type { StageItem } from "../story-stage-cues.ts";

const widths: Partial<Record<StageItem["art"], number>> = {
  basket: 5.5,
  "medicine-closed": 5.2,
  "delivery-bag": 7,
};
export function stoneRestItem(item: StageItem): StageItem {
  if (item.support === "table") item = { ...item, bottom: 30 };
  if (item.id === "mira-cup" && !item.actor) item = { ...item, x: 40 };
  const width = widths[item.art];
  if (width !== undefined) return { ...item, width };
  if (item.art === "chair") return restChair(item);
  if (item.id === "sale-receipt")
    return { ...item, width: 3.5, x: 0, bottom: 0, wrist: true, wristAnchor: "bottom" };
  return heldRestItem(item);
}

function heldRestItem(item: StageItem): StageItem {
  if (item.id === "comparison-cloth" && item.actor)
    return { ...item, width: 2.8, x: 0, bottom: 0, wrist: true, wristAnchor: "top" };
  if (item.art === "kettle" && item.actor)
    return {
      ...item,
      x: 0,
      bottom: 0,
      wrist: true,
      wristAnchor: "top",
      wristOffset: { x: 0, bottom: 0.5 },
    };
  if (item.art === "teacup" && item.actor)
    return { ...item, x: 0, bottom: 0, wrist: true, wristAnchor: "bottom" };
  return item;
}

function restChair(item: StageItem): StageItem {
  return {
    ...item,
    width: 8.5,
    seatFor: undefined,
    ...(item.actor
      ? {
          x: 0,
          bottom: 0,
          wrist: true,
          wristAnchor: "top" as const,
          wristOffset: { x: 2.5, bottom: 0 },
        }
      : { x: item.x + (item.left ? 1.5 : -1.5) }),
  };
}
