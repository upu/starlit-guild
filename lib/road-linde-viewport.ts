import type { RoadViewport } from "./road-cart-layout.ts";

/** Fade the two reconstructions at an orientation change, with hysteresis near square. */
export class LindeViewportTransition {
  private portrait?: boolean;
  private transition?: { target: boolean; at: number };

  update(view: RoadViewport, time: number, instant: boolean) {
    const ratio = view.height / view.width;
    this.portrait ??= ratio > 1;
    const desired = this.portrait ? ratio >= 0.95 : ratio > 1.05;
    if (instant) {
      this.portrait = desired;
      this.transition = undefined;
      return { portrait: this.portrait, fade: 0 };
    }
    if (!this.transition && desired !== this.portrait)
      this.transition = { target: desired, at: time };
    if (!this.transition) return { portrait: this.portrait, fade: 0 };
    const age = Math.max(0, time - this.transition.at);
    if (age >= 250) this.portrait = this.transition.target;
    if (age >= 500) {
      this.transition = undefined;
      return { portrait: this.portrait, fade: 0 };
    }
    return { portrait: this.portrait, fade: 1 - Math.abs(age - 250) / 250 };
  }
}
