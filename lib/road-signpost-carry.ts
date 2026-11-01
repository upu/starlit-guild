import type { RoadViewport } from "./road-cart-layout.ts";
import type { Traveller } from "./road-view.ts";
import type { WaterwayActions, WaterwayPoint, WaterwayProp } from "./road-waterway-contacts.ts";
import { waterwayAt, waterwayFoot, waterwayPalm } from "./road-waterway-contacts.ts";
import { fixedRoadLayout } from "./road-fixed-layout.ts";
import { roadHeroSize, roadScale, roadDepth } from "./road-layout.ts";
import { packingTurnPalms } from "./road-packing-contacts.ts";
import {
  signpostAssets as assets,
  signpostBase,
  signpostEnemy,
  signpostSize,
} from "./road-signpost.ts";

const grip = { x: 0.35, y: 0.82 };
type Context = {
  hero: Traveller;
  time: number;
  view: RoadViewport;
  scene: WaterwayActions;
  stride: number;
};
const palms = [
  [134, 105],
  [144, 172],
  [134, 117],
  [134, 105],
  [126, 105],
  [135, 107],
  [124, 105],
  [129, 106],
];
export class RoadSignpostCarry {
  phase = "fall";
  private at = 0;
  start(time: number, completed = false) {
    this.phase = completed ? "done" : "fall";
    this.at = time;
  }
  get done() {
    return this.phase === "done";
  }
  private fallen(view: RoadViewport) {
    return fixedRoadLayout(view.width, view.height).world(
      signpostEnemy.x + 12,
      signpostEnemy.y - 10,
    );
  }
  private baseGrip(view: RoadViewport) {
    const base = fixedRoadLayout(view.width, view.height).world(signpostBase.x, signpostBase.y),
      width = signpostSize(view) * roadHeroSize(view.width, view.height);
    return {
      x: base.x - ((0.5 - grip.x) * width) / roadScale(view.width),
      lane: base.lane - ((1 - grip.y) * width * 1.25) / roadDepth(view.width, view.height),
    };
  }
  target(view: RoadViewport): WaterwayPoint {
    const point = ["fall", "approach", "grasp", "rise", "turn"].includes(this.phase)
      ? this.fallen(view)
      : this.baseGrip(view);
    return waterwayFoot(
      point,
      palms[1],
      this.phase === "carry" || this.phase === "plant" || this.done ? -1 : 1,
      view,
    );
  }
  paint(hero: Traveller, time: number, view: RoadViewport, scene: WaterwayActions, stride: number) {
    const { point, angle } = this.drawing({ hero, time, view, scene, stride });
    if (this.done) return this.standing(view);
    return {
      id: "fork-signpost",
      asset: assets.sign,
      point,
      size: signpostSize(view),
      depth: hero.lane + 0.01,
      angle,
      origin: grip,
    } satisfies WaterwayProp;
  }
  private drawing(c: Context): { point: WaterwayPoint; angle: number } {
    switch (this.phase) {
      case "fall":
        return this.fall(c);
      case "approach":
        if (waterwayAt(c.hero, this.target(c.view), c.view)) this.enter("grasp", c.time);
        break;
      case "grasp":
        this.pose(c.scene, 1);
        if (this.age(c.time) >= 450) this.enter("rise", c.time);
        break;
      case "rise":
        return this.rise(c);
      case "turn":
        return this.turn(c);
      case "carry":
        return this.travel(c);
      case "plant":
        return this.plant(c);
    }
    return { point: this.fallen(c.view), angle: -75 };
  }
  private fall(c: Context) {
    const p = Math.min(1, this.age(c.time) / 350);
    if (p === 1) this.enter("approach", c.time);
    return { point: this.fallen(c.view), angle: -75 * p };
  }
  private rise(c: Context) {
    const age = this.age(c.time),
      frame = age < 250 ? 2 : 0;
    this.pose(c.scene, frame);
    if (age >= 500) this.enter("turn", c.time);
    return { point: waterwayPalm(c.hero, palms[frame], 1, c.view), angle: -75 };
  }
  private turn(c: Context) {
    const frame = Math.min(3, Math.floor(this.age(c.time) / 100));
    c.scene.poses.leon = { asset: assets.turn, frame, cell: 256 };
    const point = waterwayPalm(c.hero, packingTurnPalms.leon[frame], 1, c.view);
    if (this.age(c.time) >= 400) this.enter("carry", c.time);
    return { point, angle: -75 };
  }
  private travel(c: Context) {
    const frame = c.hero.walking ? 4 + c.stride : 0;
    this.pose(c.scene, frame);
    const point = waterwayPalm(c.hero, palms[frame], -1, c.view);
    if (waterwayAt(c.hero, this.target(c.view), c.view)) this.enter("plant", c.time);
    return { point, angle: -75 };
  }
  private plant(c: Context) {
    const age = this.age(c.time),
      frame = age < 350 ? 2 : 1;
    this.pose(c.scene, frame);
    const point = waterwayPalm(c.hero, palms[frame], -1, c.view),
      angle = -75 * (1 - Math.min(1, age / 700));
    if (age >= 700) this.enter("done", c.time);
    return { point, angle };
  }
  private age(time: number) {
    return Math.max(0, time - this.at);
  }
  standing(view: RoadViewport): WaterwayProp {
    const point = fixedRoadLayout(view.width, view.height).world(signpostBase.x, signpostBase.y);
    return {
      id: "fork-signpost",
      asset: assets.sign,
      point,
      size: signpostSize(view),
      depth: point.lane,
    };
  }
  private pose(scene: WaterwayActions, frame: number) {
    scene.poses.leon =
      frame >= 4
        ? { asset: assets.walk, frame: frame - 4, cell: 256 }
        : frame === 1 || frame === 2
          ? { asset: assets.lower, frame: frame === 1 ? 3 : 2 }
          : { asset: assets.carry, frame: 0 };
  }
  private enter(phase: string, time: number) {
    this.phase = phase;
    this.at = time;
  }
}
