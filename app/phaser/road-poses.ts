import type Phaser from "phaser";
import type { RoadBattle, Traveller } from "@/lib/road-view";
import {
  roadFrame,
  roadSheet,
  roadWalkFrame,
  roadWalkSheet,
  ROAD_PACKING,
  ROAD_PUSH,
} from "./road-art";

function applyMiraPose(image: Phaser.GameObjects.Image, pose: number, size: number) {
  const kneeling = [9, 10, 14, 15].includes(pose);
  image
    .setTexture(roadSheet("mira"), String(pose))
    .setOrigin(0.5, 1)
    .setScale((size * (kneeling ? 0.72 : 0.9)) / image.frame.height);
}

export function applyHeroPose(
  image: Phaser.GameObjects.Image,
  id: Traveller["id"],
  pose: string,
  size: number,
) {
  if (id === "mira" && Number(pose) >= 4) {
    applyMiraPose(image, Number(pose), size);
    return;
  }
  const frame = roadFrame(id, Number(pose));
  const walking = Number(pose) < 4;
  const asset = walking ? roadWalkSheet(id) : roadSheet(id);
  const walk = walking ? roadWalkFrame(id, Number(pose)) : null;
  if (image.texture.key !== asset) image.setTexture(asset, pose);
  else if (image.frame.name !== pose) image.setFrame(pose);
  image
    .setScale(walk ? size * walk.scale : size / 362)
    .setOrigin(walk?.originX ?? frame.originX, walk?.originY ?? frame.originY);
}

function workKind(state: RoadBattle) {
  const point = state.gathering;
  if (!point) return null;
  if (point.task === "pack" || point.task === "unload") return "pack";
  return point.kind === "cargo" && point.task === "carry" ? "push" : null;
}

export function applyWorkPose(
  image: Phaser.GameObjects.Image,
  state: RoadBattle,
  hero: Traveller,
  reduced: boolean,
  size: number,
) {
  const kind = workKind(state);
  if (!kind) return false;
  const pose = {
    pack: { duration: 750, mira: 14, asset: ROAD_PACKING, height: 0.72 },
    push: { duration: 220, mira: 12, asset: ROAD_PUSH, height: 0.9 },
  }[kind];
  const moving = !reduced && !state.enemies.some((enemy) => enemy.hp > 0);
  const step = moving ? Math.floor(state.time / pose.duration) % 2 : 0;
  if (hero.id === "mira") applyMiraPose(image, pose.mira + step, size);
  else
    image
      .setTexture(pose.asset, `${hero.id}-${String(step)}`)
      .setOrigin(0.5, 1)
      .setScale((size * pose.height) / image.frame.height);
  return true;
}
