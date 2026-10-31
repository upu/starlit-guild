/** Supporting people share the stage's 128px hand and foot registration. */
export type StageExtra = {
  /** Optional four registered gait frames for an alternative atlas. */
  walkFrames?: readonly [number, number, number, number];
  /** Registered hand centers for an alternative atlas, in its 128px cells. */
  wristPoints?: Partial<Record<number, [number, number]>>;
  /** Only the registered hand rectangle reaches in front of this prop. */
  handOver?: { item: string; rect: [number, number, number, number] };
  seedlingAction?: "pick" | "taste" | "play" | "receive" | "stow" | "collect" | "pot";
  deskWork?: "reach" | "write" | "hold" | "count" | "stow";
  pullCart?: boolean;
  notebook?: boolean;
  doctorBag?: "nod" | "grasp" | "lift" | "hold";
  wiping?: boolean;
  oilPour?: boolean;
  showNotebook?: boolean;
  restoration?: "trace" | "touch" | "read" | "receive";
  /** Empty-palm pickup and offer of the repair basket, using a registered keeper strip. */
  basketHandoff?: "idle" | "reach" | "lift" | "offer";
  hatchMark?: "idle" | "touch" | "stroke" | "rest";
  hatchOpening?: "idle" | "grip" | "lift" | "hold";
  lanternHandling?: "low" | "rise" | "lift" | "hold";
  towerSignal?: "look" | "point";
  /** Merchant turns the unloaded tool in registered empty-palm poses. */
  unloading?: "reach" | "idle" | "front" | "right";
  service?: "carry" | "place" | "raise" | "talk";
  kitchen?: "pot" | "lid" | "inspect" | "cloth";
  care?: "sore" | "palm" | "bandaged" | "rest";
  grip?: "reach" | "hold";
  limp?: boolean;
  hatGreeting?: boolean | "lower";
  dining?: "hold" | "sip" | "reach";
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
  /** A point inside the pulled-back view can lie outside the original 0–100 world. */
  insideCamera?: boolean;
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
