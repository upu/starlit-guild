import type { RoadLook } from "./road-look.ts";

/** Reset interpolated positions only when a fixed site's tableau changes. */
export class RoadFixedSceneReset {
  private previous: (boolean | undefined)[] = [];

  changed(look: RoadLook) {
    const current = [
      look.manorDelivery?.garden,
      look.foundation?.exposed,
      look.forestReturn?.scene,
      look.waterwaySearchReturn?.scene,
      look.stoneSelection?.sorted,
      look.manorSurvey?.gathering,
      look.gardenReception?.arrived,
    ];
    const changed = current.some(
      (value, index) => this.previous[index] !== undefined && value !== this.previous[index],
    );
    this.previous = current;
    return changed;
  }
}
