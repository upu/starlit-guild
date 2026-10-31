import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { JourneyCart } from "./road-journey-cart.ts";
import type { BrekkaCartCamera } from "./road-brekka-cart-camera.ts";
import { foundingCartAsset } from "./road-founding-formation.ts";

export function journeyCameraDistance(
  camera: BrekkaCartCamera,
  frame: { battle: RoadBattle; look: RoadLook },
  view: RoadViewport,
  cart: JourneyCart,
  active: boolean,
  positions: number[],
) {
  const founding = cart.asset === foundingCartAsset;
  if (frame.look.brekkaJourney || founding)
    return camera.update(cart.x, view, frame.battle.stage, positions, founding);
  return active ? cart.x : frame.battle.distance;
}
