export type RoadPosition = {
  x: number;
  previousX: number;
  recoil: number;
  walking: boolean;
  facing: 1 | -1;
};
export type ChapterRoad = {
  version: 1;
  at: number;
  previousAt: number;
  nextAt: number;
  camera: number;
  previousCamera: number;
  members: Record<string, RoadPosition>;
  opponents: Record<string, RoadPosition>;
  ambushNode?: number;
  scene?: { kind: import("./road-scenes.ts").RoadSceneKind; at: number };
};
