import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";
import { lindeCouriers } from "./road-linde-couriers.ts";
import { handheldPalm, type HandheldItem } from "./road-handheld.ts";
import {
  waterwayAt,
  waterwayMix,
  waterwayPalm,
  type WaterwayPoint,
  type WaterwayPose,
} from "./road-waterway-contacts.ts";

const poses: Partial<Record<Traveller["id"], { asset: string; palm: readonly [number, number] }>> =
  {
    aria: { asset: "/storybook-study/aria-night-handheld-v1.webp", palm: [121, 159] },
    leon: { asset: "/storybook-study/leon-recover-offer-v1.webp", palm: [109, 164] },
    mira: { asset: "/storybook-study/mira-handheld-v1.webp", palm: [132, 152] },
    finn: { asset: "/storybook-study/finn-recover-offer-v1.webp", palm: [105, 166] },
  };
export const leonRecoveryPalms = [
  [109, 164],
  [130, 134],
  [130, 107],
  [142, 97],
] as const;
export const finnRecoveryPalms = [
  [105, 166],
  [105, 143],
  [107, 110],
  [110, 104],
] as const;
type Drop = {
  start: WaterwayPoint;
  ground: WaterwayPoint;
  at: number;
  actor?: Traveller["id"];
  facing?: 1 | -1;
  liftedAt?: number;
  liftFoot?: WaterwayPoint;
  originalActor?: Traveller["id"];
  fallenFoot: WaterwayPoint;
};

function recoveryFacing(item: Drop, hero: Traveller): 1 | -1 {
  const replacement = item.originalActor && item.originalActor !== hero.id;
  if (replacement) return item.fallenFoot.x >= item.ground.x ? 1 : -1;
  return hero.x <= item.ground.x ? 1 : -1;
}

/** A dropped item has one world position until someone reaches it. */
export class FoundingDrop {
  private drop?: Drop;
  get active() {
    return !!this.drop;
  }
  get ground() {
    return this.drop?.ground;
  }
  settled(now: number) {
    return !!this.drop && this.drop.liftedAt === undefined && now - this.drop.at >= 350;
  }
  reset() {
    this.drop = undefined;
  }

  capture(
    start: WaterwayPoint,
    foot: WaterwayPoint,
    now: number,
    view: RoadViewport,
    stage: string,
    cartX?: number,
    originalActor?: Traveller["id"],
  ) {
    if (this.drop) return;
    const size = roadHeroSize(view.width, view.height);
    this.drop = {
      start: { ...start },
      fallenFoot: { ...foot },
      originalActor,
      ground: {
        x:
          start.x +
          ((foot.x <= (cartX ?? foot.x) ? -1 : 1) * size * 0.35) / roadScale(view.width, stage),
        lane: foot.lane - (size * 0.4) / roadDepth(view.width, view.height),
      },
      at: now,
    };
  }

  interrupt(
    start: WaterwayPoint,
    foot: WaterwayPoint,
    now: number,
    view: RoadViewport,
    stage: string,
    cartX?: number,
    originalActor?: Traveller["id"],
  ) {
    if (this.drop && this.drop.liftedAt === undefined) return;
    this.drop = undefined;
    this.capture(start, foot, now, view, stage, cartX, originalActor);
  }

  point(now: number) {
    const item = this.drop;
    return item && waterwayMix(item.start, item.ground, (now - item.at) / 350);
  }

  target(hero: Traveller, view: RoadViewport): WaterwayPoint | undefined {
    const item = this.drop,
      art = poses[hero.id];
    if (!item || !art) return;
    if (item.actor !== hero.id) {
      item.actor = hero.id;
      item.facing = recoveryFacing(item, hero);
      item.liftedAt = undefined;
      item.liftFoot = undefined;
    }
    if (item.liftFoot) return item.liftFoot;
    const offset = waterwayPalm({ x: 0, lane: 0 }, art.palm, item.facing ?? 1, view);
    return { x: item.ground.x - offset.x, lane: item.ground.lane - offset.lane };
  }

  finish(hero: Traveller, battle: RoadBattle, view: RoadViewport) {
    const item = this.drop,
      art = poses[hero.id],
      courier = lindeCouriers[hero.id];
    if (!item || !art || !courier) return;
    const target = this.target(hero, view);
    if (
      target &&
      item.liftedAt === undefined &&
      battle.time - item.at >= 350 &&
      waterwayAt(hero, target, view)
    ) {
      item.liftedAt = battle.time;
      item.liftFoot = { x: hero.x, lane: hero.lane };
    }
    if (item.liftedAt === undefined) return { point: this.point(battle.time), done: false };
    hero.walking = false;
    const age = Math.max(0, battle.time - item.liftedAt);
    hero.facing = item.facing ?? 1;
    const { pose, palm } = pickupArt(hero.id, age, art, courier);
    const point = waterwayPalm(hero, palm, hero.facing, view);
    const done = age >= (hero.id === "leon" || hero.id === "finn" ? 800 : 600);
    if (done) this.drop = undefined;
    return { point, pose, done };
  }
}

function pickupArt(
  id: HandheldItem["hero"],
  age: number,
  art: { asset: string },
  courier: NonNullable<(typeof lindeCouriers)[HandheldItem["hero"]]>,
): { pose: WaterwayPose; palm: readonly number[] } {
  if ((id === "leon" || id === "finn") && age < 800) {
    const frame = Math.min(3, Math.floor(age / 200));
    return {
      pose: { asset: art.asset, frame },
      palm: (id === "leon" ? leonRecoveryPalms : finnRecoveryPalms)[frame],
    };
  }
  if (age < 500) {
    const frame = age < 250 ? 1 : 2;
    return { pose: { asset: art.asset, frame, rows: 2 }, palm: handheldPalm(id, frame) };
  }
  return {
    pose: { asset: courier.offer, frame: courier.offerFrame, rows: courier.offerRows ?? 1 },
    palm: courier.offerPalm,
  };
}
