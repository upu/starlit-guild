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
  seated?: boolean;
  packing?: boolean;
  writing?: boolean;
  shoulder?: boolean;
  sword?: boolean;
  lane?: number;
  name?: string;
  bottom?: number;
  visible?: boolean;
  pose?: "idle" | "greet" | "surprise" | "think" | "offer" | "tease";
  reaction?: "surprise" | "nod";
};
export type StoryStageCue = {
  description: string;
  actors: StageActor[];
  luggage: boolean;
  cartX?: number;
  cell?: number;
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
    | "drain-cleared"
    | "medicine-room"
    | "dining-room"
    | "manor-garden"
    | "workshop"
    | "mountain-road"
    | "berne-street"
    | "brekka-alley"
    | "village-house"
    | "stone-yard"
    | "storeroom"
    | "moss-beds"
    | "registry"
    | "bridge-night"
    | "warehouse-office"
    | "patient-room"
    | "new-moss-beds";
  hideCart?: boolean;
  box?: "table" | "aria" | "high" | "shared";
  merchant?: { pose: "idle" | "explain" | "point" | "wave"; speaking?: boolean };
  extras?: StageExtra[];
  items?: StageItem[];
  night?: boolean;
  cartArt?: "loaded-cart" | "return-cart";
  initial?: Partial<Record<ResidentId, number>>;
  bundleMode?: "ground" | "carried" | "hidden";
  sequence?: StageMoment[];
};

export type StageMoment = {
  after: number;
  actors: StageActor[];
  items: StageItem[];
};

export type StageExtra = {
  id:
    | "keeper"
    | "worker"
    | "merchant"
    | "masked-pumpety"
    | "merrill"
    | "cook"
    | "doctor"
    | "parent"
    | "child";
  name?: string;
  x: number;
  bottom?: number;
  pose?: "idle" | "explain" | "point" | "wave";
  speaking?: boolean;
  carry?: boolean;
  left?: boolean;
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
    | "moss-crevice"
    | "dish"
    | "stone"
    | "spatula"
    | "bread"
    | "tea"
    | "medicine"
    | "delivery-bag"
    | "herbs"
    | "honey"
    | "signpost"
    | "keystone"
    | "replacement"
    | "ledger"
    | "seedlings"
    | "stone-lantern"
    | "table"
    | "pot"
    | "key"
    | "juice"
    | "ale"
    | "sample-jar"
    | "handcart"
    | "puppet"
    | "golem"
    | "picnic-cloth"
    | "basket-cart"
    | "seedling-cart"
    | "empty-cart";
  x: number;
  bottom: number;
  width?: number;
  actor?: ResidentId;
  extra?: StageExtra["id"];
  tilt?: number;
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
