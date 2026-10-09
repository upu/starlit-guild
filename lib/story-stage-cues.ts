import type { ResidentId } from "./home-actor.ts";

export type StageActor = {
  id: ResidentId;
  x: number;
  left: boolean;
  wave?: boolean;
  inspect?: boolean;
  pull?: boolean;
  carry?: boolean;
  visible?: boolean;
  pose?: "idle" | "greet" | "surprise" | "think" | "offer" | "tease";
  reaction?: "surprise" | "nod";
};
export type StoryStageCue = {
  description: string;
  actors: StageActor[];
  luggage: boolean;
  cartX?: number;
  background?: "meeting-path" | "town-exit" | "meeting-dusk" | "town-shop" | "town-shop-return";
  hideCart?: boolean;
  box?: "table" | "aria" | "high" | "shared";
  cartArt?: "loaded-cart" | "return-cart";
  initial?: Partial<Record<ResidentId, number>>;
  bundleMode?: "ground" | "carried" | "hidden";
};

export const stagePair = (
  aria = 28,
  leon = 56,
  ariaAction: Partial<StageActor> = {},
  leonAction: Partial<StageActor> = {},
): StageActor[] => [
  { id: "aria", x: aria, left: false, ...ariaAction },
  { id: "leon", x: leon, left: true, ...leonAction },
];
