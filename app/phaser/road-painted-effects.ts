import type Phaser from "phaser";
import type { RoadBattle, RoadEffect } from "@/lib/road-view";
import { STORYBOOK_EFFECTS, paintedEffectLayout } from "@/lib/road-effect-layout";

export function paintPaintedEffect(
  image: Phaser.GameObjects.Image,
  state: RoadBattle,
  effect: RoadEffect,
  width: number,
  height: number,
  screenX: (x: number) => number,
) {
  const layout = paintedEffectLayout(state, effect, width, height, screenX);
  if (!layout) return false;
  const texture = image.scene.textures.get(STORYBOOK_EFFECTS);
  if (!texture.has("0")) {
    for (let frame = 0; frame < 4; frame++) texture.add(String(frame), 0, frame * 256, 0, 256, 256);
    texture.setFilter(1);
  }
  image
    .setTexture(STORYBOOK_EFFECTS, String(layout.frame))
    .setOrigin(0.5)
    .setPosition(layout.x, layout.y)
    .setDisplaySize(layout.size, layout.size)
    .setAlpha(layout.alpha)
    .setRotation(layout.rotation)
    .setTint(layout.tint)
    .setFlipX(layout.flipX)
    .setDepth(layout.depth);
  return true;
}
