import type { StageItem } from "./story-stage-cues.ts";
import { ground, held } from "./story-stage-later-shared.ts";

export function receptionCart(
  x: number,
  bottom: number,
  pushing = false,
  left = false,
): StageItem[] {
  const cart: StageItem = {
    ...ground("empty-cart", x, bottom, 26),
    id: "reception-cart",
    left,
    ...(pushing ? { actor: "finn" as const } : {}),
  };
  return [
    cart,
    { ...ground("wrapped-stone", -3, 13, 6.2), id: "replacement-parcel", carrier: cart.id },
    ...[-7, 2].map((offset, i): StageItem => ({
      ...ground("garden-pot", offset, i ? 11 : 16, 7),
      id: `cart-pot-${String(i)}`,
      carrier: cart.id,
    })),
  ];
}

type DisplayProps = {
  marker?: "hand" | "post";
  covered?: boolean;
  cloth?: "hidden" | "leon" | "finn" | "rim";
};
export function receptionDisplayItems({
  marker = "post",
  cloth = "hidden",
  covered = false,
}: DisplayProps = {}): StageItem[] {
  return [
    ...receptionCart(51, 14).map((p) =>
      p.id === "replacement-parcel" ? { ...p, stored: covered } : p,
    ),
    { ...ground("table", 66, 42, 24), id: "display-table" },
    { ...ground("display-covered", 66, 59, 14), id: "case", support: "display-table" },
    { ...ground("tower-stone", 66, 64, 6.2), id: "tower-stone", support: "case", stored: true },
    { ...ground("garden-pot", 48, 45, 7), id: "display-pot" },
    { ...ground("key", -3, 59, 2.4), id: "case-key", extra: "merchant" },
    marker === "hand"
      ? held("twine", "aria", { id: "return-marker", x: 4.5, bottom: 29, width: 3.5 })
      : { ...ground("twine", 12.5, 60, 3.5), id: "return-marker" },
    cloth === "rim"
      ? { ...ground("cart-drape", -3, 10, 11), id: "spare-cloth", carrier: "reception-cart" }
      : held("cloth", cloth === "finn" ? "finn" : "leon", {
          id: "spare-cloth",
          width: 3.5,
          x: cloth === "finn" ? 3.2 : -3.3,
          bottom: cloth === "finn" ? 23 : 26,
          stored: cloth === "hidden",
        }),
  ];
}
