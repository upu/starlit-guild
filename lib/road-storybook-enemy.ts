import type { RoadEnemy, RoadBattle } from "./road-view.ts";
import { RoadGait } from "./road-gait.ts";
import { roadScale, roadDepth } from "./road-layout.ts";

export const paintedPuppetAssets = {
  puppet: "/storybook-study/puppet-poses-v1.webp",
  golem: "/storybook-study/golem-poses-v1.webp",
  pumpety: "/storybook-study/masked-pumpety-v1.webp",
};
export type PaintedEnemyPose = {
  asset: string;
  frame: string;
  cell: number;
  foot: number;
  height: number;
  rows: number;
};
type View = { width: number; height: number; stage: string };
type Step = { x: number; lane: number; hp: number; hitAt: number };

/** Separate the small actors from the carrier's wide feet and hands. */
export function arrangePaintedPuppets(battle: RoadBattle, painted = false) {
  if (!painted) return;
  const large = battle.enemies.some((enemy) => enemy.kind === "golem");
  const rows = large ? { first: 1.12, gap: 0.12 } : { first: 0.57, gap: 0.4 };
  const retreat = battle.scene === "escape" ? Math.min(1, (battle.sceneProgress ?? 1) / 0.2) : 0;
  const golemLane = 0.55 - 0.27 * retreat;
  let small = 0;
  for (const enemy of battle.enemies) {
    if (enemy.kind === "puppet") enemy.lane = rows.first + small++ * rows.gap;
    if (enemy.kind === "golem") enemy.lane = golemLane;
    if (enemy.kind === "pumpety") enemy.lane = 0.88;
  }
}

/** Feet drive the gait; time alone cannot make a stationary puppet slide. */
export class RoadStorybookEnemies {
  private gait = new RoadGait();
  private steps = new Map<number, Step>();
  private key?: string;

  pose(
    enemy: RoadEnemy,
    battle: RoadBattle,
    view: View,
    reduced: boolean,
    key?: string,
  ): PaintedEnemyPose | undefined {
    if (!["puppet", "golem", "pumpety"].includes(enemy.kind)) return;
    if (key !== this.key) {
      this.key = key;
      this.gait = new RoadGait();
      this.steps.clear();
    }
    const previous = this.steps.get(enemy.id);
    const distance = previous
      ? Math.hypot(
          (enemy.x - previous.x) * roadScale(view.width, view.stage),
          (enemy.lane - previous.lane) * roadDepth(view.width, view.height),
        )
      : 0;
    const hitAt = previous && enemy.hp < previous.hp ? battle.time : (previous?.hitAt ?? -Infinity);
    const stride = this.gait.frame({ ...enemy, id: String(enemy.id) }, view);
    this.steps.set(enemy.id, { x: enemy.x, lane: enemy.lane, hp: enemy.hp, hitAt });
    const masked = enemy.kind === "pumpety";
    const frame = enemyFrame(enemy, distance > 0.1, stride, reduced, battle.time - hitAt);
    return {
      asset: paintedPuppetAssets[enemy.kind as keyof typeof paintedPuppetAssets],
      frame: String(frame),
      cell: masked ? 128 : 512,
      foot: masked ? 120 : 480,
      height: masked ? 78 : 384,
      rows: masked ? 3 : 2,
    };
  }
}

function enemyFrame(
  enemy: RoadEnemy,
  moving: boolean,
  stride: number,
  reduced: boolean,
  hitAge: number,
) {
  const frames =
    enemy.kind === "pumpety"
      ? { down: 9, command: 2, hit: 3, walk: 4 }
      : { down: 5, command: 4, hit: 7, walk: 1 };
  if (enemy.pose === "fallen" || enemy.pose === "drag") return frames.down;
  if (reduced) return 0;
  if (enemy.action === "command" || enemy.action === "rally") return frames.command;
  if (hitAge < 180) return frames.hit;
  if (enemy.attack) return enemy.attack === "windup" ? 7 : 0;
  return moving ? frames.walk + stride : 0;
}
