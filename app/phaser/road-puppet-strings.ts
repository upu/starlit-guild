import type Phaser from "phaser";
import type { RoadBattle } from "@/lib/road-view";
import { roadY } from "@/lib/road-layout";
import { RPG_CAMERA_SCALE } from "@/lib/rpg-camera";
import { puppetStringContacts } from "@/lib/road-puppet-strings";

export function paintPuppetStrings(
  graphics: Phaser.GameObjects.Graphics,
  state: RoadBattle,
  height: number,
  width: number,
  screenX: (x: number) => number,
  painted = false,
) {
  graphics.clear();
  const widthPx = painted ? Math.max(0.8, width / 800) : 2;
  graphics.lineStyle(widthPx, painted ? 0x78614b : 0xf1d699, painted ? 0.8 : 0.9);
  for (const { from, to } of puppetStringContacts(state, width, height, painted)) {
    const fromX = screenX(from.x),
      fromY = roadY(from.lane, height, width);
    const toX = screenX(to.x),
      toY = roadY(to.lane, height, width);
    graphics.beginPath();
    graphics.moveTo(fromX, fromY);
    if (painted) graphics.lineTo((fromX + toX) / 2, (fromY + toY) / 2 + 3 * RPG_CAMERA_SCALE);
    graphics.lineTo(toX, toY);
    graphics.strokePath();
  }
}
