import type { StageItem } from "../story-stage-cues.ts";
import { foundingCargo, foundingCargoPosition, foundingCargoSize } from "../road-founding-cargo.ts";
import { STANDARD_QUEST_NODES } from "../puppet-battles.ts";

const cartWidth = 25;
const cartBottomOverhang = 20 / 504;

export function foundingDepartureItem(i: StageItem): StageItem {
  if (i.id === "lico-travel-bag") return travelBag(i);
  if (i.id === "comparison-jar")
    return { ...i, width: 3.4, wristAnchor: "bottom", wristOffset: undefined };
  if (i.id === "aria-gift-bag") return { ...i, width: 5.5, x: -4, bottom: 21 };
  if (i.id === "keeper-records") return { ...i, width: 4.5, bottom: 45.5, pitch: 55 };
  if (i.art === "basket") return { ...i, width: 6.5 };
  return i;
}
function travelBag(i: StageItem): StageItem {
  if (i.wrist) return { ...i, width: 5.5 };
  if (i.actor) return { ...i, width: 5.5, x: -4.5, bottom: 22 };
  return { ...i, x: 78, bottom: 14, width: 5.5 };
}
export function foundingRoadItem(i: StageItem): StageItem {
  if (i.id === "return-cart")
    return { ...i, actor: "finn", x: -15, bottom: 22.3, width: cartWidth, behindOwner: true };
  return foundingDepartureItem(i);
}

/** Match the initial adventure cart's cargo and positions before the scene changes. */
export function foundingRoadItems(items: StageItem[]): StageItem[] {
  const slots = foundingCargo(STANDARD_QUEST_NODES, new Set()).slots;
  return items.flatMap((item) => {
    const kind =
      item.id === "return-basket" ? "basket" : item.id === "return-letters" ? "letter" : null;
    if (!kind) return [foundingRoadItem(item)];
    const width = cartWidth * foundingCargoSize[kind];
    const height = width * (kind === "basket" ? 197 / 256 : 1);
    return (slots?.[kind] ?? []).map((_, index) => {
      const [x, y] = foundingCargoPosition(kind, index);
      return {
        ...item,
        id: index === 0 ? item.id : `${item.id}-${String(index)}`,
        x: cartWidth * x,
        bottom: (cartWidth * (cartBottomOverhang - y) - height / 2) * 1.5,
        width,
        pitch: undefined,
      };
    });
  });
}
