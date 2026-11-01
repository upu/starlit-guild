import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { fixedRoadLayout } from "./road-fixed-layout.ts";
import {
  waterwayAt,
  waterwayFoot,
  waterwayPalm,
  waterwayMix,
  type WaterwayPoint,
  type WaterwayActions,
  type WaterwayPose,
} from "./road-waterway-contacts.ts";
import {
  medicinePackingAssets as assets,
  packingFeet,
  packingSourceSize,
} from "./road-medicine-packing.ts";
import {
  packingBags,
  packingMouth,
  packingLowerPalm,
  packingCarryPalms,
  packingTurnPalms,
  packingProp,
  type PackingHero,
} from "./road-packing-contacts.ts";
import { packingWrapAsset, PACKING_PACKET_WIDTH } from "./road-packing-finish.ts";
type Phase =
  | "idle"
  | "lift"
  | "out-turn"
  | "carry"
  | "in-turn"
  | "lower"
  | "release"
  | "seal"
  | "return"
  | "done";
export class RoadPackingCarrier {
  private phase: Phase = "idle";
  private at = 0;
  private from?: WaterwayPoint;
  private stored = 0;
  private lid = 0;
  readonly id: PackingHero;
  constructor(id: PackingHero) {
    this.id = id;
  }
  get begun() {
    return this.phase !== "idle";
  }
  get done() {
    return this.phase === "done";
  }
  get count() {
    return this.stored;
  }
  get bagFrame() {
    return this.lid;
  }
  next() {
    this.phase = "idle";
    this.from = undefined;
  }
  restore(count: number) {
    this.stored = count;
    this.lid = count >= 5 ? 3 : 0;
    this.next();
  }
  start(time: number, view: RoadViewport) {
    this.phase = "lift";
    this.at = time;
    const p = this.id === "aria" ? { x: 850, y: 690 } : { x: 1070, y: 660 };
    this.from = fixedRoadLayout(view.width, view.height).world(p.x, p.y);
  }
  private face() {
    return this.id === "aria" ? 1 : -1;
  }
  private walkingFace() {
    return this.id === "aria" ? -1 : 1;
  }
  target(view: RoadViewport) {
    if (["carry", "in-turn", "lower", "release", "seal"].includes(this.phase)) {
      const p = packingMouth(this.id),
        layout = fixedRoadLayout(view.width, view.height);
      return waterwayFoot(layout.world(p.x, p.y), packingLowerPalm(this.id), this.face(), view);
    }
    const p = packingFeet[this.id];
    return fixedRoadLayout(view.width, view.height).world(p.x, p.y);
  }
  facing() {
    return this.phase === "carry" ? this.walkingFace() : this.face();
  }
  paint(
    battle: RoadBattle,
    view: RoadViewport,
    scene: WaterwayActions,
    stride: number,
    reduced: boolean,
  ) {
    if (["idle", "done"].includes(this.phase)) {
      this.paintStored(scene, view);
      return;
    }
    const hero = battle.heroes.find((h) => h.id === this.id);
    if (!hero) return;
    const age = reduced ? 1000 : Math.max(0, battle.time - this.at);
    const point = this.advance(hero, battle.time, age, view, scene, stride);
    this.paintStored(scene, view);
    if (!point) return;
    const bag = packingBags[this.id],
      ground = fixedRoadLayout(view.width, view.height).world(bag.x, bag.y);
    scene.props.push({
      id: `packing-carried-${this.id}`,
      asset: packingWrapAsset(this.id, 3),
      point,
      size: packingSourceSize(PACKING_PACKET_WIDTH, view),
      depth: ["lower", "release"].includes(this.phase) ? ground.lane : hero.lane + 0.002,
    });
  }
  private advance(
    hero: Traveller,
    time: number,
    age: number,
    view: RoadViewport,
    scene: WaterwayActions,
    stride: number,
  ): WaterwayPoint | undefined {
    if (this.phase === "seal") {
      this.seal(hero, time, age, scene);
      return;
    }
    if (this.phase === "return") {
      if (waterwayAt(hero, this.target(view), view)) {
        this.phase = "done";
        hero.walking = false;
      }
      return;
    }
    if (this.phase === "lift") return this.lift(hero, time, age, view, scene);
    if (this.phase === "out-turn" || this.phase === "in-turn")
      return this.turn(hero, time, age, view, scene);
    if (this.phase === "carry") return this.carry(hero, time, view, scene, stride);
    if (this.phase === "lower") return this.lower(hero, time, age, view, scene);
    if (this.phase === "release") return this.release(hero, time, age, view, scene);
  }
  private hold(scene: WaterwayActions, hero: Traveller, frame = 0) {
    let pose: WaterwayPose;
    if (this.id === "aria") pose = { asset: assets.ariaCarry, frame, rows: 2 };
    else
      pose =
        frame >= 4
          ? { asset: assets.leonCarryWalk, frame: frame - 4, cell: 256 }
          : { asset: assets.leonCarry, frame: 0 };
    scene.poses[this.id] = pose;
  }
  private hand(hero: Traveller, view: RoadViewport, stride = 0) {
    return waterwayPalm(hero, packingCarryPalms[this.id][stride], hero.facing, view);
  }
  private lift(
    hero: Traveller,
    time: number,
    age: number,
    view: RoadViewport,
    scene: WaterwayActions,
  ) {
    hero.facing = this.face();
    hero.walking = false;
    this.hold(scene, hero);
    const point = waterwayMix(this.from ?? hero, this.hand(hero, view), age / 350);
    if (age >= 350) this.enter("out-turn", time, point);
    return point;
  }
  private turn(
    hero: Traveller,
    time: number,
    age: number,
    view: RoadViewport,
    scene: WaterwayActions,
  ) {
    const targetFace = this.phase === "out-turn" ? this.walkingFace() : this.face();
    const step = Math.min(3, Math.floor(age / 100)),
      frame = targetFace === -1 ? step : 3 - step;
    hero.facing = 1;
    hero.walking = false;
    scene.poses[this.id] = {
      asset: this.id === "aria" ? assets.ariaTurn : assets.leonTurn,
      frame,
      cell: 256,
    };
    const point = waterwayPalm(hero, packingTurnPalms[this.id][frame], 1, view);
    if (age >= 400) this.enter(this.phase === "out-turn" ? "carry" : "lower", time, point);
    return point;
  }
  private carry(
    hero: Traveller,
    time: number,
    view: RoadViewport,
    scene: WaterwayActions,
    stride: number,
  ) {
    hero.facing = this.walkingFace();
    this.hold(scene, hero, hero.walking ? 4 + stride : 0);
    const point = this.hand(hero, view, hero.walking ? 1 + stride : 0);
    if (waterwayAt(hero, this.target(view), view)) {
      hero.walking = false;
      this.enter("in-turn", time, point);
    }
    return point;
  }
  private lowerPose(scene: WaterwayActions, age: number) {
    scene.poses[this.id] =
      this.id === "aria"
        ? { asset: assets.ariaCarry, frame: age < 250 ? 2 : 1, rows: 2 }
        : { asset: assets.leonLower, frame: age < 250 ? 2 : 3 };
  }
  private lower(
    hero: Traveller,
    time: number,
    age: number,
    view: RoadViewport,
    scene: WaterwayActions,
  ) {
    hero.facing = this.face();
    hero.walking = false;
    this.lowerPose(scene, age);
    const middle = waterwayPalm(
        hero,
        this.id === "aria" ? [131, 130] : [134, 117],
        hero.facing,
        view,
      ),
      end = waterwayPalm(hero, packingLowerPalm(this.id), hero.facing, view);
    const point = age < 250 ? middle : end;
    if (age >= 500) this.enter("release", time, point);
    return point;
  }
  private release(
    hero: Traveller,
    time: number,
    age: number,
    view: RoadViewport,
    scene: WaterwayActions,
  ) {
    hero.facing = this.face();
    hero.walking = false;
    this.lowerPose(scene, 500);
    const target = this.slot(view, this.stored),
      point = waterwayMix(this.from ?? hero, target, age / 300);
    if (age >= 300) {
      this.stored++;
      this.enter(this.stored >= 5 ? "seal" : "return", time, point);
      return;
    }
    return point;
  }
  private seal(hero: Traveller, time: number, age: number, scene: WaterwayActions) {
    hero.facing = this.face();
    hero.walking = false;
    this.lowerPose(scene, 500);
    this.lid = Math.min(3, Math.floor(age / 200));
    if (age >= 600) this.enter("return", time, this.from ?? hero);
  }
  private enter(phase: Phase, time: number, from: WaterwayPoint) {
    this.phase = phase;
    this.at = time;
    this.from = { ...from };
  }
  private slot(view: RoadViewport, index: number) {
    const bag = packingBags[this.id];
    return fixedRoadLayout(view.width, view.height).world(
      bag.x - 8 + Math.min(4, index) * 4,
      bag.y - 19 - Math.floor(index / 3) * 2,
    );
  }
  private paintStored(scene: WaterwayActions, view: RoadViewport) {
    const p = packingBags[this.id],
      layout = fixedRoadLayout(view.width, view.height);
    for (let index = 0; index < this.stored; index++)
      scene.props.push({
        ...packingProp(
          view,
          `packing-stored-${this.id}-${String(index)}`,
          packingWrapAsset(this.id, 3),
          p,
          PACKING_PACKET_WIDTH,
          p.y,
        ),
        point: this.slot(view, index),
        depth: layout.world(p.x, p.y).lane,
        alpha: 1 - this.lid / 3,
      });
  }
}
