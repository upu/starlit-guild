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
};
export type RoadEnemy = {
  kind: "slime" | "puppet" | "golem" | "pumpety" | "lico" | "merrill" | "mushroom";
  id: number;
  x: number;
  lane: number;
  hp: number;
  maxHp: number;
  boss: boolean;
  action?: import("./chapter-four-battles.ts").BattleCue;
  actionAt?: number;
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
  stage: "forest" | "puppets";
  scene?: import("./road-scenes.ts").RoadSceneKind;
  time: number;
  distance: number;
  gathering: {
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
