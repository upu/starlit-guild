import type { RoadViewport } from "./road-cart-layout.ts";
import { roadHeroSize, roadScale } from "./road-layout.ts";

/** Keep the courtyard still while the cart crosses it; follow only near the edge. */
export class BrekkaCartCamera {
  private anchor?: number;

  reset() {
    this.anchor = undefined;
  }

  arrive(cartX: number, view: RoadViewport, stage: string) {
    this.anchor = cartX - (view.width * 0.28) / roadScale(view.width, stage);
    return this.anchor;
  }

  update(
    cartX: number,
    view: RoadViewport,
    stage: string,
    battlePositions: number[] = [],
    followBattle = false,
  ) {
    this.anchor ??= cartX;
    const room = (view.width * 0.28) / roadScale(view.width, stage);
    this.anchor = Math.max(this.anchor, cartX - room);
    if (followBattle && !battlePositions.length) this.anchor = Math.min(this.anchor, cartX + room);
    if (battlePositions.length) this.frameBattle(cartX, view, stage, battlePositions, followBattle);
    return this.anchor;
  }

  private frameBattle(
    cartX: number,
    view: RoadViewport,
    stage: string,
    positions: number[],
    followBattle: boolean,
  ) {
    const scale = roadScale(view.width, stage),
      margin = roadHeroSize(view.width, view.height) * 0.85;
    const all = [cartX, ...positions];
    const xs =
      followBattle && (Math.max(...all) - Math.min(...all)) * scale > view.width - 2 * margin
        ? positions
        : all;
    const minimum = Math.max(...xs) - (view.width * 0.65 - margin) / scale;
    const maximum = Math.min(...xs) + (view.width * 0.35 - margin) / scale;
    this.anchor =
      minimum <= maximum
        ? Math.max(minimum, Math.min(maximum, this.anchor ?? cartX))
        : (minimum + maximum) / 2;
  }
}
