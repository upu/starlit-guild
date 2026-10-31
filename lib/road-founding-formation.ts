import type { RoadViewport } from "./road-cart-layout.ts";
import type { JourneyCart } from "./road-journey-cart.ts";
import type { Traveller } from "./road-view.ts";
import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";
import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { FoundingJob } from "./road-founding-queue.ts";
import { lindeCourier } from "./road-linde-couriers.ts";

export const foundingCartAsset = "/storybook-study/garden-handcart-v2.webp";
/** Keep a queued handoff visible even when gameplay advances farther down the road. */
export function foundingCameraTarget(battle: RoadBattle, look: RoadLook) {
  return look.foundingDraft?.visualNode !== undefined &&
    battle.journeyCart?.asset === foundingCartAsset &&
    !battle.enemies.some((enemy) => enemy.hp > 0)
    ? Math.min(battle.distance, battle.journeyCart.x)
    : battle.distance;
}
export function foundingCameraSpeed(battle: RoadBattle, look: RoadLook) {
  return look.foundingDraft?.visualNode !== undefined &&
    battle.journeyCart?.asset === foundingCartAsset &&
    battle.enemies.some((enemy) => enemy.hp > 0)
    ? 720
    : 360;
}
export function foundingWorker(job: FoundingJob, heroes: Traveller[], current?: Traveller["id"]) {
  const previous = heroes.find((hero) => hero.id === current && hero.hp > 0 && !hero.paralyzed);
  if (previous) return previous.id;
  if (
    job.kind === "basket" &&
    heroes.some((hero) => hero.id === "finn" && hero.hp > 0 && !hero.paralyzed)
  )
    return "finn";
  return lindeCourier(heroes);
}

const spots: Record<Traveller["id"], readonly [number, number]> = {
  aria: [0.9, -0.65],
  leon: [1.4, -0.1],
  mira: [-1.7, -0.35],
  finn: [0.8, 0.5],
  lico: [-0.2, -0.65],
};
const finnWaiting: Partial<Record<Traveller["id"], readonly [number, number]>> = {
  leon: [-2.15, -0.1],
  mira: [-1.1, 0.95],
  aria: [0.8, -1.4],
  lico: [0.15, -1.55],
};

export function foundingWaitingCompanion(
  hero: Traveller,
  cart: JourneyCart,
  view: RoadViewport,
  stage: string,
  worker?: Traveller["id"],
) {
  // Finn carries the basket past the cart's right side. Leon waits behind the
  // group instead of standing directly in Finn's path to the recipient.
  const waiting = (worker === "finn" && finnWaiting[hero.id]) || spots[hero.id];
  const [x, y] = waiting,
    size = roadHeroSize(view.width, view.height);
  return {
    ...hero,
    x: cart.x + (x * size) / roadScale(view.width, stage),
    lane: cart.lane + (y * size) / roadDepth(view.width, view.height),
    walking: false,
  };
}

type Frame = { battle: RoadBattle; look: RoadLook };
export function foundingArrived(frame: Frame, cart: JourneyCart) {
  return (
    cart.asset === foundingCartAsset &&
    !!frame.look.foundingDraft?.completed &&
    cart.x >= frame.look.length - 1
  );
}

export function foundingTravellingCompanion(
  hero: Traveller,
  cart: JourneyCart,
  view: RoadViewport,
  stage: string,
) {
  const offsets: Partial<Record<Traveller["id"], readonly [number, number]>> = {
    aria: [-0.9, -0.9],
    leon: [-1.5, -0.1],
    mira: [-2, -0.8],
    lico: [-0.3, -1.6],
  };
  const offset = offsets[hero.id];
  if (!offset || hero.hp <= 0 || hero.paralyzed) return hero;
  const size = roadHeroSize(view.width, view.height);
  return {
    ...hero,
    x: cart.x + (offset[0] * size) / roadScale(view.width, stage),
    lane: cart.lane + (offset[1] * size) / roadDepth(view.width, view.height),
    walking: false,
    facing: 1 as const,
  };
}

export function foundingArrivalHero(
  hero: Traveller,
  cart: JourneyCart,
  view: RoadViewport,
  stage: string,
  grip: (
    hero: Traveller,
    cart: JourneyCart,
    view: RoadViewport,
    stage: string,
  ) => {
    x: number;
    lane: number;
  },
) {
  if (hero.id === "finn") return { ...hero, ...grip(hero, cart, view, stage), walking: false };
  if (hero.id === "lico" && hero.hp > 0 && !hero.paralyzed) {
    const size = roadHeroSize(view.width, view.height);
    return {
      ...hero,
      x: cart.x + (size * 1.05) / roadScale(view.width, stage),
      lane: cart.lane - (size * 0.6) / roadDepth(view.width, view.height),
      walking: false,
      facing: 1 as const,
    };
  }
  return foundingTravellingCompanion(hero, cart, view, stage);
}
