import type Phaser from "phaser";
import type { RoadEffect } from "@/lib/road-view";
export const duelEffect = (kind: RoadEffect["kind"]) =>
  ["mushroomThrow", "song", "paralyze"].includes(kind);
export function paintDuelEffect(
  sprite: Phaser.GameObjects.Image,
  effect: RoadEffect,
  age: number,
  scale: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  if (!duelEffect(effect.kind)) return false;
  if (effect.kind === "mushroomThrow") {
    const p = Math.min(1, age / 800);
    sprite
      .setTexture("/animations/road/mushroom-v1.webp")
      .setDisplaySize(36 * scale, 36 * scale)
      .setPosition(
        startX + (endX - startX) * p,
        startY + (endY - startY) * p - Math.sin(p * Math.PI) * 60 * scale,
      )
      .setRotation(p * Math.PI * 2)
      .setAlpha(age < 800 ? 1 : 0);
  } else {
    sprite
      .setPosition(endX, endY)
      .setDisplaySize(85 * scale, 85 * scale)
      .setTint(effect.kind === "song" ? 0xa4ffb4 : 0xffe18a)
      .setAlpha(Math.max(0, 0.7 * (1 - age / 1800)))
      .setRotation(age / 700);
  }
  return true;
}
