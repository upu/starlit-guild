import type { JourneyCart } from "./road-journey-cart.ts";
import { journeyCartWidth } from "./road-journey-cart.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { Traveller } from "./road-view.ts";
import type { RoadBattle } from "./road-view.ts";
import type { FoundingDrop } from "./road-founding-drop.ts";
import type { WaterwayPoint } from "./road-waterway-contacts.ts";
import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";

/** Approach a dropped basket from the cart's left side when Mira takes over. */
export class FoundingRecoveryRoute {
  private step = 0;
  reset() {
    this.step = 0;
  }
  resolve(
    worker: Traveller | undefined,
    cart: JourneyCart,
    view: RoadViewport,
    stage: string,
    drop: FoundingDrop,
  ) {
    if (!worker) return;
    const destination = drop.target(worker, view);
    return destination && this.target(worker, cart, view, stage, destination);
  }
  finish(
    worker: Traveller | undefined,
    cart: JourneyCart,
    view: RoadViewport,
    battle: RoadBattle,
    drop: FoundingDrop,
  ) {
    if (!worker) return;
    const destination = drop.target(worker, view);
    if (destination) this.arrived(worker, cart, view, battle.stage, destination);
    return drop.finish(worker, battle, view);
  }
  target(
    hero: Traveller,
    cart: JourneyCart,
    view: RoadViewport,
    stage: string,
    destination: WaterwayPoint,
  ) {
    if (hero.id !== "mira") return destination;
    const scale = roadScale(view.width, stage),
      depth = roadDepth(view.width, view.height);
    const left = cart.x - (journeyCartWidth(view, cart) * 0.85) / scale;
    const size = roadHeroSize(view.width, view.height);
    const above = cart.lane - (size * 0.9) / depth;
    return [
      { x: left, lane: cart.lane + (size * 0.55) / depth },
      { x: left, lane: above },
      { x: destination.x, lane: above },
      destination,
    ][Math.min(this.step, 3)];
  }
  arrived(
    hero: Traveller,
    cart: JourneyCart,
    view: RoadViewport,
    stage: string,
    destination: WaterwayPoint,
  ) {
    if (hero.id !== "mira" || this.step >= 3) return;
    const target = this.target(hero, cart, view, stage, destination);
    const tolerance = roadHeroSize(view.width, view.height) * 0.1;
    if (
      Math.abs(hero.x - target.x) * roadScale(view.width, stage) < tolerance &&
      Math.abs(hero.lane - target.lane) * roadDepth(view.width, view.height) < tolerance
    )
      this.step++;
  }
}
