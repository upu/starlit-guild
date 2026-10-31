import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import type { WaterwayPoint, WaterwayPose } from "./road-waterway-contacts.ts";
import { waterwayAt, waterwayMix } from "./road-waterway-contacts.ts";
import { lindeDeliveryLayout } from "./road-housecalls-layout.ts";
import { roadDepth, roadScale, roadX, roadY } from "./road-layout.ts";
import { lindeCouriers } from "./road-linde-couriers.ts";

type Point = { x: number; y: number };
type Snapshot = {
  owner: Traveller["id"];
  held: boolean;
  point: Point;
  foot: Point;
  returning: boolean;
};
type Pickup = {
  start: Point;
  ground: Point;
  at: number;
  returning: boolean;
  liftedAt?: number;
  facing?: 1 | -1;
};
const poses: Partial<Record<Traveller["id"], { asset: string; palm: readonly [number, number] }>> =
  {
    aria: { asset: "/storybook-study/aria-night-handheld-v1.webp", palm: [121, 159] },
    leon: { asset: "/storybook-study/leon-handheld-v1.webp", palm: [100, 151] },
    mira: { asset: "/storybook-study/mira-handheld-v1.webp", palm: [132, 152] },
    finn: { asset: "/storybook-study/finn-handheld-balanced-v2.webp", palm: [132, 169] },
  };

/** Temporary, scene-relative paper positions; never stored in the game save. */
export class LindePaperPickup {
  private last?: Snapshot;
  private pickup?: Pickup;
  private turn?: { start: Point; at: number };
  private positions = new Map<string, Point>();
  get active() {
    return !!this.pickup;
  }

  rememberParty(battle: RoadBattle, view: RoadViewport, portrait?: boolean) {
    const l = lindeDeliveryLayout(view, portrait);
    for (const hero of battle.heroes)
      this.positions.set(
        hero.id,
        l.unproject(roadX(hero.x, 0, view.width), roadY(hero.lane, view.height, view.width)),
      );
  }

  remember(
    owner: Traveller,
    point: WaterwayPoint,
    held: boolean,
    returning: boolean,
    view: RoadViewport,
    portrait?: boolean,
  ) {
    const l = lindeDeliveryLayout(view, portrait);
    const canonical = (p: WaterwayPoint) =>
      l.unproject(roadX(p.x, 0, view.width), roadY(p.lane, view.height, view.width));
    this.last = {
      owner: owner.id,
      held,
      point: canonical(point),
      foot: canonical(owner),
      returning,
    };
  }

  replace(previous: Traveller["id"] | undefined, next: Traveller["id"] | undefined, time: number) {
    if (this.pickup) {
      const last = this.last;
      if (last && last.owner === previous && last.held) {
        this.pickup.start = last.point;
        this.pickup.ground = { x: last.point.x, y: last.foot.y + 45 };
        this.pickup.at = time;
        this.last = undefined;
      }
      this.pickup.facing = undefined;
      this.pickup.liftedAt = undefined;
      return;
    }
    if (!previous || previous === next || !this.last?.held || this.last.owner !== previous) return;
    const { point, foot, returning } = this.last;
    // Finn's crouched hand is much closer to his boots than the others'.
    // Let the paper settle farther forward so his feet can clear the fallen courier.
    const forward = next === "finn" ? 80 : 45;
    this.pickup = {
      start: point,
      ground: { x: point.x, y: foot.y + forward },
      at: time,
      returning,
    };
    this.last = undefined;
  }

  clearMemory() {
    this.last = undefined;
  }

  residentHas(previous: Traveller["id"] | undefined) {
    return !!previous && this.last?.owner === previous && !this.last.held;
  }

  residentTurns(time: number) {
    if (this.last && !this.last.held) this.turn = { start: this.last.point, at: time };
  }

  residentPoint(point: WaterwayPoint, time: number, view: RoadViewport, portrait?: boolean) {
    if (!this.turn) return point;
    const progress = Math.max(0, Math.min(1, (time - this.turn.at) / 350));
    const l = lindeDeliveryLayout(view, portrait);
    const start = l.world(this.turn.start.x, this.turn.start.y);
    if (progress >= 1) this.turn = undefined;
    return waterwayMix(start, point, progress);
  }

  point(time: number, view: RoadViewport, portrait?: boolean) {
    const item = this.pickup;
    if (!item) return undefined;
    const l = lindeDeliveryLayout(view, portrait);
    const drop = Math.max(0, Math.min(1, (time - item.at) / 350));
    return waterwayMix(
      l.world(item.start.x, item.start.y),
      l.world(item.ground.x, item.ground.y),
      drop,
    );
  }

  target(
    id: Traveller["id"],
    view: RoadViewport,
    portrait?: boolean,
  ): readonly [number, number] | undefined {
    const item = this.pickup,
      art = poses[id];
    if (!item || !art) return undefined;
    const l = lindeDeliveryLayout(view, portrait);
    item.facing ??= (this.positions.get(id)?.x ?? item.ground.x - 1) <= item.ground.x ? 1 : -1;
    const p = l.project(item.ground.x, item.ground.y);
    const foot = l.unproject(
      p.x - (art.palm[0] - 96) * 0.9 * l.scale * item.facing,
      p.y - (art.palm[1] - 176) * 0.9 * l.scale,
    );
    return [foot.x, foot.y];
  }

  finish(hero: Traveller, battle: RoadBattle, view: RoadViewport, portrait?: boolean) {
    const item = this.pickup,
      art = poses[hero.id],
      courier = lindeCouriers[hero.id];
    if (!item || !art || !courier) return undefined;
    const l = lindeDeliveryLayout(view, portrait),
      target = this.target(hero.id, view, portrait);
    if (
      target &&
      !hero.walking &&
      battle.time - item.at >= 350 &&
      waterwayAt(hero, l.world(...target), view)
    )
      item.liftedAt ??= battle.time;
    if (item.liftedAt === undefined) {
      const point = this.point(battle.time, view, portrait);
      return point ? { point, pose: undefined, done: false, returning: item.returning } : undefined;
    }
    const age = Math.max(0, battle.time - item.liftedAt);
    hero.facing = item.facing ?? 1;
    const pose: WaterwayPose = {
      asset: art.asset,
      frame: age < 250 ? 1 : age < 500 ? 2 : 0,
      rows: 2,
    };
    const factor = (l.figureSize * 0.9) / 144,
      palm = courier.offerPalm;
    const carryPalm = {
      x: hero.x + ((palm[0] - 96) * factor * hero.facing) / roadScale(view.width),
      lane: hero.lane + ((palm[1] - 176) * factor) / roadDepth(view.width, view.height),
    };
    const point = waterwayMix(
      l.world(item.ground.x, item.ground.y),
      carryPalm,
      Math.max(0, (age - 250) / 450),
    );
    const done = age >= 700;
    this.remember(hero, point, true, item.returning, view, portrait);
    if (done) this.pickup = undefined;
    return { point, pose, done, returning: item.returning };
  }
}
