import type Phaser from "phaser";
import {
  applyStorybookRoadPose,
  applyStorybookWork,
  storybookRoadHeroIds,
} from "./road-storybook-poses";
import type { RoadBattle, Traveller } from "@/lib/road-view";
import { foundingCartAsset } from "@/lib/road-founding-formation";
import { foundingPullAsset, foundingPullRestAsset } from "@/lib/road-founding-grip";
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
  storybook = false,
  strideFrame?: number,
) {
  if (
    storybook &&
    storybookRoadHeroIds.includes(id) &&
    pose.startsWith("walk-") &&
    strideFrame !== undefined
  )
    pose = `walk-${String(strideFrame)}`;
  if (storybook && applyStorybookRoadPose(image, id, pose, size)) return;
  applyPixelPose(image, id, adventureRoadPose(pose), size);
}

function workKind(point: RoadBattle["gathering"], pulling: boolean) {
  if (!point) return null;
  if (point.task === "pack" || point.task === "unload") return "pack";
  if (point.kind !== "cargo" || point.task !== "carry") return null;
  return pulling ? "pull" : "push";
}
function paintedGatherKind(storybook: boolean, profile: string | undefined, task?: string) {
  if (!storybook || task !== "gather") return null;
  if (profile === "earthwork") return "gather";
  return ["herb", "moss", "waterway-branches"].includes(profile ?? "") ? "forage" : null;
}
function staticInspectKind(storybook: boolean, profile: string | undefined, task?: string) {
  return storybook &&
    task === "inspect" &&
    ["signpost", "homeward-route", "waterway-bank"].includes(profile ?? "")
    ? "inspect"
    : null;
}

function workAnimationMoves(state: RoadBattle, hero: Traveller, reduced: boolean) {
  return !reduced && !(state.journeyCart && !hero.walking) && !state.enemies.some((e) => e.hp > 0);
}
function foundingPullOverride(state: RoadBattle, hero: Traveller, kind: string, moving: boolean) {
  return hero.id === "finn" && kind === "pull" && state.journeyCart?.asset === foundingCartAsset
    ? moving
      ? foundingPullAsset
      : foundingPullRestAsset
    : undefined;
}
export function applyWorkPose(
  image: Phaser.GameObjects.Image,
  state: RoadBattle,
  hero: Traveller,
  reduced: boolean,
  size: number,
  pulling: boolean,
  storybook = false,
  strideFrame?: number,
  profile?: string,
) {
  const kind =
    paintedGatherKind(storybook, profile, state.gathering?.task) ??
    staticInspectKind(storybook, profile, state.gathering?.task) ??
    workKind(state.gathering, pulling);
  if (!kind) return false;
  const moving = workAnimationMoves(state, hero, reduced);
  if (
    storybook &&
    applyStorybookWork(
      image,
      hero.id,
      kind,
      paintedWorkFrame(kind, state.time, moving, strideFrame),
      size,
      foundingPullOverride(state, hero, kind, moving),
    )
  )
    return true;
  if (kind === "gather" || kind === "forage" || kind === "inspect") return false;
  const step = moving ? Math.floor(state.time / (kind === "pack" ? 750 : 220)) % 2 : 0;
  applyPixelPose(image, hero.id, adventureHeroFrames[kind] + step, size);
  return true;
}

function paintedWorkFrame(kind: string, time: number, moving: boolean, strideFrame?: number) {
  if (kind === "gather" || kind === "forage") return moving ? 1 + (Math.floor(time / 650) % 3) : 1;
  if (!moving) return 0;
  if (kind === "pack") return Math.floor(time / 750) % 4;
  return strideFrame ?? Math.floor(time / 110) % 4;
}
