import type { JourneyCart } from "./road-journey-cart.ts";
import { journeyCartWidth } from "./road-journey-cart.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { FoundingJob } from "./road-founding-queue.ts";
import { foundingCargoPoint } from "./road-founding-cargo.ts";
import { foundingRecipientFoot, foundingRecipientHand } from "./road-founding-recipient.ts";
import { waterwayMix, type WaterwayPoint } from "./road-waterway-contacts.ts";
import type { Traveller } from "./road-view.ts";

export type FoundingItemTurn = { point: WaterwayPoint; foot: WaterwayPoint; at: number };
type Smoothing = {
  point: WaterwayPoint;
  hero: Traveller;
  now: number;
  phase: string;
  lastItem?: WaterwayPoint;
  facing?: number;
  turn?: FoundingItemTurn;
};
export function smoothFoundingItem(input: Smoothing) {
  const { hero, now, phase, lastItem, facing } = input;
  let { point, turn } = input;
  const moving = phase === "walk" || phase === "give";
  if (moving && lastItem && facing !== undefined && facing !== hero.facing)
    turn = { point: lastItem, foot: { x: hero.x, lane: hero.lane }, at: now };
  if (moving && turn) {
    const progress = (now - turn.at) / 400;
    point = waterwayMix(
      {
        x: turn.point.x + hero.x - turn.foot.x,
        lane: turn.point.lane + hero.lane - turn.foot.lane,
      },
      point,
      progress,
    );
    if (progress >= 1) turn = undefined;
  }
  return { point, turn };
}

export function foundingItemPoint(
  hand: WaterwayPoint,
  job: FoundingJob,
  cart: JourneyCart,
  view: RoadViewport,
  stage: string,
  phase: "pickup" | "walk" | "give" | "return",
  at: number | undefined,
  now: number,
): WaterwayPoint | undefined {
  if (phase === "pickup") {
    if (at === undefined) return;
    return waterwayMix(
      foundingCargoPoint(job, cart, view, stage, journeyCartWidth(view, cart)),
      hand,
      (now - at) / 600,
    );
  }
  if (phase === "give")
    return waterwayMix(
      hand,
      foundingRecipientHand(foundingRecipientFoot(cart, view, stage), view, stage),
      (now - (at ?? now)) / 600,
    );
  return phase === "return" ? undefined : hand;
}
