import type Phaser from "phaser";
import type { RoadEffect } from "@/lib/road-view";
export const duelEffect = (kind: RoadEffect["kind"]) =>
  ["mushroomThrow", "song", "paralyze"].includes(kind);
export function paintDuelEffect(
  notes: Phaser.GameObjects.Graphics,
  sprite: Phaser.GameObjects.Image,
  effect: RoadEffect,
  age: number,
  scale: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  reduced: boolean,
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
  } else paintAura(notes, sprite, effect, age, scale, endX, endY, reduced);
  return true;
}

function paintAura(
  notes: Phaser.GameObjects.Graphics,
  sprite: Phaser.GameObjects.Image,
  effect: RoadEffect,
  age: number,
  scale: number,
  x: number,
  y: number,
  reduced: boolean,
) {
  sprite
    .setPosition(x, y)
    .setDisplaySize(85 * scale, 85 * scale)
    .setTint(effect.kind === "song" ? 0xa4ffb4 : 0xffe18a)
    .setAlpha(reduced ? 0.45 : Math.max(0, 0.7 * (1 - age / 1800)))
    .setRotation(reduced ? 0 : age / 700);
  if (effect.kind === "song") paintSongNotes(notes, x, y, age, scale, reduced);
}

function paintSongNotes(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  age: number,
  scale: number,
  reduced: boolean,
) {
  const alpha = reduced ? 0.8 : Math.min(1, age / 160) * Math.min(1, (1800 - age) / 300);
  for (let i = 0; i < 3; i++) {
    const rise = reduced ? 0 : ((age / 1800 + i * 0.18) % 1) * 32;
    const nx = x + (i - 1) * 22 * scale,
      ny = y - (25 + rise) * scale;
    g.fillStyle(i % 2 ? 0xffdb86 : 0xb8ffbf, alpha);
    g.lineStyle(Math.max(1.5, 2.5 * scale), i % 2 ? 0xffdb86 : 0xb8ffbf, alpha);
    g.fillEllipse(nx, ny, 9 * scale, 6 * scale);
    g.lineBetween(nx + 4 * scale, ny, nx + 4 * scale, ny - 18 * scale);
    g.lineBetween(nx + 4 * scale, ny - 18 * scale, nx + 12 * scale, ny - 13 * scale);
  }
}
