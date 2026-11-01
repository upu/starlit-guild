import type { StageItem } from "../story-stage-cues.ts";
import { receptionDisplayItem, potsOverDrape } from "./reception-display-items.ts";

export function nightHandItems(items: StageItem[], bridge: boolean): StageItem[] {
  return potsOverDrape(
    items.map((raw) => {
      const item = bridge ? raw : receptionDisplayItem(raw);
      if (item.id === "palm-cloth")
        return {
          ...item,
          x: 0,
          bottom: 0,
          wrist: true,
          wristAnchor: "bottom",
          width: 3.5,
        };
      if (item.id === "cover-cloth")
        return {
          ...item,
          x: 0,
          bottom: 0,
          wrist: true,
          wristAnchor: "top",
          wristOffset: { x: -6.4, bottom: 5.7 },
        };
      if (item.id === "display-pot" && item.actor)
        return {
          ...item,
          x: 0,
          bottom: 0,
          wrist: true,
          wristAnchor: "bottom",
        };
      if (item.art === "medicine-closed") return { ...item, width: 5.2 };
      if (item.art === "empty-garden-pot") return { ...item, width: 6 };
      return item;
    }),
  );
}
