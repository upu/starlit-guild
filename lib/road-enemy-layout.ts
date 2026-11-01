import type { RoadEnemy } from "./road-view.ts";
import { roadHeroSize } from "./road-layout.ts";
import { RPG_CAMERA_SCALE } from "./rpg-camera.ts";

const enemySize = (enemy: Pick<RoadEnemy, "kind" | "boss">) =>
  ({
    puppet: 0.45,
    pumpety: 0.76,
    golem: 1.65,
    slime: enemy.boss ? 1.65 : 0.75,
    lico: 1,
    merrill: 1,
    mushroom: 0.42,
  })[enemy.kind];

/** Shared physical height for the figure, its HP bar, and an impact on its body. */
export function enemyDisplayHeight(
  enemy: Pick<RoadEnemy, "kind" | "boss">,
  width: number,
  height: number,
) {
  if (enemy.kind === "pumpety") return roadHeroSize(width, height) * 0.9 * 0.76;
  if (enemy.kind === "lico" || enemy.kind === "merrill") return roadHeroSize(width, height) * 0.9;
  return RPG_CAMERA_SCALE * Math.min(115, width * 0.19, height * 0.32) * enemySize(enemy);
}
