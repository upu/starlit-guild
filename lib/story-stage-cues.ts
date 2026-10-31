import type { ResidentId } from "./home-actor.ts";
import type { StageExtra } from "./story-stage-extra-types.ts";
export type { StageExtra } from "./story-stage-extra-types.ts";

export type StageActor = {
  /** Optional registered conversation hand centers for an alternative atlas. */
  wristPoints?: Partial<Record<number, [number, number]>>;
  shawlWristPoints?: Partial<Record<number, [number, number]>>;
  /** Painted lantern is gripped in the near hand; the other palm stays free. */
  lanternHold?: boolean;
  /** Seated paper handling; props remain separate from the character art. */
  seatedPaper?: "reach" | "release";
  seatTransition?: "lower" | "settle";
  paperAction?: "strike-start" | "strike-end" | "tear-start" | "tear-end";
  recordStudy?: "read" | "point" | "page" | "hug";
  /** Keep the notebook against the chest while the free palm receives or offers a field item. */
  recordHandOut?: boolean;
  /** Lico's notebook / fieldwork and Mira's supporting hand, registered in the common atlas. */
  mossStudy?:
    | "glasses"
    | "read"
    | "write"
    | "show"
    | "page"
    | "reach"
    | "taste"
    | "brace"
    | "wipe"
    | "spread";
  mossCare?: "hold" | "slip" | "support" | "steady";
  /** Leon keeps the open route notes in his registered hand pose. */
  routeNotes?: "read" | "write" | "fold" | "pocket" | "unfold";
  allNighter?: "reach" | "pause" | "answer" | "think";
  visit?: "touch" | "slide" | "bottle";
  id: ResidentId;
  x: number;
  /** Optional milliseconds per ground-distance unit for a deliberate short movement. */
  paceMsPerUnit?: number;
  /** This placement is inside a pulled-back camera's margin, rather than an exit. */
  insideCamera?: boolean;
  left: boolean;
  wave?: boolean;
  inspect?: boolean;
  pull?: boolean;
  carry?: boolean;
  /** Keep a held item during travel without replacing the stationary action pose. */
  holdingWalk?: boolean;
  /** Alternative carry atlas with two contact and two passing frames. */
  carryWalkFrames?: readonly [number, number, number, number];
  place?: boolean;
  /** Keep supporting the parcel briefly after it reaches the surface. */
  placeHoldMs?: number;
  shawl?: boolean;
  seated?: boolean;
  /** Chair-seated tea poses for Aria, Leon and Mira, with the cup in the atlas. */
  tea?: "hold" | "sip";
  /** Seated empty-hand poses; drinks and food remain separate stage items. */
  dining?: "hold" | "sip" | "reach";
  snackAction?: "idle" | "lap" | "split" | "offer" | "bite" | "reach" | "drink";
  /** Aria's glass wiping and low sickle strokes; the tool is in the cutting frames. */
  fieldWork?: "wipe" | "weed";
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
  sword?: boolean | "strike";
  push?: "brace" | "extend";
  /** Finn or Mira taps a door with two registered fist poses. */
  knock?: boolean;
  healing?: "treat" | "rise" | "steady";
  gloves?: "worn" | "remove";
  handAction?: "catch" | "guard" | "wipe" | "palm" | "pat-ready" | "pat-touch";
  /** Mira turns toward the far bank after checking Finn's hand. */
  lookAcross?: boolean;
  /** A stationary reach draws the hand in front of this prop. */
  reachOver?: string;
  /** Keep an intentional reach in front of its support during the final approach. */
  reachApproach?: number;
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
  /** A timed architectural change within the same registered camera. */
  scenery?: "tower-door-open";
  /** Finish a physical interaction before applying the next line's settled props. */
  finishBeforeAdvance?: boolean;
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
    | "tower-records"
    | "tower-base-moss"
    | "forest-floor"
    | "drain-blocked"
    | "drain-cleared"
    | "medicine-room"
    | "dining-room"
    | "brekka-dining-room"
    | "brekka-homes"
    | "brekka-foyer"
    | "brekka-fork"
    | "brekka-tower-path"
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
    | "transplant-path"
    | "registry"
    | "bridge-night"
    | "warehouse-office"
    | "patient-room"
    | "new-moss-beds";
  hideCart?: boolean;
  box?: "table" | "aria" | "high" | "shared";
  /** Registration correction for a separately authored box/hand pose, in stage percent. */
  boxOffset?: { x: number; bottom: number };
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
  scenery?: StoryStageCue["scenery"];
  after: number;
  actors: StageActor[];
  items: StageItem[];
  box?: StoryStageCue["box"];
  boxOffset?: StoryStageCue["boxOffset"];
  extras?: StageExtra[];
};

/** resizeMs eases deliberate size changes while the same item is transferred. */
export type StageItem = { resizeMs?: number } & {
  /** Optional artwork for the same registered object; geometry and ownership stay unchanged. */
  image?: string;
  /** Drop vertically from the rendered position, including after an early dialogue tap. */
  dropInPlace?: boolean;
  id: string;
  art:
    | "inspection-lid"
    | "inspection-glow"
    | "chalk-mark"
    | "moss"
    | "moss-jar"
    | "lantern"
    | "basket"
    | "tools"
    | "farm-hoe"
    | "rope-coil"
    | "slime"
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
    | "ale-cup-empty"
    | "ale-bottle"
    | "ale-cup-full"
    | "fruit-glass"
    | "ale-jug"
    | "teapot"
    | "teapot-open"
    | "tea-rock"
    | "brazier"
    | "kettle"
    | "medicine"
    | "medicine-closed"
    | "doctor-satchel"
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
    | "honey-cake-bitten"
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
    | "stone-lantern-closed-sooty"
    | "stone-lantern-empty"
    | "stone-lantern-closed-lit"
    | "roadside-grass"
    | "roadside-stubble"
    | "lamp-oil"
    | "oil-dish"
    | "plant-label"
    | "table"
    | "dining-table"
    | "chair"
    | "step-stool"
    | "record-board"
    | "paper"
    | "folded-paper"
    | "quill"
    | "dining-plate"
    | "lunch-plate"
    | "sealed-letter"
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
    | "korotake"
    | "korotake-rest"
    | "merrill-pot"
    | "merrill-pot-full"
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
    | "reflector-cover"
    | "reflector-cover-flat"
    | "key"
    | "juice"
    | "ale"
    | "sample-jar"
    | "handcart"
    | "puppet"
    | "golem"
    | "picnic-cloth"
    | "basket-cart"
    | "cart-wheel"
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
  /** Attach a hanging bag by its top, or a plate above the supporting palm. */
  wristAnchor?: "top" | "bottom";
  /** Offset from the palm in ground units for an item's actual gripping point. */
  wristOffset?: { x: number; bottom: number };
  /** Keep an authored work pose's hand orientation while its feet travel. */
  wristUnmirrored?: boolean;
  /** A deliberate change of grip eases the same object across the holder's body. */
  grip?: "receiving" | "offering";
  /** Contents remain attached to their container after being put away. */
  stored?: boolean;
  /** The same held item is already drawn in these conversation frames. */
  embeddedFrames?: number[];
  shaded?: boolean;
  /** Surface supporting or being touched by this object, independent of its height. */
  support?: string;
  tilt?: number;
  /** Turn a flat prop around its vertical axis, without changing its physical size. */
  turn?: number;
  /** Lay a prop toward the ground around its bottom edge, in degrees. */
  pitch?: number;
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
