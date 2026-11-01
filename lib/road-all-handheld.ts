import { hasRoadHandheld, RoadHandheldMotion } from "./road-handheld.ts";
import { RoadTransplantBasket } from "./road-transplant-basket.ts";
import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";

type Frame = { battle: RoadBattle; look: RoadLook };
/** Keep quest-specific handheld props in the same renderer-only pipeline. */
export class RoadAllHandheldMotion {
  private shared = new RoadHandheldMotion();
  private transplant = new RoadTransplantBasket();
  prepare(frame: Frame, key: string, view: RoadViewport) {
    return this.transplant.prepare(this.shared.prepare(frame, key, view), key, view);
  }
  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
    const handheld = hasRoadHandheld(look) ? this.shared.finish(battle, view) : battle.handheld;
    return this.transplant.finish({ ...battle, handheld }, view);
  }
}
