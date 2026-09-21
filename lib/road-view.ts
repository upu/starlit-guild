// Read-only display data for the chapter battle renderer.
export type TravellerId = "aria" | "leon" | "mira";
export type Traveller = {
  id: TravellerId;
  hp: number;
  maxHp: number;
  x: number;
  walking: boolean;
  facing: 1 | -1;
};
export type RoadEnemy = {
  kind: "slime" | "puppet" | "golem" | "pumpety";
  id: number;
  x: number;
  lane: number;
  hp: number;
  maxHp: number;
  boss: boolean;
  pose?: "fallen" | "retreat" | "enter" | "drag";
};
export type RoadEffect = {
  id: number;
  at: number;
  kind: "arrow" | "slash" | "hurt" | "assist" | "gather" | "heal" | "magic" | "command";
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
export const travellerLane = (id: TravellerId) => ({ aria: 0.54, leon: 0.82, mira: 0.68 })[id];
