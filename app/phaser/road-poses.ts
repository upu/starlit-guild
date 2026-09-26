import type Phaser from "phaser";
import type { RoadBattle, Traveller } from "@/lib/road-view";
import {
  roadFrame,
  roadSheet,
  roadWalkFrame,
  roadWalkSheet,
  ROAD_PACKING,
  ROAD_PUSH,
  ROAD_PULL,
  ROAD_FINN_PULL,
  ROAD_LICO_MOTION,
  licoMotionFrames,
} from "./road-art";

function applyLicoMotion(image: Phaser.GameObjects.Image, pose: number, size: number) {
  // Lico may join after the painter was created; register the atlas on its first use.
  const texture = image.scene.textures.get(ROAD_LICO_MOTION);
  if (!texture.has("0"))
    for (const [index, [x, y, w, h]] of licoMotionFrames.entries())
      texture.add(String(index), 0, x, y, w, h);
  image
    .setTexture(ROAD_LICO_MOTION, String(pose))
    .setOrigin(0.5, 1)
    .setScale(size * roadWalkFrame("lico", pose).scale);
}

function applyMiraPose(image: Phaser.GameObjects.Image, pose: number, size: number) {
  const kneeling = [9, 10, 14, 15].includes(pose);
  image
    .setTexture(roadSheet("mira"), String(pose))
    .setOrigin(0.5, 1)
    .setScale((size * (kneeling ? 0.72 : 0.9)) / image.frame.height);
}

function applyLicoPose(image: Phaser.GameObjects.Image, pose: number, size: number) {
  if (pose < 4) {
    applyLicoMotion(image, pose % 2, size);
    return;
  }
  image
    .setTexture(roadSheet("lico"))
    .setOrigin(0.5, 1)
    .setScale((size * 0.9) / image.frame.height);
}

function applyFinnPose(image: Phaser.GameObjects.Image, pose: string, size: number) {
  const crouching = [9, 10, 14, 15].includes(Number(pose));
  image
    .setTexture(roadSheet("finn"), pose)
    .setOrigin(0.5, 1)
    .setScale((size * (crouching ? 0.72 : 0.9)) / image.frame.height);
}
export function applyHeroPose(
  image: Phaser.GameObjects.Image,
  id: Traveller["id"],
  pose: string,
  size: number,
) {
  if (id === "lico") {
    applyLicoPose(image, Number(pose), size);
    return;
  }
  if (id === "finn") {
    applyFinnPose(image, pose, size);
    return;
  }
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

function workKind(state: RoadBattle, pulling: boolean) {
  const point = state.gathering;
  if (!point) return null;
  if (point.task === "pack" || point.task === "unload") return "pack";
  return point.kind === "cargo" && point.task === "carry" ? (pulling ? "pull" : "push") : null;
}

export function applyWorkPose(
  image: Phaser.GameObjects.Image,
  state: RoadBattle,
  hero: Traveller,
  reduced: boolean,
  size: number,
  pulling: boolean,
) {
  const kind = workKind(state, pulling);
  if (!kind) return false;
  const pose = {
    pack: { duration: 750, mira: 14, asset: ROAD_PACKING, height: 0.72 },
    push: { duration: 220, mira: 12, asset: ROAD_PUSH, height: 0.9 },
    pull: { duration: 220, mira: 12, asset: ROAD_PULL, height: 0.9 },
  }[kind];
  const moving = !reduced && !state.enemies.some((enemy) => enemy.hp > 0);
  const step = moving ? Math.floor(state.time / pose.duration) % 2 : 0;
  if (hero.id === "lico") {
    if (kind === "push") applyLicoMotion(image, 2 + step, size);
    else applyHeroPose(image, hero.id, "8", size);
    return true;
  }
  if (applyExistingWorkPose(image, hero, kind, pose.mira, step, size)) return true;
  image
    .setTexture(hero.id === "finn" ? ROAD_FINN_PULL : pose.asset, `${hero.id}-${String(step)}`)
    .setOrigin(0.5, 1)
    .setScale((size * pose.height) / image.frame.height);
  return true;
}

function applyExistingWorkPose(
  image: Phaser.GameObjects.Image,
  hero: Traveller,
  kind: "pack" | "push" | "pull",
  mira: number,
  step: number,
  size: number,
) {
  if (kind === "pull") return false;
  if (hero.id === "finn") {
    applyHeroPose(image, hero.id, String((kind === "push" ? 12 : 14) + step), size);
    return true;
  }
  if (hero.id !== "mira") return false;
  applyMiraPose(image, mira + step, size);
  return true;
}
