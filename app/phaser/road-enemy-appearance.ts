import type { RoadLook } from "@/lib/chapter-road-presentation";
import type { RoadEnemy, RoadBattle } from "@/lib/road-view";
import {
  adventureEnemyArt,
  adventureEnemyAsset,
  ordinaryEnemyArt,
  storybookWolfAsset,
  storybookSlimeAsset,
} from "@/lib/adventure-enemy-art";
import type Phaser from "phaser";
export { enemyDisplayHeight } from "@/lib/road-enemy-layout";
import { RPG_CAMERA_SCALE } from "@/lib/rpg-camera";
import {
  housecallsSceneLayout,
  lindeDeliveryLayout,
  nightBridgeLayout,
} from "@/lib/road-housecalls-layout";
import { enemyDisplayHeight as baseEnemyHeight } from "@/lib/road-enemy-layout";
import { seedlingMerrillHeight, seedlingMushroomHeight } from "@/lib/road-seedling-battle";
function fixedEnemyScale(look: RoadLook | undefined, width: number, height: number) {
  if (look?.nightBridge)
    return nightBridgeLayout({ width, height }, look.nightBridge.section).figureRatio;
  if (look?.lindeDelivery)
    return lindeDeliveryLayout({ width, height }, look.lindeDelivery.portrait).figureRatio;
  return look?.mossBeds ? housecallsSceneLayout({ width, height }, look).figureRatio : 1;
}
export const sceneEnemyHeight = (
  enemy: RoadEnemy,
  width: number,
  height: number,
  look?: RoadLook,
) =>
  look?.mossBeds?.seedlings && enemy.kind === "merrill"
    ? seedlingMerrillHeight({ width, height })
    : look?.mossBeds?.seedlings && enemy.kind === "mushroom"
      ? seedlingMushroomHeight({ width, height })
      : look?.mossBeds?.records && enemy.kind === "lico"
        ? housecallsSceneLayout({ width, height }, look).scale * 125
        : baseEnemyHeight(enemy, width, height) * fixedEnemyScale(look, width, height);

const puppetNames = {
  pumpety: "カボチャ頭の少女",
  puppet: "人形",
  golem: "ゴーレム",
  slime: "",
  lico: "リコの仕掛け",
  merrill: "メリル",
  mushroom: "コロタケ",
};
export function enemyName(enemy: RoadEnemy) {
  if (enemy.kind !== "slime") return puppetNames[enemy.kind];
  return enemy.boss ? "大きなスライム" : "";
}
export const enemyLabel = (enemy: RoadEnemy, look?: RoadLook) =>
  look?.enemies[enemy.id]?.label || enemyName(enemy);
export const enemyArrived = (enemy: RoadEnemy, time: number, reduced: boolean) =>
  reduced || !enemy.appearsAt || time >= enemy.appearsAt;
export const enemyPresent = (state: RoadBattle, id: number, reduced: boolean) =>
  state.enemies.some(
    (enemy) =>
      enemy.id === id && (enemy.hp > 0 || enemy.pose) && enemyArrived(enemy, state.time, reduced),
  );
export const enemyFalls = (enemy: RoadEnemy) => enemy.pose === "fallen" || enemy.pose === "drag";
export function enemyAngle(enemy: RoadEnemy, time: number, reduced: boolean) {
  if (enemyFalls(enemy)) return -20;
  return !reduced && enemy.action ? Math.sin(time / 130) * 8 : 0;
}
export function fitEnemy(
  image: Phaser.GameObjects.Image,
  enemy: RoadEnemy,
  size: number,
  time: number,
  reduced: boolean,
) {
  image
    .setScale(size / adventureEnemyArt.height)
    .setOrigin(0.5, adventureEnemyArt.foot / adventureEnemyArt.cell);
  if (!reduced && (enemy.action === "command" || enemy.action === "rally")) {
    const beat = Math.sin(
      Math.min(1, Math.max(0, (time - (enemy.actionAt ?? time)) / 900)) * Math.PI,
    );
    image.y -= beat * size * (enemy.action === "command" ? 0.12 : 0.06);
    image.scaleY *= 1 + beat * 0.07;
    image.scaleX *= 1 - beat * 0.04;
  }
  if (!reduced && enemy.action === "song") {
    const turn = ((time - (enemy.actionAt ?? time)) / 900) * Math.PI * 2;
    image.scaleX *= Math.max(0.15, Math.abs(Math.cos(turn)));
    if (Math.cos(turn) < 0) image.toggleFlipX();
    image.x += Math.sin(turn) * 8 * RPG_CAMERA_SCALE;
    image.y -= Math.abs(Math.sin(turn)) * 5 * RPG_CAMERA_SCALE;
  }
}
export function enemyFacesRight(enemy: RoadEnemy, heroX: number) {
  if (enemy.facing !== undefined) return enemy.facing === 1;
  if (enemy.pose === "retreat" || enemy.pose === "drag") return true;
  return enemy.kind !== "slime" ? enemy.x < heroX : enemy.x > heroX;
}
export function enemyAppearance(enemy: RoadEnemy, look?: RoadLook) {
  if (enemy.kind === "mushroom")
    return {
      asset: adventureEnemyAsset("mushroom"),
      frame: "__BASE",
      puppet: false,
      character: false,
    };
  if (enemy.kind === "lico" || enemy.kind === "merrill")
    return {
      asset: adventureEnemyAsset(
        enemy.kind === "lico"
          ? "lico-standing"
          : enemy.action === "song"
            ? "merrill-song"
            : "merrill-standing",
      ),
      frame: "__BASE",
      puppet: false,
      character: true,
    };
  if (enemy.kind !== "slime")
    return {
      asset: adventureEnemyAsset(enemy.kind),
      frame: "__BASE",
      puppet: true,
      character: false,
    };
  const species = ordinaryEnemyArt(look?.enemies[enemy.id]?.frame || "8");
  const painted = { wolf: storybookWolfAsset, slime: storybookSlimeAsset }[species as string];
  return {
    asset: look?.storybookHeroes && painted ? painted : adventureEnemyAsset(species),
    frame: "__BASE",
    puppet: false,
    character: false,
  };
}
