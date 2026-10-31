import type { RoadBattle, Traveller } from "./road-view.ts";
import { roadTravellerCanMove } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import { roadCartSlot, type RoadViewport } from "./road-cart-layout.ts";
import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";
import { handheldPoint, type HandheldItem } from "./road-handheld.ts";
import { transplantBasketPlacement } from "./road-transplant-basket-placement.ts";
import { partyClearance } from "./road-party-spacing.ts";
import { TransplantCartCatchup } from "./road-transplant-cart-catchup.ts";

type Frame = { battle: RoadBattle; look: RoadLook };
type Foot = { x: number; lane: number };

/** Rendering-only continuity for the basket Lico carries out of the departure scene. */
export class RoadTransplantBasket {
  private cart = new TransplantCartCatchup();
  private key = "";
  private item: HandheldItem = this.freshItem();
  private target?: Foot;
  private last?: Traveller;
  private previous?: RoadBattle;
  private hold?: { gathering: RoadBattle["gathering"]; look: RoadLook; distance: number };
  private workDrop = false;

  prepare(frame: Frame, key: string, view: RoadViewport): Frame {
    const hero = frame.battle.heroes.find((actor) => actor.id === "lico");
    if (!frame.look.storybookHeroes || frame.look.quest !== "moss-transplant" || !hero) {
      this.reset("");
      return frame;
    }
    if (this.key !== key) this.reset(key);
    const enemy = frame.battle.enemies.some((actor) => actor.hp > 0);
    const working = this.isWorkReady(frame, view);
    const unavailable = !roadTravellerCanMove(hero) || !!hero.paralyzed;
    if (unavailable) this.interrupt(frame.battle, view, hero);
    if (enemy && this.item.phase === "lift") {
      this.item.phase = "ground";
      this.item.returning = false;
      this.hold = undefined;
    }
    this.scheduleDrop(frame, view, enemy, working);
    this.scheduleReturn(frame, view, enemy, unavailable);
    return this.render(frame, view, enemy);
  }
  private scheduleDrop(frame: Frame, view: RoadViewport, enemy: boolean, working: boolean) {
    if (this.item.phase !== "held" || this.target || (!enemy && !working) || !this.last) return;
    const positions = this.previous
      ? { ...frame.battle, heroes: this.previous.heroes }
      : frame.battle;
    this.target = transplantBasketPlacement(positions, this.last, view);
    if (!this.target) return;
    this.workDrop = working && !enemy;
    this.hold = {
      gathering: frame.battle.gathering && { ...frame.battle.gathering },
      look: frame.look,
      distance: this.previous?.distance ?? frame.battle.distance,
    };
  }
  private scheduleReturn(frame: Frame, view: RoadViewport, enemy: boolean, unavailable: boolean) {
    if (this.item.phase !== "ground") return;
    const doingWork = this.workDrop && frame.battle.gathering?.task === "gather";
    this.item.returning = !enemy && !doingWork && !unavailable;
    if (this.item.returning && !this.hold) this.hold = this.returnHold(frame, view);
  }
  private render(frame: Frame, view: RoadViewport, enemy: boolean): Frame {
    const active = this.isActive();
    const staged = active && this.hold ? this.heldScene(frame, this.hold) : frame;
    const source = { ...staged, battle: this.cart.update(staged.battle, active) };
    const guard =
      this.item.phase === "ground" && enemy ? this.guardFoot(frame.battle, view) : undefined;
    const foot =
      this.target ??
      (this.item.returning || this.item.phase === "lower" || this.item.phase === "lift"
        ? this.foot()
        : guard);
    return {
      battle: {
        ...source.battle,
        heroes: source.battle.heroes.map((actor) =>
          actor.id === "lico" && foot
            ? { ...actor, ...foot, facing: this.item.facing, walking: false }
            : actor,
        ),
        handheld: [
          ...(source.battle.handheld ?? []),
          { ...this.item, reservation: this.target ?? this.foot() },
        ],
      },
      look: {
        ...source.look,
        workers:
          active || guard ? [...new Set([...source.look.workers, "lico"])] : source.look.workers,
      },
    };
  }
  private isActive() {
    return !!this.target || ["lower", "lift"].includes(this.item.phase) || this.item.returning;
  }
  finish(battle: RoadBattle, view: RoadViewport) {
    const hero = battle.heroes.find((actor) => actor.id === "lico");
    if (!this.key || !hero) return battle.handheld;
    this.advance(hero, battle, view);
    this.last = { ...hero };
    this.previous = { ...battle, heroes: battle.heroes.map((actor) => ({ ...actor })) };
    return [
      ...(battle.handheld ?? []).filter((entry) => entry.hero !== "lico"),
      { ...this.item, reservation: this.target ?? this.foot() },
    ];
  }
  private advance(hero: Traveller, battle: RoadBattle, view: RoadViewport) {
    const item = this.item;
    if (this.target && this.at(hero, this.target, battle, view)) {
      item.facing = hero.facing;
      item.point = handheldPoint(item, hero, 1, view, battle.stage);
      item.phase = "lower";
      item.at = battle.time;
      this.target = undefined;
    }
    if (item.phase === "lower" && battle.time - item.at >= 450) {
      item.phase = "ground";
      if (this.workDrop) this.hold = undefined;
    }
    if (item.phase === "ground" && item.returning && this.at(hero, this.foot(), battle, view)) {
      item.phase = "lift";
      item.at = battle.time;
    }
    this.completeLift(battle.time);
    if (item.phase === "lower" || item.phase === "lift") hero.facing = item.facing;
  }
  private completeLift(time: number) {
    if (this.item.phase !== "lift" || time - this.item.at < 600) return;
    this.item.phase = "held";
    this.item.returning = false;
    this.item.point = undefined;
    this.hold = undefined;
    this.workDrop = false;
  }
  private at(hero: Traveller, foot: Foot | undefined, battle: RoadBattle, view: RoadViewport) {
    return (
      !!foot &&
      Math.abs(hero.x - foot.x) * roadScale(view.width, battle.stage) < 2 &&
      Math.abs(hero.lane - foot.lane) * roadDepth(view.width, view.height) < 2
    );
  }
  private foot() {
    if (!this.item.point || !this.previous || !this.last || !this.view) return undefined;
    const offset = handheldPoint(
      this.item,
      { ...this.last, x: 0, lane: 0, facing: this.item.facing },
      1,
      this.view,
      this.previous.stage,
    );
    return { x: this.item.point.x - offset.x, lane: this.item.point.lane - offset.lane };
  }
  private guardFoot(battle: RoadBattle, view: RoadViewport) {
    const foot = this.foot();
    if (!foot) return;
    const cart = battle.gathering?.task === "carry" ? battle.gathering.x + 65 : foot.x + 1;
    const side = foot.x >= cart ? 1 : -1;
    return {
      x:
        foot.x +
        (side * roadHeroSize(view.width, view.height) * 0.65) / roadScale(view.width, battle.stage),
      lane: foot.lane,
    };
  }
  private view?: RoadViewport;
  private isWorkReady(frame: Frame, view: RoadViewport) {
    this.view = view;
    if (
      frame.battle.gathering?.task !== "gather" ||
      !frame.look.workers.includes("lico") ||
      !this.last
    )
      return false;
    const target = frame.battle.heroes.find((hero) => hero.id === "lico");
    if (!target) return false;
    return (
      Math.hypot(
        (this.last.x - target.x) * roadScale(view.width, frame.battle.stage),
        (this.last.lane - target.lane) * roadDepth(view.width, view.height),
      ) <=
      roadHeroSize(view.width, view.height) * 0.65
    );
  }
  private heldScene(frame: Frame, hold: NonNullable<RoadTransplantBasket["hold"]>): Frame {
    return {
      battle: { ...frame.battle, gathering: hold.gathering, distance: hold.distance },
      look: {
        ...frame.look,
        work: hold.look.work,
        frontCarriers: hold.look.frontCarriers,
        puller: hold.look.puller,
      },
    };
  }
  private returnHold(frame: Frame, view: RoadViewport) {
    let gathering = frame.battle.gathering && { ...frame.battle.gathering };
    const foot = this.foot();
    if (this.workDrop && gathering?.task === "carry" && foot) {
      // The next cart must approach from behind, not appear on the basket
      // while Lico returns from the planting site.
      const slot = roadCartSlot(view, frame.battle.stage, true, true, true, "finn");
      const gap = partyClearance(view.width, view.height);
      const clearance =
        ((gap.x / 560) * view.width * 1.2) / roadScale(view.width, frame.battle.stage);
      gathering = { ...gathering, x: Math.min(gathering.x, foot.x - slot.offset - clearance - 65) };
    }
    return {
      gathering,
      look: frame.look,
      distance: this.previous?.distance ?? frame.battle.distance,
    };
  }
  private interrupt(battle: RoadBattle, view: RoadViewport, hero: Traveller) {
    if (this.item.phase === "ground") return;
    if (this.item.phase === "held") {
      const fallen = this.last ?? hero;
      this.item.facing = fallen.facing;
      this.item.point = handheldPoint(this.item, fallen, 1, view, battle.stage);
    }
    this.item.phase = "ground";
    this.item.returning = false;
    this.target = undefined;
    this.hold = undefined;
  }
  private freshItem(): HandheldItem {
    return {
      hero: "lico",
      kind: "transplant-basket",
      phase: "held",
      at: 0,
      returning: false,
      facing: 1,
    };
  }
  private reset(key: string) {
    this.cart.reset();
    this.key = key;
    this.item = this.freshItem();
    this.last = undefined;
    this.previous = undefined;
    this.target = undefined;
    this.hold = undefined;
    this.view = undefined;
    this.workDrop = false;
  }
}
