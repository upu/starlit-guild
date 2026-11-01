import type { StageItem } from "../story-stage-cues.ts";

export function receptionWellItem(item: StageItem): StageItem {
  if (item.id === "reception-cart" && item.actor)
    return {
      ...item,
      x: 0,
      bottom: 0,
      wrist: true,
      wristAnchor: "bottom",
      wristOffset: { x: 8.8, bottom: -3.3 },
    };
  if (item.art === "garden-pot") return { ...item, width: 6 };
  if (item.art === "tool-rucksack") return toolBag(item);
  if (item.art === "snag-rope" && !item.carrier) return { ...item, bottom: 23.2, tilt: 0 };
  if (item.id === "loose-fastener" && item.actor)
    return { ...item, x: 0, bottom: 0, wrist: true, wristAnchor: "bottom" };
  if (item.id === "garden-map")
    return { ...item, x: 0, bottom: 0, wrist: true, wristAnchor: "bottom" };
  return item;
}

function toolBag(item: StageItem): StageItem {
  if (item.behindOwner) return { ...item, x: -2.2 };
  return item.actor || item.extra
    ? { ...item, x: 0, bottom: 0, wrist: true, wristAnchor: "top" }
    : item;
}
