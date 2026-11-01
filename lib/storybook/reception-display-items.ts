import type { StageItem } from "../story-stage-cues.ts";

export function receptionDisplayItem(item: StageItem): StageItem {
  if (item.id === "case" || item.id === "tower-stone") return { ...item, bottom: item.bottom - 3 };
  if (item.art === "garden-pot") return { ...item, width: 6 };
  if (item.id === "case-key")
    return { ...item, x: 0, bottom: 0, width: 1.5, wrist: true, wristAnchor: "top" };
  if (item.id === "return-marker")
    return item.actor
      ? { ...item, x: 0, bottom: 0, wrist: true, wristAnchor: "top" }
      : { ...item, x: 13.2, width: 2.5, bottom: 52.55 };
  if (item.id !== "spare-cloth") return item;
  return spareCloth(item);
}

function spareCloth(item: StageItem): StageItem {
  if (item.carrier) return { ...item, support: "reception-cart" };
  if (item.art === "cart-drape")
    return {
      ...item,
      x: 0,
      bottom: 0,
      width: 11,
      support: "reception-cart",
      wrist: true,
      wristAnchor: "bottom",
      wristOffset: { x: 4.36, bottom: -0.89 },
    };
  return {
    ...item,
    x: 0,
    bottom: 0,
    wrist: true,
    wristAnchor: item.art === "light-cloth" ? "top" : "bottom",
    wristOffset: { x: 0, bottom: item.art === "light-cloth" ? 1.8 : 0 },
    support: item.art === "light-cloth" ? "reception-cart" : undefined,
    width: item.art === "light-cloth" ? 6.2 : 3.5,
  };
}

/** The two pots stay in front of the drape without being flattened into its image. */
export function potsOverDrape(items: StageItem[]): StageItem[] {
  const draped = items.some(
    (item) => item.id === "spare-cloth" && ["cart-drape", "light-cloth"].includes(item.art),
  );
  if (!draped) return items;
  const cart = items.find((item) => item.id === "reception-cart");
  if (!cart) return items;
  return items.map((item) =>
    item.id.startsWith("cart-pot-")
      ? {
          ...item,
          carrier: undefined,
          x: cart.x + item.x,
          bottom: cart.bottom + item.bottom,
          support: "spare-cloth",
        }
      : item,
  );
}
