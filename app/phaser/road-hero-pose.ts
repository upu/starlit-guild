import type Phaser from "phaser";
export function faceRoadHero(image: Phaser.GameObjects.Image, facing: number) {
  image
    .setFlipX(facing < 0)
    .setOrigin(facing < 0 ? 1 - image.originX : image.originX, image.originY);
}
import type { RoadBattle, Traveller, RoadEffect } from "@/lib/road-view";
import { roadTravellerCanMove } from "@/lib/road-view";
import type { RoadLook } from "@/lib/chapter-road-presentation";
import { handheldFrame, nightHandheld, type HandheldItem } from "@/lib/road-handheld";
import { picnicHandheld } from "@/lib/road-picnic";
import { journeyCartWorkState } from "@/lib/road-journey-cart";
import { roadInjuryPose } from "@/lib/road-injury-pose";
import { foundingPullRestAsset } from "@/lib/road-founding-grip";
import { paintTownParcelHero } from "./road-town-parcel";
import { applyHeroPose, applyWorkPose } from "./road-poses";
import {
  applyStorybookHandheldPose,
  applyNightBattlePose,
  roadWalkPose,
  applyStorybookFrame,
} from "./road-storybook-poses";

function heroPose(state: RoadBattle, hero: Traveller, reduced: boolean, look?: RoadLook) {
  if (reduced || state.scene || !roadTravellerCanMove(hero)) return 8;
  if (state.phase !== "journey") return hero.walking ? roadWalkPose(state.time, hero.id, look) : 8;
  const hit = state.effects
    .filter((i) => i.hero === hero.id && i.kind !== "hurt" && i.kind !== "gather")
    .at(-1);
  const hurt = state.effects.filter((i) => i.hero === hero.id && i.kind === "hurt").at(-1);
  if (activeEffect(hurt, state.time, 300)) return 11;
  if (activeEffect(hit, state.time, 600)) return 4 + Math.floor((state.time - hit.at) / 150);
  if (look?.workers.includes(hero.id) && state.gathering?.task === "gather")
    return 9 + (Math.floor(state.time / 380) % 2);
  return hero.walking ? roadWalkPose(state.time, hero.id, look) : 8;
}
function activeEffect(
  effect: RoadEffect | undefined,
  time: number,
  duration: number,
): effect is RoadEffect {
  return !!effect && time >= effect.at && time - effect.at < duration;
}
function nightBattleNeeded(
  look: RoadLook | undefined,
  hero: Traveller,
  item: HandheldItem | undefined,
) {
  return (
    (nightHandheld(look) || picnicHandheld(look)) &&
    hero.id === "aria" &&
    item?.phase === "ground" &&
    !item.returning
  );
}
export function paintRoadHeroPose(
  image: Phaser.GameObjects.Image,
  state: RoadBattle,
  hero: Traveller,
  reduced: boolean,
  size: number,
  stride: number,
  look?: RoadLook,
) {
  if (paintInjuryPose(image, hero, size, look)) {
    const dropped = state.handheld?.find((i) => i.hero === hero.id && i.point);
    return { luggage: dropped ? { ...dropped, phase: "ground" as const } : undefined, frame: 0 };
  }
  if (
    paintWaterwayPose(image, state, hero, size, look) ||
    paintTownParcelHero(image, state, hero, reduced, size, stride, look)
  )
    return { luggage: recordsGroundLuggage(state, hero, look), frame: 0 };
  const luggage = state.handheld?.find((i) => i.hero === hero.id);
  const frame = luggage ? handheldFrame(luggage, hero, state.time, stride, reduced) : 0;
  const pose = String(heroPose(state, hero, reduced, look));
  if (nightBattleNeeded(look, hero, luggage)) {
    applyNightBattlePose(image, pose === "8" || pose.startsWith("walk-") ? "7" : pose, size);
    return { luggage, frame };
  }
  if (applyStorybookHandheldPose(image, hero, luggage, frame, size)) return { luggage, frame };
  const working = paintWorkingPose(image, state, hero, reduced, size, stride, look);
  if (!working) applyHeroPose(image, hero.id, pose, size, look?.storybookHeroes, stride);
  return { luggage, frame };
}
function recordsGroundLuggage(state: RoadBattle, hero: Traveller, look?: RoadLook) {
  return look?.mossBeds?.records
    ? state.handheld?.find((item) => item.hero === hero.id && item.phase === "ground")
    : undefined;
}
function paintWorkingPose(
  image: Phaser.GameObjects.Image,
  state: RoadBattle,
  hero: Traveller,
  reduced: boolean,
  size: number,
  stride: number,
  look?: RoadLook,
) {
  const pulling = look?.frontCarriers.includes(hero.id) || false;
  return (
    look?.workers.includes(hero.id) &&
    applyWorkPose(
      image,
      journeyCartWorkState(state),
      hero,
      reduced,
      size,
      pulling,
      look.storybookHeroes,
      stride,
      look.work?.frame,
    )
  );
}
function paintInjuryPose(
  image: Phaser.GameObjects.Image,
  hero: Traveller,
  size: number,
  look?: RoadLook,
) {
  if (roadTravellerCanMove(hero)) return false;
  const painted = !!look?.storybookHeroes;
  if (painted && paintRecordsRecovery(image, hero, size)) return true;
  const pose = painted ? roadInjuryPose(hero.id) : undefined;
  if (pose)
    applyStorybookFrame(image, pose.asset, pose.frame, size, pose.cell ?? 192, pose.rows ?? 1);
  else applyHeroPose(image, hero.id, "11", size, painted);
  return true;
}
function paintRecordsRecovery(image: Phaser.GameObjects.Image, hero: Traveller, size: number) {
  if (hero.recordsRecovery !== "rising-low" && hero.recordsRecovery !== "rising-high") return false;
  const names: Partial<Record<Traveller["id"], string>> = {
    aria: "aria-night-handheld-v1",
    finn: "finn-handheld-balanced-v2",
  };
  const name = names[hero.id] ?? `${hero.id}-handheld-v1`;
  applyStorybookFrame(
    image,
    `/storybook-study/${name}.webp`,
    hero.recordsRecovery === "rising-low" ? 1 : 2,
    size,
    192,
    2,
  );
  return true;
}
function paintWaterwayPose(
  image: Phaser.GameObjects.Image,
  state: RoadBattle,
  hero: Traveller,
  size: number,
  look?: RoadLook,
) {
  const pose =
    state.waterwayActions?.poses[hero.id] ??
    (look?.foundingDraft?.openingGrip && hero.id === "finn"
      ? { asset: foundingPullRestAsset, frame: 0, cell: 192 }
      : undefined);
  if (!pose) return false;
  applyStorybookFrame(image, pose.asset, pose.frame, size, pose.cell ?? 192, pose.rows ?? 1);
  return true;
}
