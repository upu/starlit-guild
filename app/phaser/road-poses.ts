import type Phaser from "phaser";
import type { RoadBattle, Traveller } from "@/lib/road-view";
import {
  adventureHeroArt,
  adventureHeroAsset,
  adventureHeroFrames,
  adventureRoadPose,
} from "@/lib/adventure-hero-art";

export function registerAdventureHero(scene: Phaser.Scene, id: Traveller["id"]) {
  const texture = scene.textures.get(adventureHeroAsset(id));
  if (!texture.has("0")) {
    const cell = adventureHeroArt.cell;
    for (let frame = 0; frame < adventureHeroArt.frames; frame++)
      texture.add(String(frame), 0, (frame % 4) * cell, Math.floor(frame / 4) * cell, cell, cell);
    // Phaser's NEAREST sampler, also used by the home sprites.
    texture.setFilter(0);
  }
}

function applyPixelPose(
  image: Phaser.GameObjects.Image,
  id: Traveller["id"],
  frame: number,
  size: number,
) {
  registerAdventureHero(image.scene, id);
  image
    .setTexture(adventureHeroAsset(id), String(frame))
    .setOrigin(0.5, adventureHeroArt.foot / adventureHeroArt.cell)
    .setScale((size * 0.9) / adventureHeroArt.height);
}

export function applyHeroPose(
  image: Phaser.GameObjects.Image,
  id: Traveller["id"],
  pose: string,
  size: number,
) {
  applyPixelPose(image, id, adventureRoadPose(pose), size);
}

function workKind(point: RoadBattle["gathering"], pulling: boolean) {
  if (!point) return null;
  if (point.task === "pack" || point.task === "unload") return "pack";
  if (point.kind !== "cargo" || point.task !== "carry") return null;
  return pulling ? "pull" : "push";
}

export function applyWorkPose(
  image: Phaser.GameObjects.Image,
  state: RoadBattle,
  hero: Traveller,
  reduced: boolean,
  size: number,
  pulling: boolean,
) {
  const kind = workKind(state.gathering, pulling);
  if (!kind) return false;
  const moving = !reduced && !state.enemies.some((enemy) => enemy.hp > 0);
  const step = moving ? Math.floor(state.time / (kind === "pack" ? 750 : 220)) % 2 : 0;
  applyPixelPose(image, hero.id, adventureHeroFrames[kind] + step, size);
  return true;
}
