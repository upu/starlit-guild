import type { RoadBattle, RoadEnemy } from "./road-view.ts";
import { roadScale, roadDepth } from "./road-layout.ts";
import { enemyDisplayHeight } from "./road-enemy-layout.ts";
import { RPG_CAMERA_SCALE } from "./rpg-camera.ts";

/** Registered hand/shoulder contacts share the same scale and flip as their figures. */
export function puppetStringContacts(
  state: RoadBattle,
  width: number,
  height: number,
  painted = false,
) {
  const master = state.enemies.find((e) => e.kind === "pumpety");
  if (state.scene !== "escape" || !master) return [];
  const from = contact(master, state, width, height, painted, true);
  return state.enemies
    .filter((e) => e.pose === "drag")
    .map((enemy) => ({ from, to: contact(enemy, state, width, height, painted, false) }));
}
function contact(
  enemy: RoadEnemy,
  state: RoadBattle,
  width: number,
  height: number,
  painted: boolean,
  master: boolean,
) {
  if (!painted)
    return {
      x: enemy.x,
      lane: enemy.lane - ((master ? 25 : 30) * RPG_CAMERA_SCALE) / roadDepth(width, height),
    };
  const size = enemyDisplayHeight(enemy, width, height),
    direction = enemy.facing ?? 1;
  const dx = master ? ((direction * 9) / 78) * size : ((-direction * 44) / 384) * size;
  const dy = master ? (-38 / 78) * size : (-150 / 384) * size;
  return {
    x: enemy.x + dx / roadScale(width, state.stage),
    lane: enemy.lane + dy / roadDepth(width, height),
  };
}
