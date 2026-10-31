import type { StageItem } from "../story-stage-cues.ts";
import { SEEDLING_SCENE_SCALE } from "../seedling-scene-scale.ts";

export const loadingReflector = (): StageItem => ({
  id: "loading-reflector",
  art: "reflector-down",
  x: 49.1875,
  bottom: 41,
  width: 12,
});
const restingMushroom = (item: StageItem) =>
  item.id.startsWith("korotake-") && item.art === "korotake";
const creatureScale = SEEDLING_SCENE_SCALE;
function restingMushroomItem(item: StageItem): StageItem {
  return {
    ...item,
    art: "korotake-rest",
    width: (item.width ?? 5.5) * creatureScale,
    ...(item.carrier ? { x: item.x * creatureScale, bottom: item.bottom * creatureScale } : {}),
    ...(!item.extra && !item.carrier && !item.actor ? { x: item.x - 6 } : {}),
  };
}

export function seedlingItem(i: StageItem, items: StageItem[]): StageItem {
  if (restingMushroom(i)) return restingMushroomItem(i);
  if (i.id === "route-slip") return attachedSquare(i, 3.5);
  if (["covered-seedlings", "open-seedlings"].includes(i.id)) return loadingBasket(i, items);
  if (i.id === "damp-cloth")
    return i.actor
      ? { ...attachedSquare(i, 9), pitch: 55 }
      : { ...i, stored: !!i.support, pitch: 55 };
  if (i.id === "comparison-sprig") return comparisonSprig(i);
  if (i.id === "open-moss") return { ...i, stored: true };
  return i.id === "merrill-pot" ? loadingPot(i) : i;
}
function comparisonSprig(i: StageItem): StageItem {
  return i.wrist || i.extra
    ? {
        ...i,
        x: 0,
        bottom: 0,
        wrist: true,
        width: 1.9,
        wristAnchor: "bottom",
        wristOffset: { x: 0, bottom: -0.7 },
      }
    : { ...i, width: 1.9 };
}
function loadingBasket(i: StageItem, items: StageItem[]): StageItem {
  const cloth = items.find((p) => p.id === "damp-cloth");
  const art =
    i.id === "covered-seedlings" && cloth?.support === i.id && !cloth.actor
      ? "seedlings"
      : "basket";
  return { ...i, art };
}
function attachedSquare(i: StageItem, width: number): StageItem {
  return {
    ...i,
    width,
    x: 0,
    bottom: 0,
    wrist: true,
    wristOffset: { x: 0, bottom: -width * 0.75 * (1 - 1 / 1.3) },
  };
}
function loadingPot(i: StageItem): StageItem {
  return i.wrist
    ? {
        ...i,
        art: "merrill-pot-full",
        width: 9.4 * creatureScale,
        wristAnchor: undefined,
        wristOffset: { x: 0, bottom: -1.6269230769 * creatureScale },
        x: 0,
        bottom: 0,
      }
    : { ...i, extra: undefined, x: 76, bottom: -5, width: 9.4 * creatureScale };
}
