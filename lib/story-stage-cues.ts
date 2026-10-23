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
  /** A small seated adjustment on the same seat, without switching to a walk. */
  scoot?: boolean;
  bed?: "rest" | "edge" | "breakfast" | "sleep";
  packing?: boolean;
  writing?: boolean;
  shoulder?: boolean;
  sword?: boolean;
  push?: "brace" | "extend";
  /** Finn's two-frame fist tap on a door. */
  knock?: boolean;
  healing?: "treat" | "rise" | "steady";
  gloves?: "worn" | "remove";
  handAction?: "catch" | "guard" | "wipe" | "palm" | "pat-ready" | "pat-touch";
  /** Mira turns toward the far bank after checking Finn's hand. */
  lookAcross?: boolean;
  /** A stationary reach draws the hand in front of this prop. */
  reachOver?: string;
  bow?: "aim" | "release";
  lane?: number;
  via?: { x: number; bottom: number }[];
  name?: string;
  /** Horizontal label adjustment in percent of the actor cell during close interaction. */
  nameOffset?: number;
  /** Keep names clear of meal props laid in front of the actors. */
  nameAbove?: boolean;
  bottom?: number;
  visible?: boolean;
  pose?: "idle" | "greet" | "surprise" | "think" | "offer" | "tease";
  reaction?: "surprise" | "nod";
  /** The applied dressing remains on the arm when scene props change. */
  dressed?: boolean;
};
export type StoryStageCue = {
  arrows?: StageArrow[];
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
    | "picnic-hill"
    | "roadside-rest"
    | "berne-overlook"
    | "berne-paving"
    | "berne-porch"
    | "berne-foundation-grass"
    | "berne-foundation-open"
    | "berne-foundation-restored"
    | "manor-kitchen"
    | "manor-kitchen-open"
    | "manor-gate"
    | "manor-back-paths"
    | "manor-well"
    | "manor-display-back"
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
    | "workshop-yard"
    | "mountain-road"
    | "mountain-fork-empty"
    | "berne-street"
    | "brekka-alley"
    | "village-house"
    | "stone-yard"
    | "storeroom"
    | "stone-storeroom"
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

export type StageArrow = {
  after: number;
  duration: number;
  from: { x: number; bottom: number };
  to: { x: number; bottom: number };
};

export type StageMoment = {
  after: number;
  actors: StageActor[];
  items: StageItem[];
  extras?: StageExtra[];
};

export type StageExtra = {
  restoration?: "trace" | "touch" | "read" | "receive";
  kitchen?: "pot" | "lid" | "inspect" | "cloth";
  care?: "sore" | "palm" | "bandaged" | "rest";
  grip?: "reach" | "hold";
  limp?: boolean;
  hatGreeting?: boolean;
  id:
    | "keeper"
    | "worker"
    | "stone-carrier"
    | "fence-carrier"
    | "merchant"
    | "masked-pumpety"
    | "merrill"
    | "cook"
    | "doctor"
    | "parent"
    | "child";
  name?: string;
  x: number;
  via?: { x: number; bottom: number }[];
  bottom?: number;
  pose?: "idle" | "explain" | "point" | "wave";
  speaking?: boolean;
  carry?: boolean;
  left?: boolean;
  chair?: boolean;
  bed?: "rest" | "listen" | "ask" | "nod";
  bow?: "shallow" | "deep";
  writing?: boolean;
  inspect?: boolean;
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
    | "bread-roll"
    | "bread-half"
    | "medicine-packet"
    | "lap-napkin"
    | "old-wrapper"
    | "serving-tray"
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
    | "signpost-portable"
    | "honey-bag"
    | "honey-bag-open"
    | "trade-parcels"
    | "trade-parcels-open"
    | "packing-cloth"
    | "dragging-cloth"
    | "wrist-bandage"
    | "water-bucket"
    | "empty-bottles"
    | "walnut-cake"
    | "honey-cake"
    | "travel-flask"
    | "flask-cup"
    | "twine"
    | "cake-parcel"
    | "walnut-light"
    | "walnut-medium"
    | "walnut-dark"
    | "walnut-light-half"
    | "walnut-medium-half"
    | "walnut-dark-half"
    | "walnut-underside"
    | "walnut-piece"
    | "low-bench"
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
    | "display-open"
    | "display-closed"
    | "display-covered"
    | "tower-stone"
    | "tower-stone-bottom"
    | "light-cloth"
    | "candidate-blue"
    | "candidate-violet"
    | "candidate-dull"
    | "covered-stone"
    | "stone-wrap"
    | "wrapped-stone"
    | "receipt-front"
    | "receipt-back"
    | "lap-board"
    | "sample-dish"
    | "reflector-covered"
    | "reflector"
    | "reflector-down"
    | "low-smoke"
    | "pot"
    | "survey-pot"
    | "pot-lid"
    | "tool-rucksack"
    | "scrubbing-rag"
    | "garden-pot"
    | "empty-garden-pot"
    | "work-fence"
    | "joint-roots"
    | "work-gloves"
    | "broken-fastener"
    | "stained-cloth"
    | "snag-rope"
    | "iron-fastener"
    | "cart-drape"
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
  /** A strapped bag sits behind its owner, rather than in the hands. */
  behindOwner?: boolean;
  /** Parent object carrying this object; x/bottom become offsets from its displayed base. */
  carrier?: string;
  /** Move away while retaining the authored facing and reversing the foot cycle. */
  backstep?: boolean;
  /** Dressing attached to the displayed arm; hidden when that arm is behind the body. */
  wrist?: boolean;
  /** Suspend a square prop by its top edge, for example a bag held by its handle. */
  wristAnchor?: "top";
  /** Contents remain attached to their container after being put away. */
  stored?: boolean;
  /** Surface supporting or being touched by this object, independent of its height. */
  support?: string;
  tilt?: number;
  /** Turn a flat prop around its vertical axis, without changing its physical size. */
  turn?: number;
  /** Ground movement duration; ordinary handoffs retain their default duration. */
  travelMs?: number;
  figure?: "kneel" | "bow" | "recoil";
  glow?: "dim" | "bright";
  glowTone?: "violet";
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
