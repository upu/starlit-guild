import type { RoadLook } from "@/lib/chapter-road-presentation";
import type { RoadEnemy, RoadBattle } from "@/lib/road-view";
import {
  adventureEnemyArt,
  adventureEnemyAsset,
  ordinaryEnemyArt,
} from "@/lib/adventure-enemy-art";
import type Phaser from "phaser";

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
    image.x += Math.sin(turn) * 8;
    image.y -= Math.abs(Math.sin(turn)) * 5;
  }
}
export function enemyFacesRight(enemy: RoadEnemy, heroX: number) {
  if (enemy.pose === "retreat" || enemy.pose === "drag") return true;
  return enemy.kind !== "slime" ? enemy.x < heroX : enemy.x > heroX;
}
const enemySize = (enemy: Pick<RoadEnemy, "kind" | "boss">) =>
  ({
    puppet: 0.45,
    pumpety: 1,
    golem: 1.65,
    slime: enemy.boss ? 1.65 : 0.75,
    lico: 1,
    merrill: 1,
    mushroom: 0.42,
  })[enemy.kind];
export function enemyDisplayHeight(
  enemy: Pick<RoadEnemy, "kind" | "boss">,
  width: number,
  height: number,
) {
  if (enemy.kind === "lico" || enemy.kind === "merrill")
    return Math.min(90, width * 0.18, height * 0.34) * 0.9;
  return Math.min(115, width * 0.19, height * 0.32) * enemySize(enemy);
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
  return {
    asset: adventureEnemyAsset(ordinaryEnemyArt(look?.enemies[enemy.id]?.frame || "8")),
    frame: "__BASE",
    puppet: false,
    character: false,
  };
}
