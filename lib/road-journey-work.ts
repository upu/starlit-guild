import type { RoadBattle } from "./road-view.ts";
import { foundingCartAsset } from "./road-founding-formation.ts";

export function journeyCartWorkState(state: RoadBattle): RoadBattle {
  const cart = state.journeyCart;
  if (!cart || cart.phase === "parked") return state;
  // Preserve the carrying pose while the cart returns to its carriers.
  if (
    state.gathering &&
    !cart.asset?.includes("brekka-medical-cart") &&
    cart.asset !== foundingCartAsset
  )
    return state;
  return {
    ...state,
    gathering: { kind: "cargo", task: "carry", x: cart.x - 65, remaining: 0, total: 1 },
  };
}
