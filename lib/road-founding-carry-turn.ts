import type { RoadBattle, Traveller } from "./road-view.ts";
import { waterwayPalm, type WaterwayPoint, type WaterwayPose } from "./road-waterway-contacts.ts";
import { lindeCourierPose, lindeCouriers } from "./road-linde-couriers.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { JourneyCart } from "./road-journey-cart.ts";
import type { FoundingJob } from "./road-founding-queue.ts";
import { removeFoundingCargo } from "./road-founding-cargo.ts";
import { drawFoundingItem } from "./road-founding-props.ts";

export const foundingTurnArt = {
  finn: {
    asset: "/storybook-study/finn-founding-turn-v1.webp",
    cell: 192,
    palms: [
      [115, 102],
      [96, 100],
    ],
  },
  leon: {
    asset: "/storybook-study/leon-basket-turn-v1.webp",
    cell: 192,
    palms: [
      [118, 107],
      [96, 108],
    ],
  },
  aria: {
    asset: "/storybook-study/aria-packing-turn-v1.webp",
    cell: 256,
    palms: [
      [113, 112],
      [96, 113],
    ],
  },
  mira: {
    asset: "/storybook-study/mira-founding-turn-v1.webp",
    cell: 192,
    palms: [
      [115, 123],
      [96, 127],
    ],
  },
} as const;
export const foundingTurnAssets = Object.values(foundingTurnArt).map(({ asset }) => asset);
type TurnArt = (typeof foundingTurnArt)[keyof typeof foundingTurnArt];
type Turn = { foot: WaterwayPoint; at: number; from: 1 | -1; to: 1 | -1 };
type TurnFrame = {
  hero: Traveller;
  now: number;
  previous: number | undefined;
  carried: boolean;
  stride: number;
  scene: NonNullable<RoadBattle["waterwayActions"]>;
  cart: JourneyCart;
  job: FoundingJob;
  view: RoadViewport;
};

function turnPose(
  hero: Traveller,
  turn: Turn,
  age: number,
  art: TurnArt,
): { pose: WaterwayPose; palm: readonly number[] } {
  const middle = age >= 150 && age < 225;
  hero.facing = middle ? 1 : age < 150 ? turn.from : turn.to;
  return {
    pose: {
      asset: art.asset,
      cell: art.cell,
      frame: middle ? 2 : 1,
    },
    palm: art.palms[Number(middle)],
  };
}

/** A carrier turns in place with the basket on the hands of each drawn pose. */
export class FoundingCarryTurn {
  private turn?: Turn;
  reset() {
    this.turn = undefined;
  }
  target(fallback: WaterwayPoint) {
    return this.turn?.foot ?? fallback;
  }

  render(frame: TurnFrame) {
    const { hero, now, previous, carried, stride, scene, cart, job, view } = frame;
    const turn = this.pose(hero, now, previous, carried, stride);
    if (!turn) return;
    const point = waterwayPalm(hero, turn.palm, hero.facing, view);
    scene.poses[hero.id] = turn.pose;
    if (cart.cargo) removeFoundingCargo(cart.cargo, job);
    drawFoundingItem(scene, job, cart, view, point, hero.lane);
    return point;
  }

  pose(
    hero: Traveller,
    now: number,
    previous: number | undefined,
    carried: boolean,
    stride: number,
  ): { pose: WaterwayPose; palm: readonly number[] } | undefined {
    const art = lindeCouriers[hero.id];
    const turning = (foundingTurnArt as Partial<Record<Traveller["id"], TurnArt>>)[hero.id];
    const walking = lindeCourierPose(hero.id, true, stride);
    if (!art || !walking || !turning) return;
    if (!this.turn && carried && previous && previous !== hero.facing)
      this.turn = {
        foot: { x: hero.x, lane: hero.lane },
        at: now,
        from: previous < 0 ? -1 : 1,
        to: hero.facing,
      };
    const turn = this.turn;
    if (!turn) return;
    const age = Math.max(0, now - turn.at);
    hero.walking = false;
    if (age >= 300) {
      hero.facing = turn.to;
      this.turn = undefined;
      return { pose: walking, palm: art.walkPalm };
    }
    if (age < 75) {
      hero.facing = turn.from;
      return { pose: walking, palm: art.walkPalm };
    }
    return turnPose(hero, turn, age, turning);
  }
}
