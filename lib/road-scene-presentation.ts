import type { Run } from "./game-types.ts";
import type { RoadBattle, RoadEnemy } from "./road-view.ts";
import { roadSceneDuration, type RoadSceneKind } from "./road-scenes.ts";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
export function presentRoadScene(
  battle: RoadBattle,
  run: Run | null,
  now: number,
  reduced = false,
  worldWidth = 1400,
) {
  if (run?.quest !== "sweet-blockade" || run.nodes !== 3 || !run.road) return;
  for (const enemy of battle.enemies) if (enemy.hp <= 0 && run.node > 0) enemy.pose = "fallen";
  const scene = run.road.scene;
  if (!scene) return;
  battle.scene = scene.kind;
  battle.effects = [];
  const progress = reduced
    ? { withdraw: 0, enter: 1, escape: 0.22 }[scene.kind]
    : clamp((now - scene.at) / roadSceneDuration[scene.kind]);
  const travel = Math.max(
    worldWidth,
    battle.distance + worldWidth - Math.min(...battle.enemies.map((e) => e.x)),
  );
  const anchor = Math.max(battle.distance + 340, ...battle.enemies.map((e) => e.x));
  for (const hero of battle.heroes) hero.walking = false;
  for (const enemy of battle.enemies)
    poseEnemy(enemy, scene.kind, progress, travel, anchor, worldWidth);
}
function poseEnemy(
  enemy: RoadEnemy,
  kind: RoadSceneKind,
  progress: number,
  travel: number,
  anchor: number,
  worldWidth: number,
) {
  if (kind === "enter") {
    enemy.pose = "enter";
    enemy.x += worldWidth * (1 - progress) ** 2;
  } else if (kind === "withdraw") {
    enemy.pose = "retreat";
    enemy.x += travel * clamp((progress - 0.12) / 0.76) ** 1.35;
  } else {
    enemy.pose = enemy.kind === "pumpety" ? "retreat" : "drag";
    const slot = enemy.kind === "pumpety" ? 0 : enemy.kind === "golem" ? 200 : 100;
    enemy.x += (anchor - slot - enemy.x) * clamp(progress / 0.22);
    enemy.x += travel * clamp((progress - 0.22) / 0.78) ** 1.35;
  }
}
