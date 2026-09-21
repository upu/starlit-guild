import type Phaser from "phaser";
import type { RoadBattle } from "@/lib/road-view";
import { roadY } from "@/lib/road-layout";

export function paintPuppetStrings(
  graphics: Phaser.GameObjects.Graphics,
  state: RoadBattle,
  height: number,
  screenX: (x: number) => number,
) {
  graphics.clear();
  if (state.scene !== "escape") return;
  const master = state.enemies.find((enemy) => enemy.kind === "pumpety");
  if (!master) return;
  const fromX = screenX(master.x),
    fromY = roadY(master.lane, height) - 25;
  graphics.lineStyle(2, 0xf1d699, 0.9);
  for (const enemy of state.enemies.filter((enemy) => enemy.pose === "drag")) {
    graphics.beginPath();
    graphics.moveTo(fromX, fromY);
    graphics.lineTo(screenX(enemy.x), roadY(enemy.lane, height) - 30);
    graphics.strokePath();
  }
}
