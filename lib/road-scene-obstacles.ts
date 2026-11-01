import type { RoadLook } from "./road-look.ts";
import type { RoadBattle } from "./road-view.ts";
import { roadWorkObstacle } from "./road-work-layout.ts";
import { journeyCartObstacles } from "./road-journey-cart.ts";
import { foundingShaftObstacles } from "./road-founding-shafts.ts";
import { foundingBattleObstacles } from "./road-founding-recipient.ts";
import type { WaterwayPoint } from "./road-waterway-contacts.ts";
import { mossHatchObstacles } from "./road-moss-hatch-layout.ts";
import { housecallObstacles } from "./road-housecalls-layout.ts";
import { berneCallsObstacles } from "./road-berne-calls.ts";
import { lindeDeliveryObstacles } from "./road-linde-delivery.ts";
import { foundationObstacles } from "./road-berne-foundation.ts";
import { foundationGearObstacles } from "./road-foundation-return.ts";
import { manorDeliveryObstacles } from "./road-manor-deliveries.ts";
import { townParcelObstacle } from "./road-town-parcel.ts";
import { seedlingCartObstacle } from "./road-seedling-cart-start.ts";
import { seedlingReturnObstacles } from "./road-seedling-return-obstacle.ts";
import { transplantBasketReservation } from "./road-transplant-basket-placement.ts";

function foundationSceneObstacles(look: RoadLook, view: { width: number; height: number }) {
  if (!look.foundation) return [];
  return [
    ...foundationObstacles(view),
    ...(look.foundation.exposed ? [] : foundationGearObstacles(view)),
  ];
}

export function sceneObstacles(
  battle: RoadBattle,
  look: RoadLook,
  width: number,
  height: number,
  foot: { x: number; lane: number },
  positions?: {
    recipient?: WaterwayPoint;
    dropped?: WaterwayPoint;
    lico?: WaterwayPoint;
    leon?: WaterwayPoint;
  },
) {
  const view = { width, height };
  const town = townParcelObstacle(battle, look, view);
  const seedling = seedlingCartObstacle(battle, look, view);
  const seedlingReturn = seedlingReturnObstacles(battle, look, view, positions);
  const basket = transplantBasketReservation(battle, view);
  const work =
    town ??
    seedling ??
    (look.mossBeds
      ? undefined
      : roadWorkObstacle(battle, width, height, foot, look.work?.frame, look.storybookHeroes));
  return [
    ...(work ? [work] : []),
    ...seedlingReturn,
    ...(basket ? [basket] : []),
    ...journeyCartObstacles(battle, view),
    ...foundingShaftObstacles(battle, view, look),
    ...foundingBattleObstacles(battle, look, view, positions),
    ...mossHatchObstacles(look, view, battle),
    ...(look.housecalls ? housecallObstacles(view) : []),
    ...(look.berneCalls ? berneCallsObstacles(view) : []),
    ...(look.lindeDelivery ? lindeDeliveryObstacles(view, look.lindeDelivery.portrait) : []),
    ...foundationSceneObstacles(look, view),
    ...(look.manorDelivery && !look.manorDelivery.garden ? manorDeliveryObstacles(view) : []),
  ];
}
