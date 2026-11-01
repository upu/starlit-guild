import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import { lindeDeliveryLayout } from "./road-housecalls-layout.ts";
import { roadX } from "./road-layout.ts";
import { partyFootClearance, partyOverlap } from "./road-party-spacing.ts";

/** Pick the other side if a downed or immobilized companion occupies the approach. */
export function lindeHandoffSide(
  battle: RoadBattle,
  view: RoadViewport,
  recipient: { x: number; y: number },
  courier: Traveller["id"],
  portrait: boolean | undefined,
  current: -1 | 1,
): -1 | 1 {
  const layout = lindeDeliveryLayout(view, portrait);
  const rawGap = partyFootClearance(view.width, view.height);
  const gap = { x: rawGap.x * layout.figureRatio, lane: rawGap.lane * layout.figureRatio };
  const offset = courier === "finn" || courier === "mira" ? 80 : 99;
  const normalized = (point: { x: number; lane: number }) => ({
    x: (roadX(point.x, battle.distance, view.width, battle.stage) / view.width) * 560,
    lane: point.lane,
  });
  const blocked = (side: -1 | 1) => {
    const approach = normalized(layout.world(recipient.x + side * offset, recipient.y));
    return battle.heroes.some(
      (hero) =>
        hero.id !== courier &&
        (hero.hp <= 0 || hero.paralyzed) &&
        partyOverlap(approach, normalized(hero), gap),
    );
  };
  if (!blocked(current)) return current;
  const other = current === -1 ? 1 : -1;
  return blocked(other) ? current : other;
}
