import type { StageItem } from "./story-stage-cues.ts";
import { ground } from "./story-stage-later-shared.ts";

export function transplantRope(state: "cart" | "hand" | "ground"): StageItem {
  const base = { ...ground("rope-coil", 0, 0, 6), id: "transplant-rope" };
  if (state === "cart") return { ...base, carrier: "transplant-cart", x: -11, bottom: 11 };
  if (state === "hand") return { ...base, actor: "leon", wrist: true };
  return { ...base, x: 36, bottom: 13 };
}

export function transplantHoe(index: number, state: "back" | "hand" | "ground"): StageItem {
  const base = { ...ground("farm-hoe", 0, 0, 3.5), id: `loading-hoe-${String(index)}` };
  if (state === "ground") return { ...base, x: 58 + index * 2, bottom: -7 - index * 5, tilt: 78 };
  if (state === "back")
    return { ...base, actor: "leon", x: 5 + index * 2, bottom: 17, behindOwner: true, tilt: -12 };
  return {
    ...base,
    actor: "leon",
    wrist: true,
    wristAnchor: "bottom",
    wristOffset: { x: -1.2, bottom: -11.8 },
  };
}

const moss = (): StageItem => ({
  ...ground("moss", 0, 4.5, 6),
  id: "transplant-moss",
  carrier: "transplant-basket",
  glow: "dim",
});
export const transplantBasket = (owner: "lico" | "aria", cloth = false): StageItem[] => [
  {
    ...ground("basket", 0, 0, 9),
    id: "transplant-basket",
    actor: owner,
    wrist: true,
  },
  moss(),
  ...(cloth
    ? [{ ...ground("packing-cloth", -2, 1, 4), id: "basket-cloth", carrier: "transplant-basket" }]
    : []),
];
export const restingBasket = (): StageItem[] => [
  basketCloth(),
  { ...ground("basket", 27, 12, 9), id: "transplant-basket", support: "basket-cloth" },
  moss(),
];
export const basketCloth = (held = false): StageItem => ({
  ...ground("picnic-cloth", held ? 0 : 27, held ? 0 : 12, 13),
  id: "basket-cloth",
  ...(held ? { actor: "aria", wrist: true, behindOwner: true } : {}),
});
export const wheelBoard = (held = false): StageItem => ({
  ...ground("lap-board", held ? 0 : 49.75, held ? 0 : 34.5, 13),
  id: "wheel-board",
  pitch: held ? 0 : 55,
  ...(held ? { actor: "aria", wrist: true } : {}),
});
export const transplantCart = (stuck = true, x = 55): StageItem => ({
  ...ground("basket-cart", x, stuck ? 36 : 40, 25),
  id: "transplant-cart",
  tilt: stuck ? -12 : 0,
});
export const cartMoss = (): StageItem[] => [
  { ...ground("moss", -4, 17, 5), id: "cart-moss-left", carrier: "transplant-cart", glow: "dim" },
  { ...ground("moss", 3, 15, 5), id: "cart-moss-right", carrier: "transplant-cart", glow: "dim" },
];
