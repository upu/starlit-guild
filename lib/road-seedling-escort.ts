import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { spacedPartyTargets, type PartyPosition, type PartyTarget } from "./road-party-spacing.ts";
import { roadHeroSize } from "./road-layout.ts";
import { seedlingCartObstacle } from "./road-seedling-cart-start.ts";
import { formationGap } from "./road-fixed-scene-layout.ts";
import { partyTargets } from "./road-motion-targets.ts";

type Context = { battle: RoadBattle; look: RoadLook };
type Options = { camera: number; reduced: boolean; previous?: PartyPosition; newRun: boolean };

/** Keep the side chosen after combat until this carrying segment ends. */
export class SeedlingEscortSide {
  private right?: boolean;

  targets(frame: Context, view: RoadViewport, options: Options) {
    const { battle, look } = frame;
    const draft = partyTargets(frame, options.camera, view.width, view.height, options.reduced);
    const adjusted = this.adjust(
      draft,
      { ...battle, distance: options.camera },
      look,
      view,
      options.previous,
      options.newRun,
    );
    const spaced = spacedPartyTargets(
      adjusted,
      formationGap(battle, view.width, view.height, look),
    );
    return keepBasketOnRoad(spaced, battle, view);
  }

  adjust(
    targets: PartyTarget[],
    battle: RoadBattle,
    look: RoadLook,
    view: RoadViewport,
    previous: PartyPosition | undefined,
    newRun: boolean,
  ) {
    const cart = seedlingCartObstacle(battle, look, view);
    const lico = targets.find((target) => target.id === "lico");
    if (!cart || !lico || lico.fixed) {
      this.right = undefined;
      return targets;
    }
    if (newRun) this.right = undefined;
    this.right ??= !!previous && previous.x > cart.x;
    if (!this.right) return targets;
    const x = cart.x + ((roadHeroSize(view.width, view.height) * 1.25) / view.width) * 560;
    return targets.map((target) => (target.id === "lico" ? { ...target, x, lane: 0.4 } : target));
  }
}

/** Leave room for Lico's outstretched hands and basket at both screen edges. */
export function keepBasketOnRoad(targets: PartyTarget[], battle: RoadBattle, view: RoadViewport) {
  const basket = battle.handheld?.find((item) => item.kind === "transplant-basket");
  if (!basket || basket.phase !== "held" || basket.reservation) return targets;
  const margin = ((roadHeroSize(view.width, view.height) * 0.75) / view.width) * 560;
  return targets.map((target) =>
    target.id === "lico"
      ? { ...target, x: Math.max(margin, Math.min(560 - margin, target.x)) }
      : target,
  );
}
