import type { RoadBattle } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { WaterwayActions, WaterwayProp } from "./road-waterway-contacts.ts";
import { fixedRoadLayout } from "./road-fixed-layout.ts";
import { roadHeroSize } from "./road-layout.ts";
import { enemyDisplayHeight } from "./road-enemy-layout.ts";
import { RoadGait } from "./road-gait.ts";
import { projectFixedEffects } from "./road-fixed-effects.ts";
import {
  signpostAssets as assets,
  signpostBase,
  signpostEnemy,
  signpostSize,
} from "./road-signpost.ts";

const rope = { x: 0.35, y: 0.82 };
const pickup = { x: signpostBase.x - 21, y: signpostBase.y - 3.5 };
const branch = { x: 1220, y: 560 };
const mix = (a: number, b: number, p: number) => a + (b - a) * Math.max(0, Math.min(1, p));

/** One non-combat actor bridges the story ending and the next engine ambush. */
export class RoadSignpostOwner {
  private entered = 0;
  private cycle = 0;
  private gait = new RoadGait();
  enter(node: number, time: number, cold = false) {
    if (node % 3 !== 0 && !cold) return;
    this.cycle = Math.floor(node / 3);
    this.entered = time;
    if (cold) this.gait = new RoadGait();
  }
  private age(time: number) {
    return this.cycle === 0 ? 3000 : Math.max(0, time - this.entered);
  }
  private source(time: number) {
    const age = this.age(time);
    if (age < 700)
      return { x: mix(branch.x, pickup.x, age / 700), y: mix(branch.y, pickup.y, age / 700) };
    if (age < 1400) return pickup;
    const p = (age - 1400) / 800;
    return { x: mix(pickup.x, signpostEnemy.x, p), y: mix(pickup.y, signpostEnemy.y, p) };
  }
  prepare(battle: RoadBattle, view: RoadViewport) {
    const original = battle.enemies.map((e) => ({ ...e })),
      first = battle.enemies.find((e) => e.kind === "puppet");
    if (!first) return;
    const src = this.source(battle.time),
      point = fixedRoadLayout(view.width, view.height).world(src.x, src.y);
    Object.assign(first, point);
    projectFixedEffects(battle, battle.heroes, original);
  }
  paint(
    battle: RoadBattle,
    view: RoadViewport,
    scene: WaterwayActions,
    phase: number,
  ): WaterwayProp {
    const age = this.age(battle.time),
      src = this.source(battle.time),
      layout = fixedRoadLayout(view.width, view.height);
    const live = battle.enemies.some((e) => e.kind === "puppet" && e.hp > 0);
    if (!live) this.actor(scene, src, view, this.frame(battle, view, src, age, phase));
    if (age < 1100 && phase === 0) {
      const point = layout.world(signpostBase.x, signpostBase.y);
      return {
        id: "fork-signpost",
        asset: assets.sign,
        point,
        size: signpostSize(view),
        depth: point.lane,
      };
    }
    const point = layout.world(src.x + 12, src.y - 10);
    return {
      id: "fork-signpost",
      asset: assets.sign,
      point,
      size: signpostSize(view),
      depth: layout.world(src.x, src.y).lane - 0.01,
      origin: rope,
    };
  }
  private frame(
    battle: RoadBattle,
    view: RoadViewport,
    src: { x: number; y: number },
    age: number,
    phase: number,
  ) {
    const foot = fixedRoadLayout(view.width, view.height).world(src.x, src.y);
    const stride = this.gait.frame({ id: "signpost-owner", ...foot }, { ...view, stage: "forest" });
    if (age < 700) return 1 + stride;
    if (age < 1100) return 5;
    if (age < 1400) return 6;
    if (age < 2200) return 1 + ((4 - stride) % 4);
    return phase === 1 || battle.enemies.some((e) => e.kind === "puppet" && e.hp <= 0) ? 5 : 0;
  }
  depart(scene: WaterwayActions, view: RoadViewport, time: number) {
    const age = Math.max(0, time - this.entered),
      p = Math.max(0, (age - 350) / 800);
    if (p >= 1) return;
    const src = { x: mix(signpostEnemy.x, 1470, p), y: mix(signpostEnemy.y, 570, p) };
    const point = fixedRoadLayout(view.width, view.height).world(src.x, src.y);
    const stride = this.gait.frame(
      { id: "signpost-owner", ...point },
      { ...view, stage: "forest" },
    );
    this.actor(scene, src, view, age < 350 ? 5 : 1 + ((4 - stride) % 4), Math.min(1, (1 - p) * 4));
  }
  beginDeparture(time: number) {
    this.entered = time;
  }
  private actor(
    scene: WaterwayActions,
    src: { x: number; y: number },
    view: RoadViewport,
    frame: number,
    alpha = 1,
  ) {
    const point = fixedRoadLayout(view.width, view.height).world(src.x, src.y);
    const size =
      enemyDisplayHeight({ kind: "puppet", boss: false }, view.width, view.height) /
      roadHeroSize(view.width, view.height);
    scene.actors = [
      {
        id: "fork-puppet-owner",
        point,
        pose: {
          asset: assets.puppet,
          frame,
          cell: 512,
          rows: 2,
          square: { foot: 480, height: 384 },
        },
        facing: 1,
        size,
        alpha,
      },
    ];
  }
}
