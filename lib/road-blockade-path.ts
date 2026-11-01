import type { RoadBattle, RoadEnemy } from "./road-view.ts";
import {
  blockadeEnemyFoot,
  blockadeGatheredFoot,
  type SourceFoot,
} from "./road-blockade-layout.ts";
const clamp = (p: number) => Math.max(0, Math.min(1, p));
function path(points: SourceFoot[], progress: number) {
  const p = clamp(progress) * (points.length - 1),
    i = Math.min(points.length - 2, Math.floor(p)),
    t = p - i;
  return {
    x: points[i].x + (points[i + 1].x - points[i].x) * t,
    y: points[i].y + (points[i + 1].y - points[i].y) * t,
  };
}
/** Walk around the bench legs; final gathering stays for the return's apology. */
export function blockadeSceneFoot(
  enemy: RoadEnemy,
  small: number,
  scene: RoadBattle["scene"],
  progress: number,
) {
  const base = blockadeEnemyFoot(enemy, small),
    door = { x: 1410, y: 450 };
  if (scene === "escape") {
    const end = blockadeGatheredFoot(enemy.kind);
    return enemy.kind === "puppet"
      ? path([base, { x: 1080, y: 610 }, end], progress)
      : path([base, end], progress);
  }
  if (scene === "enter") {
    return entryFoot(enemy, base, door, progress);
  }
  return small === 1 && enemy.kind === "puppet"
    ? path([base, { x: 1390, y: 700 }, { x: 1390, y: 500 }, door], progress)
    : path([base, { x: 1080, y: 610 }, door], progress);
}

function entryFoot(enemy: RoadEnemy, base: SourceFoot, door: SourceFoot, progress: number) {
  const via = enemy.kind === "pumpety" ? { x: 1390, y: 530 } : { x: 1080, y: 500 };
  return path([door, via, base], blockadeEntryProgress(enemy.kind, progress));
}
export function blockadeEntryProgress(kind: RoadEnemy["kind"], progress: number) {
  const delay = kind === "golem" ? 0 : kind === "pumpety" ? 0.28 : 0.12;
  return clamp((progress - delay) / (1 - delay));
}
