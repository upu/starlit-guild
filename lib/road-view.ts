// Read-only display data for the chapter battle renderer.
export type TravellerId = "aria" | "leon" | "mira" | "finn" | "lico";
export type Traveller = {
  id: TravellerId;
  hp: number;
  maxHp: number;
  x: number;
  lane: number;
  walking: boolean;
  facing: 1 | -1;
  paralyzed?: boolean;
  /** A post-battle visual transition; the actual HP remains unchanged. */
  recordsRecovery?: "resting" | "rising-low" | "rising-high" | "ready";
};
export const roadTravellerCanMove = (hero: Traveller) =>
  hero.hp > 0 || hero.recordsRecovery === "ready";
export type RoadEnemy = {
  kind: "slime" | "puppet" | "golem" | "pumpety" | "lico" | "merrill" | "mushroom";
  id: number;
  x: number;
  lane: number;
  hp: number;
  maxHp: number;
  boss: boolean;
  action?: import("./chapter-four-battles.ts").BattleCue | "command" | "rally";
  actionAt?: number;
  attack?: "windup" | "strike";
  alpha?: number;
  facing?: 1 | -1;
  appearsAt?: number;
  pose?: "fallen" | "retreat" | "enter" | "drag";
};
export type RoadEffect = {
  id: number;
  at: number;
  kind:
    | "arrow"
    | "slash"
    | "hurt"
    | "assist"
    | "gather"
    | "heal"
    | "magic"
    | "command"
    | "mushroomThrow"
    | "song"
    | "paralyze";
  x: number;
  lane: number;
  amount: number;
  hero?: TravellerId;
  wide?: boolean;
  fromX?: number;
  fromLane?: number;
};
export type RoadBattle = {
  /** Render-only lift progress for the shared 1-3 delivery box. */
  townParcelLift?: number;
  townParcelLiftHeight?: number;
  townSoloCarrier?: "aria" | "leon";
  townParcelHandoff?: boolean;
  townParcelDestination?: number;
  townNextWarehouseX?: number;
  townTransitionFade?: number;
  townVisualComplete?: boolean;
  mossVisualComplete?: boolean;
  forestVisualComplete?: boolean;
  waterwaySearchVisualComplete?: boolean;
  waterwayActions?: import("./road-waterway-contacts.ts").WaterwayActions;
  journeyCart?: import("./road-journey-cart.ts").JourneyCart;
  handheld?: import("./road-handheld.ts").HandheldItem[];
  stage: "forest" | "puppets";
  scene?: import("./road-scenes.ts").RoadSceneKind;
  sceneProgress?: number;
  time: number;
  distance: number;
  gathering: {
    lane?: number;
    kind: "herb" | "cargo";
    task: "gather" | "pack" | "carry" | "unload" | "inspect";
    x: number;
    remaining: number;
    total: number;
  } | null;
  phase: "journey" | "rest" | "arrived";
  heroes: Traveller[];
  enemies: RoadEnemy[];
  effects: RoadEffect[];
};
export const travellerLane = (id: TravellerId) =>
  ({ aria: 0.54, leon: 0.82, mira: 0.68, finn: 0.43, lico: 0.63 })[id];
