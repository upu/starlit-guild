import type Phaser from "phaser";
import type { RoadBattle, RoadEffect } from "@/lib/scrolling-battle";
import { ROAD_EFFECTS } from "./road-art";

const frames = { arrow: 0, slash: 1, magic: 2, heal: 2, gather: 3, assist: 1, hurt: 1 };

export class RoadEffects {
  private sprites = new Map<number, Phaser.GameObjects.Image>();
  constructor(private scene: Phaser.Scene) {
    const texture = scene.textures.get(ROAD_EFFECTS);
    const source = texture.getSourceImage() as HTMLImageElement;
    const side = Math.floor(source.width / 2);
    for (let index = 0; index < 4; index++)
      texture.add(String(index), 0, (index % 2) * side, Math.floor(index / 2) * side, side, side);
  }

  paint(state: RoadBattle, reduced: boolean, screenX: (x: number) => number) {
    const visible = state.effects.filter(
      (effect) =>
        !reduced &&
        effect.kind !== "hurt" &&
        state.time >= effect.at &&
        state.time - effect.at < 600,
    );
    for (const [id, sprite] of this.sprites) {
      if (visible.some((effect) => effect.id === id)) continue;
      sprite.destroy();
      this.sprites.delete(id);
    }
    for (const effect of visible) this.paintOne(state, effect, screenX);
  }

  private paintOne(state: RoadBattle, effect: RoadEffect, screenX: (x: number) => number) {
    let sprite = this.sprites.get(effect.id);
    if (!sprite) {
      sprite = this.scene.add.image(0, 0, ROAD_EFFECTS, String(frames[effect.kind])).setDepth(40);
      this.sprites.set(effect.id, sprite);
    }
    const age = state.time - effect.at;
    const scale = Math.min(1, this.scene.scale.width / 620);
    const endX = screenX(effect.x),
      endY = effect.lane * this.scene.scale.height - 24 * scale;
    const startX = screenX(effect.fromX ?? effect.x),
      startY = (effect.fromLane ?? effect.lane) * this.scene.scale.height - 28 * scale;
    const projectile = effect.kind === "arrow" || effect.kind === "magic";
    const progress = projectile ? Math.min(1, age / 240) : 1;
    sprite.setPosition(startX + (endX - startX) * progress, startY + (endY - startY) * progress);
    const size = (effect.wide ? 145 : 110) * scale;
    sprite.setDisplaySize(size, size).setAlpha(Math.min(1, age / 60) * (1 - age / 600));
    if (effect.kind === "arrow") sprite.setRotation(Math.atan2(endY - startY, endX - startX));
    if (effect.kind === "slash")
      sprite.setFlipX(endX < startX).setRotation((age / 600 - 0.5) * 0.6);
  }
}
