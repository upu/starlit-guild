import type Phaser from "phaser";
import type { RoadBattle } from "@/lib/road-view";
import { roadY } from "@/lib/road-layout";
import { RPG_CAMERA_SCALE } from "@/lib/rpg-camera";

export function paintPuppetStrings(
  graphics: Phaser.GameObjects.Graphics,
  state: RoadBattle,
  height: number,
  width: number,
  screenX: (x: number) => number,
) {
  graphics.clear();
  if (state.scene !== "escape") return;
  const master = state.enemies.find((enemy) => enemy.kind === "pumpety");
  if (!master) return;
  const fromX = screenX(master.x),
    fromY = roadY(master.lane, height, width) - 25 * RPG_CAMERA_SCALE;
  graphics.lineStyle(2, 0xf1d699, 0.9);
  for (const enemy of state.enemies.filter((enemy) => enemy.pose === "drag")) {
    graphics.beginPath();
    graphics.moveTo(fromX, fromY);
    graphics.lineTo(screenX(enemy.x), roadY(enemy.lane, height, width) - 30 * RPG_CAMERA_SCALE);
    graphics.strokePath();
  }
}
