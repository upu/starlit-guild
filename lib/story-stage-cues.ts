import type { ResidentId } from "./home-actor.ts";

export type StageActor = {
  id: ResidentId;
  x: number;
  left: boolean;
  wave?: boolean;
  inspect?: boolean;
  pull?: boolean;
  carry?: boolean;
  place?: boolean;
  shawl?: boolean;
  visible?: boolean;
  pose?: "idle" | "greet" | "surprise" | "think" | "offer" | "tease";
  reaction?: "surprise" | "nod";
};
export type StoryStageCue = {
  description: string;
  actors: StageActor[];
  luggage: boolean;
  cartX?: number;
  background?:
    | "meeting-path"
    | "town-exit"
    | "meeting-dusk"
    | "town-shop"
    | "town-shop-return"
    | "hill-path"
    | "hill-night"
    | "meeting-night"
    | "tower-foot"
    | "forest-floor"
    | "drain-blocked"
    | "drain-cleared";
  hideCart?: boolean;
  box?: "table" | "aria" | "high" | "shared";
  merchant?: { pose: "idle" | "explain" | "point" | "wave"; speaking?: boolean };
  extras?: StageExtra[];
  items?: StageItem[];
  night?: boolean;
  cartArt?: "loaded-cart" | "return-cart";
  initial?: Partial<Record<ResidentId, number>>;
  bundleMode?: "ground" | "carried" | "hidden";
};

export type StageExtra = {
  id: "keeper" | "worker" | "merchant";
  x: number;
  bottom?: number;
  pose?: "idle" | "explain" | "point" | "wave";
  speaking?: boolean;
};
export type StageItem = {
  id: string;
  art:
    | "moss"
    | "lantern"
    | "basket"
    | "tools"
    | "map"
    | "cloth"
    | "colony"
    | "dish"
    | "stone"
    | "spatula";
  x: number;
  bottom: number;
  width?: number;
  actor?: "aria" | "leon";
  glow?: "dim" | "bright";
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
