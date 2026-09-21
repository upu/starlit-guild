import type { Run } from "./game-types.ts";

export type RoadSceneKind = "withdraw" | "enter" | "escape";
export const roadSceneDuration = { withdraw: 2400, enter: 2000, escape: 3200 };
export function startRoadScene(r: Run, kind: RoadSceneKind, at: number) {
  const road = r.road;
  if (!road) return;
  const duration = roadSceneDuration[kind];
  r.scene = null;
  road.scene = { kind, at };
  road.at = road.previousAt = at;
  road.previousCamera = road.camera;
  for (const position of [...Object.values(road.members), ...Object.values(road.opponents)]) {
    position.previousX = position.x;
    position.walking = false;
    position.recoil = 0;
  }
  for (const actor of r.actors) actor.nextAt = Math.max(at, actor.nextAt) + duration;
  for (const enemy of r.enemies || []) enemy.nextAt = Math.max(at, enemy.nextAt) + duration;
  r.enemyAt = Math.max(at, r.enemyAt) + duration;
  r.comboAt = Math.max(at, r.comboAt) + duration;
  road.nextAt = r.nextAt = at + duration;
}
export function beginRoadExit(r: Run, at: number) {
  if (!r.road || r.quest !== "sweet-blockade" || r.nodes !== 3 || r.node === 0) return false;
  startRoadScene(r, r.node === 1 ? "withdraw" : "escape", at);
  return true;
}

// Keep saved transitions bounded and tied to their actual encounter and clocks.
export function validRoadScene(r: Run) {
  const scene = r.road?.scene;
  if (!scene) return true;
  if (r.quest !== "sweet-blockade" || r.nodes !== 3 || r.phase === "rest") return false;
  if (scene.at < r.phaseAt || scene.at + roadSceneDuration[scene.kind] !== r.nextAt) return false;
  if (scene.kind === "enter") return r.node === 2 && r.target > 0;
  return r.node === (scene.kind === "withdraw" ? 1 : 2) && r.target === 0;
}
