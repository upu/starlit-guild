import type { RoadLook } from "./road-look.ts";
import type { JourneyCart } from "./road-journey-cart.ts";
import { foundingCargo } from "./road-founding-cargo.ts";
export const foundingWarehouseBackground = "/storybook-study/founding-linde-warehouse-v1.png";

/** Finish the road before fading to the warehouse; this clock is visual only. */
export class FoundingArrival {
  private elapsed = 0;
  private previous?: number;
  private transitioning = false;

  reset() {
    this.elapsed = 0;
    this.previous = undefined;
    this.transitioning = false;
  }

  update(ready: boolean, time: number, reduced: boolean) {
    const delta = Math.max(0, Math.min(100, time - (this.previous ?? time)));
    this.previous = time;
    if (ready) this.transitioning = true;
    if (!this.transitioning) this.elapsed = 0;
    else if (reduced) this.elapsed = 1500;
    else this.elapsed = Math.min(1500, this.elapsed + delta);
    const switchScene = this.elapsed >= 900;
    const fade = Math.max(0, Math.min(1, (this.elapsed - 300) / 600, (1500 - this.elapsed) / 600));
    return { switchScene, fade, complete: this.elapsed >= 1500 };
  }
}

export function applyFoundingArrival(
  arrival: FoundingArrival,
  look: RoadLook,
  cart: JourneyCart,
  pending: boolean,
  delivered: Set<number>,
  time: number,
  reduced: boolean,
) {
  if (!look.foundingDraft) return;
  cart.cargo = foundingCargo(look.foundingDraft.total, delivered);
  // Once the visible handoff is finished and the group is moving again, a
  // fade can represent the remainder of the road without a long silent wait.
  const ready =
    !!look.foundingDraft.completed &&
    !pending &&
    (cart.phase === "moving" || cart.x >= look.length - 1);
  const result = arrival.update(ready, time, reduced);
  look.foundingDraft.arrivalScene = result.switchScene;
  look.foundingDraft.fade = result.fade;
  look.foundingDraft.visualComplete = result.complete;
  if (result.switchScene) {
    look.background = foundingWarehouseBackground;
    look.backgroundShade = 0;
  }
}
