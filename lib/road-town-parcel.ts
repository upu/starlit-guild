import { roadDepth, roadHeroSize, roadScale, roadX } from "./road-layout.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import { townHandoff } from "./road-town-handoff.ts";
import { ROAD_CARRY_DISTANCE } from "./chapter-road.ts";
import { TownSoloDelivery } from "./road-town-solo.ts";

export { townParcelAsset } from "./road-town-handoff.ts";
export { TownHandoffSync } from "./road-town-sync.ts";
export const townParcelCarry = (battle: RoadBattle, look?: RoadLook) =>
  !!look?.storybookHeroes && look.quest === "town-deliveries" && battle.gathering?.task === "carry";
export const townParcelCheck = (battle: RoadBattle, look?: RoadLook) =>
  !!look?.storybookHeroes &&
  look.quest === "town-deliveries" &&
  look.work?.label === "倉庫で荷札を確かめる" &&
  battle.gathering?.task === "pack";
export const townParcelFigure = (view: RoadViewport) =>
  (roadHeroSize(view.width, view.height) * 0.9) / 144;
export const townParcelWidth = (view: RoadViewport) => 96 * townParcelFigure(view);

/** The box occupies ground space until the two carriers lift it. */
export function townParcelObstacle(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
  if (
    (!townParcelCheck(battle, look) && !townParcelCarry(battle, look)) ||
    !battle.gathering ||
    (battle.townParcelLift ?? 0) > 0
  )
    return undefined;
  const width = townParcelWidth(view);
  return {
    x:
      (roadX(battle.gathering.x + 65, battle.distance, view.width, battle.stage) / view.width) *
      560,
    lane: 0.82,
    clearance: {
      x: ((width * 0.45) / view.width) * 560,
      lane: (width * 0.12) / roadDepth(view.width, view.height),
    },
  };
}

/** The two inward-facing wrists meet the lower ends of the same box. */
export function townParcelFoot(
  id: "aria" | "leon",
  center: number,
  stage: string,
  view: RoadViewport,
) {
  const figure = townParcelFigure(view);
  const aria = id === "aria";
  const wristX = aria ? 15 : 17;
  const wristY = aria ? -44 : -49;
  return {
    x:
      center +
      ((aria ? -1 : 1) * (townParcelWidth(view) * 0.47 + wristX * figure)) /
        roadScale(view.width, stage),
    lane: 0.82 + ((-45 - wristY) * figure) / roadDepth(view.width, view.height),
    facing: aria ? (1 as const) : (-1 as const),
  };
}

export function townParcelSupported(battle: RoadBattle, look?: RoadLook) {
  return (
    townParcelCarry(battle, look) &&
    ["aria", "leon"].every(
      (id) =>
        look?.workers.includes(id) &&
        battle.heroes.some((hero) => hero.id === id && hero.hp > 0 && !hero.paralyzed),
    )
  );
}

export function arrangeTownParcel(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
  if (!townParcelCarry(battle, look) || !battle.gathering || !look.work) return;
  look.work.frame = "town-parcel";
  for (const hero of battle.heroes) {
    if (
      (hero.id === "aria" || hero.id === "leon") &&
      hero.hp > 0 &&
      !hero.paralyzed &&
      look.workers.includes(hero.id)
    )
      Object.assign(hero, townParcelFoot(hero.id, battle.gathering.x + 65, battle.stage, view));
  }
}

export class TownParcelLift {
  private solo = new TownSoloDelivery();
  private value = 0;
  private center?: number;
  private delivering = false;
  private destination?: number;
  private groundAt?: number;
  private fadeAt?: number;
  private stagedCenter?: number;
  private routeCenter?: number;

  /** Keep the checked box and both carrier targets at their actual pickup point. */
  prepare(battle: RoadBattle, look: RoadLook, view: RoadViewport, reset: boolean) {
    if (reset) this.stagedCenter = undefined;
    if (townParcelCheck(battle, look) && battle.gathering)
      this.stagedCenter = battle.gathering.x + 65;
    this.routeCenter = undefined;
    if (!townParcelCarry(battle, look) || !battle.gathering || this.stagedCenter === undefined)
      return battle;
    this.routeCenter = battle.gathering.x + 65;
    const center = this.center ?? this.stagedCenter;
    return {
      ...battle,
      gathering: { ...battle.gathering, x: center - 65, lane: 0.82 },
      heroes: battle.heroes.map((hero) =>
        hero.id === "aria" || hero.id === "leon"
          ? { ...hero, ...townParcelFoot(hero.id, center, battle.stage, view) }
          : hero,
      ),
    };
  }
  update(
    battle: RoadBattle,
    look: RoadLook,
    dt: number,
    reduced: boolean,
    reset: boolean,
    view?: RoadViewport,
  ) {
    if (reset) {
      this.clear();
      this.solo.reset();
    }
    this.resumeDelivery(battle, look);
    if (view && this.soloDelivery(battle, look, view, dt, reduced)) return;
    if (view && this.shouldDeliver(battle, look, view)) {
      this.deliver(battle, look, dt, reduced, view);
      return;
    }
    if (look.townFinalizing) battle.townVisualComplete = true;
    if (!townParcelCarry(battle, look)) this.clear();
    if (!townParcelCarry(battle, look) || !battle.gathering) return;
    this.carry(battle, look, dt, reduced, view);
  }

  private soloDelivery(
    battle: RoadBattle,
    look: RoadLook,
    view: RoadViewport,
    dt: number,
    reduced: boolean,
  ) {
    const point = battle.gathering;
    const candidates = battle.heroes.filter(
      (h) => (h.id === "aria" || h.id === "leon") && h.hp > 0 && !h.paralyzed,
    );
    if (
      !this.solo.active &&
      point &&
      candidates.length === 1 &&
      look.storybookHeroes &&
      look.quest === "town-deliveries" &&
      (point.task === "carry" || look.work?.label === "品を渡して控えを受け取る")
    ) {
      const center = this.center ?? point.x + 65;
      const destination =
        this.destination ??
        (look.work?.label === "品を渡して控えを受け取る"
          ? point.x + 65
          : center + (point.remaining / point.total) * ROAD_CARRY_DISTANCE + 70);
      this.solo.begin(battle, center, destination, this.value);
    }
    return this.solo.update(battle, look, view, dt, reduced);
  }

  private resumeDelivery(battle: RoadBattle, look: RoadLook) {
    if (
      this.center !== undefined ||
      look.quest !== "town-deliveries" ||
      !look.storybookHeroes ||
      look.work?.label !== "品を渡して控えを受け取る" ||
      !battle.gathering
    )
      return;
    this.center = battle.gathering.x + 65;
    this.value = 1;
  }

  private carry(
    battle: RoadBattle,
    look: RoadLook,
    dt: number,
    reduced: boolean,
    view?: RoadViewport,
  ) {
    if (!battle.gathering) return;
    const target = townParcelSupported(battle, look) ? 1 : 0;
    const change = Math.min(Math.abs(target - this.value), dt * 2.5);
    this.value = reduced ? target : this.value + Math.sign(target - this.value) * change;
    const intended = this.routeCenter ?? battle.gathering.x + 65;
    this.destination =
      intended + (battle.gathering.remaining / battle.gathering.total) * ROAD_CARRY_DISTANCE + 70;
    this.center ??= this.stagedCenter ?? intended;
    if (target && this.value === 1) {
      const step = Math.min(Math.abs(intended - this.center), dt * 60);
      this.center += Math.sign(intended - this.center) * step;
    }
    if (target && this.routeCenter === undefined) {
      const offset = this.center - intended;
      battle.heroes = battle.heroes.map((hero) =>
        hero.id === "aria" || hero.id === "leon" ? { ...hero, x: hero.x + offset } : hero,
      );
    }
    battle.gathering = { ...battle.gathering, x: this.center - 65 };
    battle.townParcelLift = this.value;
    const remaining = battle.gathering.remaining / battle.gathering.total;
    if (view && remaining < 0.35) {
      battle.townParcelDestination = this.destination;
      townHandoff(battle, view, this.destination, undefined, (0.35 - remaining) / 0.1);
    }
  }

  private clear() {
    this.value = 0;
    this.center = undefined;
    this.delivering = false;
    this.destination = undefined;
    this.groundAt = undefined;
    this.fadeAt = undefined;
  }

  private shouldDeliver(battle: RoadBattle, look: RoadLook, view?: RoadViewport) {
    return (
      !!view &&
      !!look.storybookHeroes &&
      look.quest === "town-deliveries" &&
      (look.work?.label === "品を渡して控えを受け取る" ||
        (this.delivering && this.finishPending(battle.time, look.work?.label))) &&
      !!battle.gathering &&
      this.center !== undefined &&
      (this.value > 0 || this.delivering) &&
      ["aria", "leon"].every((id) =>
        battle.heroes.some((h) => h.id === id && h.hp > 0 && !h.paralyzed),
      )
    );
  }

  private finishPending(time: number, label?: string) {
    if (this.groundAt === undefined || time - this.groundAt < 2200) return true;
    if (label !== "倉庫で荷札を確かめる") return false;
    return this.fadeAt === undefined || time - this.fadeAt < 400;
  }

  private deliver(
    battle: RoadBattle,
    look: RoadLook,
    dt: number,
    reduced: boolean,
    view: RoadViewport,
  ) {
    const point = battle.gathering,
      center = this.center,
      work = look.work;
    if (!point || center === undefined || !work) return;
    this.prepareReturn(battle, work.label, point.x + 65, reduced);
    const intended =
      this.delivering && this.destination !== undefined ? this.destination : point.x + 65;
    this.destination = intended;
    const step = reduced
      ? Math.abs(intended - center)
      : Math.min(Math.abs(intended - center), dt * 90);
    const nextCenter = center + Math.sign(intended - center) * step;
    this.center = nextCenter;
    const arrived = Math.abs(intended - nextCenter) < 0.001;
    if (arrived) this.value = reduced ? 0 : Math.max(0, this.value - dt * 2.5);
    this.delivering = true;
    look.workers = ["aria", "leon"];
    look.work = { ...work, frame: "town-parcel", label: "品を渡して控えを受け取る" };
    battle.heroes = deliveryHeroes(battle, nextCenter, view, !arrived && !reduced);
    battle.gathering = { ...point, kind: "cargo", task: "carry", x: nextCenter - 65 };
    battle.townParcelLift = this.value;
    battle.townParcelHandoff = true;
    battle.townParcelDestination = intended;
    const age = this.groundAge(battle.time, reduced);
    townHandoff(battle, view, intended, age);
    if (look.townFinalizing && age !== undefined && age >= 2000) battle.townVisualComplete = true;
  }

  private prepareReturn(battle: RoadBattle, label: string, warehouseX: number, reduced: boolean) {
    if (label !== "倉庫で荷札を確かめる") return;
    battle.townNextWarehouseX = warehouseX;
    if (this.groundAt !== undefined && battle.time - this.groundAt >= 1800)
      this.fadeAt ??= battle.time;
    if (this.fadeAt !== undefined && !reduced)
      battle.townTransitionFade = Math.min(1, (battle.time - this.fadeAt) / 400);
  }

  private groundAge(time: number, reduced: boolean) {
    if (this.value === 0) this.groundAt ??= time;
    if (this.groundAt === undefined) return undefined;
    return reduced ? 2200 : time - this.groundAt;
  }
}

function deliveryHeroes(battle: RoadBattle, center: number, view: RoadViewport, walking: boolean) {
  return battle.heroes.map((hero) =>
    hero.id === "aria" || hero.id === "leon"
      ? { ...hero, ...townParcelFoot(hero.id, center, battle.stage, view), walking }
      : hero,
  );
}
