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
  chair?: boolean;
  stool?: boolean;
  /** Low seat rendered separately: rock, ledge or step stool. */
  perch?: boolean;
  bed?: "rest" | "edge" | "breakfast" | "sleep";
  packing?: boolean;
  writing?: boolean;
  shoulder?: boolean;
  sword?: boolean;
  lane?: number;
  via?: { x: number; bottom: number }[];
  name?: string;
  /** Horizontal label adjustment in percent of the actor cell during close interaction. */
  nameOffset?: number;
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
  cameraScale?: number;
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
    | "tower-base-moss"
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
  cut?: boolean;
  cartArt?: "loaded-cart" | "return-cart";
  initial?: Partial<Record<ResidentId, number>>;
  initialBottom?: Partial<Record<ResidentId, number>>;
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
  chair?: boolean;
  bed?: "rest" | "listen" | "ask" | "nod";
};
export type StageItem = {
  id: string;
  art:
    | "moss"
    | "moss-jar"
    | "lantern"
    | "basket"
    | "tools"
    | "map"
    | "cloth"
    | "colony"
    | "dish"
    | "stone"
    | "spatula"
    | "bread"
    | "tea"
    | "tea-four"
    | "teacup"
    | "empty-cup"
    | "teapot"
    | "teapot-open"
    | "tea-rock"
    | "brazier"
    | "kettle"
    | "medicine"
    | "medicine-closed"
    | "delivery-bag"
    | "herbs"
    | "honey"
    | "signpost"
    | "keystone"
    | "replacement"
    | "ledger"
    | "closed-ledger"
    | "seedlings"
    | "stone-lantern"
    | "stone-lantern-sooty"
    | "stone-lantern-unlit"
    | "oil-dish"
    | "plant-label"
    | "table"
    | "dining-table"
    | "chair"
    | "step-stool"
    | "record-board"
    | "paper"
    | "folded-paper"
    | "lap-board"
    | "sample-dish"
    | "reflector-covered"
    | "reflector"
    | "reflector-down"
    | "low-smoke"
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
  seatFor?: ResidentId;
  dissipating?: boolean;
  pouring?: boolean;
  steaming?: boolean;
  left?: boolean;
  x: number;
  bottom: number;
  width?: number;
  actor?: ResidentId;
  extra?: StageExtra["id"];
  /** Surface supporting or being touched by this object, independent of its height. */
  support?: string;
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
