import type { JourneyCart } from "./road-journey-cart.ts";
import { journeyCartWidth } from "./road-journey-cart.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { WaterwayPoint } from "./road-waterway-contacts.ts";
import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";

type RoutePhase = "pickup" | "walk" | "return";
type HandoffPhase = RoutePhase | "give";

/** Guide the basket carrier around the outside of the parked cart and shafts. */
export class FoundingPickupRoute {
  private step = 0;
  private phase = "";

  reset() {
    this.step = 0;
    this.phase = "";
  }

  forActor(
    actor: string | undefined,
    phase: HandoffPhase,
    cart: JourneyCart,
    view: RoadViewport,
    stage: string,
    destination: WaterwayPoint,
  ) {
    if (actor !== "finn" || phase === "give") return destination;
    return this.target(cart, view, stage, destination, phase);
  }

  arrived(
    actor: string | undefined,
    phase: HandoffPhase,
    hero: WaterwayPoint,
    cart: JourneyCart,
    view: RoadViewport,
    stage: string,
    destination: WaterwayPoint,
  ) {
    if (actor !== "finn" || phase === "give") return;
    this.arrive(hero, this.target(cart, view, stage, destination, phase), view, stage, phase);
  }

  private target(
    cart: JourneyCart,
    view: RoadViewport,
    stage: string,
    destination: WaterwayPoint,
    phase: RoutePhase,
  ) {
    if (phase !== this.phase) {
      this.phase = phase;
      this.step = 0;
    }
    const scale = roadScale(view.width, stage);
    const depth = roadDepth(view.width, view.height);
    const size = roadHeroSize(view.width, view.height);
    const cartSize = journeyCartWidth(view, cart);
    const left = cart.x - (cartSize * 0.85) / scale;
    const below = cart.lane + (size * 0.55) / depth;
    const above = cart.lane - (size * 0.9) / depth;
    const right = cart.x + (cartSize * 0.75) / scale;
    const routes: Record<RoutePhase, WaterwayPoint[]> = {
      pickup: [
        { x: cart.x + (cartSize * 0.75) / scale, lane: below },
        { x: left, lane: below },
        { x: left, lane: above },
        { x: destination.x, lane: above },
        destination,
      ],
      walk: [
        { x: cart.x - (size * 0.42) / scale, lane: above },
        { x: right, lane: above },
        destination,
      ],
      return: [{ x: right, lane: above }, { x: left, lane: above }, destination],
    };
    const route = routes[phase];
    return route[Math.min(this.step, route.length - 1)];
  }

  private arrive(
    hero: WaterwayPoint,
    target: WaterwayPoint,
    view: RoadViewport,
    stage: string,
    phase: RoutePhase,
  ) {
    const waypointCount = phase === "pickup" ? 4 : 2;
    if (
      this.step < waypointCount &&
      Math.abs(hero.x - target.x) * roadScale(view.width, stage) < 2 &&
      Math.abs(hero.lane - target.lane) * roadDepth(view.width, view.height) < 2
    )
      this.step++;
  }
}
