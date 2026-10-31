import type { Traveller } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { roadDepth, roadScale } from "./road-layout.ts";
import { lindeDeliveryLayout } from "./road-housecalls-layout.ts";
import { lindeCouriers } from "./road-linde-couriers.ts";
import { waterwayMix, type WaterwayPoint } from "./road-waterway-contacts.ts";

function letterTransfer(
  hand: WaterwayPoint,
  resident: WaterwayPoint,
  phase: number,
  progress: number,
  residentHold: boolean,
) {
  if (residentHold || phase === 1) return resident;
  return phase === 0
    ? waterwayMix(hand, resident, progress)
    : waterwayMix(resident, hand, progress);
}

export function lindeLetterPoint(
  hero: Traveller,
  view: RoadViewport,
  recipient: { x: number; y: number },
  active: number,
  side: -1 | 1,
  phase: number,
  progress: number,
  residentHold: boolean,
  portrait?: boolean,
) {
  const l = lindeDeliveryLayout(view, portrait),
    art = lindeCouriers[hero.id];
  if (!art) return undefined;
  const factor = (l.figureSize * 0.9) / 144;
  const [palmX, palmY] = hero.walking ? art.walkPalm : art.offerPalm;
  const hand = {
    x: hero.x + ((palmX - 96) * factor * hero.facing) / roadScale(view.width),
    lane: hero.lane + ((palmY - 176) * factor) / roadDepth(view.width, view.height),
  };
  const residentFoot = l.world(recipient.x, recipient.y);
  const residentHand = {
    x: residentFoot.x + (side * (active === 0 ? 54 : 44) * l.scale) / roadScale(view.width),
    lane: residentFoot.lane - (64 * l.scale) / roadDepth(view.width, view.height),
  };
  const point = letterTransfer(hand, residentHand, phase, progress, residentHold);
  const held = !residentHold && (phase === 0 ? progress < 0.5 : phase === 2 && progress >= 0.5);
  return { point, held, residentFoot };
}
