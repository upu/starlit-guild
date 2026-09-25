import type { RoadLook } from "@/lib/chapter-road-presentation";
import type { RoadEnemy } from "@/lib/road-view";
import { ROAD_PUPPETS } from "./road-art";

const puppetNames = {
  pumpety: "プティ",
  puppet: "人形",
  golem: "ゴーレム",
  slime: "",
  lico: "リコの仕掛け",
  merrill: "メリル",
};
export function enemyName(enemy: RoadEnemy) {
  if (enemy.kind !== "slime") return puppetNames[enemy.kind];
  return enemy.boss ? "大きなスライム" : "";
}
export const enemyFalls = (enemy: RoadEnemy) => enemy.pose === "fallen" || enemy.pose === "drag";
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
  })[enemy.kind];
export function enemyDisplayHeight(enemy: RoadEnemy, width: number, height: number) {
  if (enemy.kind === "lico" || enemy.kind === "merrill")
    return Math.min(90, width * 0.18, height * 0.34) * 0.9;
  return Math.min(115, width * 0.19, height * 0.32) * enemySize(enemy);
}
export function enemyAppearance(enemy: RoadEnemy, look?: RoadLook) {
  if (enemy.kind === "lico" || enemy.kind === "merrill")
    return {
      asset: enemy.kind === "lico" ? "/characters/lico-v1.png" : "/characters/merrill-v2.png",
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
