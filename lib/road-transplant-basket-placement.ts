import type { RoadViewport } from "./road-cart-layout.ts";
import { roadCartSlot, seedlingCartWidth } from "./road-cart-layout.ts";
import { roadDepth, roadHeroSize, roadScale, roadX } from "./road-layout.ts";
import {
  partyClearance,
  partyFootClearance,
  partyOverlap,
  type PartyObstacle,
} from "./road-party-spacing.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";

type Foot = { x: number; lane: number };

/** Reserve both cart handles and other feet while choosing where to set the basket down. */
export function transplantBasketObstacles(battle: RoadBattle, view: RoadViewport): PartyObstacle[] {
  const gap = partyFootClearance(view.width, view.height);
  const nominalFigure = partyClearance(view.width, view.height);
  // Arrival tolerances and movement easing must not put the final foot back
  // inside a carrier's settled formation clearance.
  const figure = { x: nominalFigure.x * 1.15, lane: nominalFigure.lane * 1.15 };
  const project = (point: Foot) => ({
    x: (roadX(point.x, battle.distance, view.width, battle.stage) / view.width) * 560,
    lane: point.lane,
  });
  const people = battle.heroes
    .filter((hero) => hero.id !== "lico")
    .map((hero) => ({ ...project(hero), clearance: figure }));
  const enemies = battle.enemies
    .filter((enemy) => enemy.hp > 0)
    .map((enemy) => ({ ...project(enemy), clearance: { x: gap.x * 1.8, lane: gap.lane * 1.8 } }));
  const cart = battle.gathering;
  if (!cart || cart.task !== "carry") return [...people, ...enemies];
  const cartX = cart.x + 65;
  const handles = ["aria", "finn"].map((id) => {
    const slot = roadCartSlot(view, battle.stage, true, id === "finn", true, id);
    return {
      ...project({ x: cartX + slot.offset, lane: slot.lane }),
      clearance: figure,
    };
  });
  const body = {
    ...project({ x: cartX, lane: 0.82 }),
    clearance: {
      x: ((seedlingCartWidth(view) * 0.55) / view.width) * 560 + gap.x,
      lane:
        (roadHeroSize(view.width, view.height) * 0.42) / roadDepth(view.width, view.height) +
        gap.lane,
    },
  };
  return [...people, ...enemies, ...handles, body];
}

/** Find a nearby clear footprint; return undefined when the visible road has no room. */
export function transplantBasketPlacement(
  battle: RoadBattle,
  lico: Traveller,
  view: RoadViewport,
): Foot | undefined {
  const gap = partyFootClearance(view.width, view.height);
  const scale = roadScale(view.width, battle.stage);
  const originX = (roadX(lico.x, battle.distance, view.width, battle.stage) / view.width) * 560;
  const blockers = transplantBasketObstacles(battle, view);
  const candidates: Array<Foot & { score: number }> = [];
  for (let column = -8; column <= 8; column++) {
    for (let row = -8; row <= 8; row++) {
      const x = originX + column * gap.x * 0.65;
      const lane = lico.lane + row * gap.lane * 0.65;
      if (x < gap.x || x > 560 - gap.x || lane < 0.1 || lane > 1.3) continue;
      const point = { x, lane };
      if (blockers.some((blocker) => partyOverlap(point, blocker, gap))) continue;
      candidates.push({ ...point, score: Math.hypot(column, row) });
    }
  }
  const best = candidates.sort((a, b) => a.score - b.score).at(0);
  if (!best) return;
  const screenX = (best.x / 560) * view.width;
  return {
    x: (screenX - roadX(0, battle.distance, view.width, battle.stage)) / scale,
    lane: best.lane,
  };
}

/** Keep other travellers off the planted foot while the basket is on the road. */
export function transplantBasketReservation(battle: RoadBattle, view: RoadViewport) {
  const item = battle.handheld?.find((entry) => entry.kind === "transplant-basket");
  if (!item?.reservation) return;
  const gap = partyFootClearance(view.width, view.height);
  return {
    x: (roadX(item.reservation.x, battle.distance, view.width, battle.stage) / view.width) * 560,
    lane: item.reservation.lane,
    clearance: { x: gap.x * 1.4, lane: gap.lane * 1.4 },
    ignore: ["lico" as const],
  };
}
