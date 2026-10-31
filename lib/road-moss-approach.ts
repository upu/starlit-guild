import type { RoadViewport } from "./road-cart-layout.ts";
import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";
import { waterwayLayout } from "./road-waterway-layout.ts";
import { waterwayFoot, waterwayPalm, type WaterwayPoint } from "./road-waterway-contacts.ts";
import { waterwayAt } from "./road-waterway-contacts.ts";
import type { RoadBattle } from "./road-view.ts";

/** Two waypoints above the worker, then the ordinary handoff position. */
export function mossApproachPoint(view: RoadViewport, stage: number) {
  const worker = waterwayLayout(view.width, view.height).world(930, 800);
  const safeLane =
    worker.lane -
    (roadHeroSize(view.width, view.height) * 1.12) / roadDepth(view.width, view.height);
  const give = waterwayFoot(waterwayPalm(worker, [62, 111], 1, view), [134, 105], 1, view);
  return stage === 0
    ? {
        x: worker.x + (roadHeroSize(view.width, view.height) * 0.28) / roadScale(view.width),
        lane: safeLane,
      }
    : { x: give.x, lane: safeLane };
}

export function mossApproachAria(view: RoadViewport, start: WaterwayPoint) {
  const safe = mossApproachPoint(view, 0),
    size = roadHeroSize(view.width, view.height);
  return { ...start, lane: safe.lane - (size * 0.9 + 15) / roadDepth(view.width, view.height) };
}

export function mossRetreat(view: RoadViewport) {
  const worker = waterwayLayout(view.width, view.height).world(930, 800),
    contact = waterwayPalm(worker, [62, 111], 1, view),
    give = waterwayFoot(contact, [134, 105], 1, view);
  return {
    x: give.x,
    lane:
      worker.lane -
      (roadHeroSize(view.width, view.height) * 1.12) / roadDepth(view.width, view.height),
  };
}

export function mossCarryTargets(
  view: RoadViewport,
  targets: { aria: WaterwayPoint; leon: WaterwayPoint; give: WaterwayPoint },
  approach: MossApproach,
  carrying: boolean,
  departing: boolean,
  atWorker: boolean,
) {
  const active = carrying && approach.active;
  return {
    aria: active ? mossApproachAria(view, targets.aria) : targets.aria,
    leon: departing
      ? mossRetreat(view)
      : active
        ? approach.leon(view, targets.leon)
        : atWorker
          ? targets.give
          : targets.leon,
  };
}

/** Let Aria clear the route before Leon carries a basket past her and the hatch. */
export class MossApproach {
  private stage = 0;
  get active() {
    return this.stage < 3;
  }
  get priority() {
    return this.stage === 0 ? ("aria" as const) : ("leon" as const);
  }
  reset() {
    this.stage = 0;
  }
  leon(view: RoadViewport, start: WaterwayPoint) {
    return this.stage === 0 ? start : mossApproachPoint(view, this.stage - 1);
  }
  advance(
    battle: RoadBattle,
    view: RoadViewport,
    targets: { aria: WaterwayPoint; leon: WaterwayPoint },
  ) {
    if (!this.active || battle.enemies.some((enemy) => enemy.hp > 0)) return;
    const aria = battle.heroes.find((hero) => hero.id === "aria"),
      leon = battle.heroes.find((hero) => hero.id === "leon");
    if (this.stage === 0) {
      if (aria && waterwayAt(aria, mossApproachAria(view, targets.aria), view)) this.stage++;
    } else if (leon && waterwayAt(leon, this.leon(view, targets.leon), view)) this.stage++;
  }
}
