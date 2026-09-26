import type { RoadLook } from "@/lib/chapter-road-presentation";
import type { RoadEnemy, RoadBattle } from "@/lib/road-view";
import { ROAD_PUPPETS } from "./road-art";
import type Phaser from "phaser";
import type { RoadSpriteFilter } from "./road-sprite-filter";

const puppetNames = {
  pumpety: "プティ",
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
  filter: RoadSpriteFilter,
  time: number,
  reduced: boolean,
) {
  const { puppet, character } = enemyAppearance(enemy);
  if (puppet) image.setScale(size / 724).setOrigin(0.5, 0.98);
  if (character || enemy.kind === "mushroom") {
    image.setScale(size / image.frame.height).setOrigin(0.5, 1);
    filter.apply(image);
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
const enemySize = (enemy: RoadEnemy) =>
  ({
    puppet: 0.45,
    pumpety: 1,
    golem: 1.65,
    slime: enemy.boss ? 1.65 : 0.75,
    lico: 1,
    merrill: 1,
    mushroom: 0.42,
  })[enemy.kind];
export function enemyDisplayHeight(enemy: RoadEnemy, width: number, height: number) {
  if (enemy.kind === "lico" || enemy.kind === "merrill")
    return Math.min(90, width * 0.18, height * 0.34) * 0.9;
  return Math.min(115, width * 0.19, height * 0.32) * enemySize(enemy);
}
export function enemyAppearance(enemy: RoadEnemy, look?: RoadLook) {
  if (enemy.kind === "mushroom")
    return {
      asset: "/animations/road/mushroom-v1.webp",
      frame: "__BASE",
      puppet: false,
      character: false,
    };
  if (enemy.kind === "lico" || enemy.kind === "merrill")
    return {
      asset: `/animations/road/${enemy.kind}-${enemy.action === "song" ? "song" : "standing"}-v1.webp`,
      frame: "__BASE",
      puppet: false,
      character: true,
    };
  if (enemy.kind !== "slime")
    return { asset: ROAD_PUPPETS, frame: enemy.kind, puppet: true, character: false };
  return {
    asset: "/sprites.png",
    frame: look?.enemies[enemy.id]?.frame || "slime",
    puppet: false,
    character: false,
  };
}
