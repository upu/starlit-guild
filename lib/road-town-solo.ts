import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";
import { waterwayFoot, type WaterwayPoint } from "./road-waterway-contacts.ts";
import { townHandoff } from "./road-town-handoff.ts";

type Carrier = "aria" | "leon";
type Phase =
  "drop" | "approach" | "lift" | "detour" | "walk" | "align" | "lower" | "handoff" | "fade";
const available = (hero: Traveller) => hero.hp > 0 && !hero.paralyzed;
const carrier = (battle: RoadBattle) =>
  battle.heroes.find((hero) => (hero.id === "aria" || hero.id === "leon") && available(hero));

function pickupFoot(id: Carrier, center: number, view: RoadViewport, lane = 0.82) {
  const figure = (roadHeroSize(view.width, view.height) * 0.9) / 144;
  return waterwayFoot(
    {
      x: center,
      lane: lane - (45 * figure) / roadDepth(view.width, view.height),
    },
    id === "aria" ? [125, 110] : [130, 106],
    1,
    view,
  );
}

function move(from: WaterwayPoint, to: WaterwayPoint, view: RoadViewport, dt: number) {
  const scale = roadScale(view.width),
    depth = roadDepth(view.width, view.height);
  const dx = (to.x - from.x) * scale,
    dy = (to.lane - from.lane) * depth;
  const distance = Math.hypot(dx, dy);
  const ratio = distance ? Math.min(1, (110 * dt) / distance) : 1;
  return {
    point: { x: from.x + (to.x - from.x) * ratio, lane: from.lane + (to.lane - from.lane) * ratio },
    arrived: ratio === 1,
  };
}

/** Rendering-only fallback when one of the two carriers cannot move. */
export class TownSoloDelivery {
  private phase?: Phase;
  private actor?: Carrier;
  private foot?: WaterwayPoint;
  private otherFoot?: WaterwayPoint;
  private center = 0;
  private destination = 0;
  private lift = 0;
  private lane = 0.82;
  private age = 0;
  private source?: NonNullable<RoadBattle["gathering"]>;
  private nextWarehouse?: number;

  get active() {
    return this.phase !== undefined;
  }

  reset() {
    this.phase = undefined;
    this.actor = undefined;
    this.foot = undefined;
    this.otherFoot = undefined;
    this.nextWarehouse = undefined;
  }

  begin(battle: RoadBattle, center: number, destination: number, lift: number) {
    const worker = carrier(battle);
    if (!worker || !battle.gathering) return false;
    this.actor = worker.id as Carrier;
    this.foot = { x: worker.x, lane: worker.lane };
    const other = battle.heroes.find(
      (hero) => hero.id !== worker.id && (hero.id === "aria" || hero.id === "leon"),
    );
    this.otherFoot = other ? { x: other.x, lane: other.lane } : undefined;
    this.center = center;
    this.destination = destination;
    this.lift = lift;
    this.lane = 0.82;
    this.age = 0;
    this.source = { ...battle.gathering };
    this.phase = "drop";
    return true;
  }

  update(battle: RoadBattle, look: RoadLook, view: RoadViewport, dt: number, reduced: boolean) {
    if (!this.phase || !this.actor || !this.foot || !this.source || !look.work) return false;
    const worker =
      battle.heroes.find((hero) => hero.id === this.actor && available(hero)) ??
      this.replaceCarrier(battle);
    if (!worker) {
      this.reset();
      return false;
    }
    const label = look.work.label;
    if (label === "倉庫で荷札を確かめる" && battle.gathering)
      this.nextWarehouse = battle.gathering.x + 65;
    if (reduced) {
      this.center = this.destination;
      this.lift = 0;
      this.lane = 0.82;
      this.phase = "handoff";
      this.age = 2200;
    } else this.advance(view, battle.phase === "rest" ? 0 : dt);
    this.followCompanion(battle, view, battle.phase === "rest" ? 0 : dt, reduced);
    this.draw(battle, look, worker, view);
    this.finish(battle, look, label, reduced);
    return true;
  }

  private replaceCarrier(battle: RoadBattle) {
    const worker = carrier(battle);
    if (!worker) return undefined;
    this.otherFoot = this.foot;
    this.actor = worker.id as Carrier;
    this.foot = { x: worker.x, lane: worker.lane };
    // Once the shopkeeper has begun picking up the box, only the receipt
    // changes hands. Earlier interruptions return the box to the ground.
    if (this.phase !== "handoff" || this.age < 450) this.next("drop");
    return worker;
  }

  private followCompanion(battle: RoadBattle, view: RoadViewport, dt: number, reduced: boolean) {
    const other = battle.heroes.find(
      (hero) => hero.id !== this.actor && (hero.id === "aria" || hero.id === "leon"),
    );
    if (!other || !this.otherFoot) return;
    if (!available(other)) {
      Object.assign(other, this.otherFoot);
      return;
    }
    const size = roadHeroSize(view.width, view.height);
    const target = {
      x: this.center - (size * 1.25) / roadScale(view.width),
      lane: 0.82 + (size * 0.15) / roadDepth(view.width, view.height),
    };
    const step = move(this.otherFoot, target, view, reduced ? Infinity : dt);
    const facing = target.x < this.otherFoot.x ? -1 : 1;
    this.otherFoot = step.point;
    Object.assign(other, step.point, { facing, walking: !step.arrived && dt > 0 });
  }

  private finish(battle: RoadBattle, look: RoadLook, label: string, reduced: boolean) {
    if (this.phase === "fade" && this.age >= 400) this.reset();
    if (this.phase !== "handoff" || this.age < 2200) return;
    if (look.townFinalizing) {
      battle.townVisualComplete = true;
      return;
    }
    if (label === "商店へ荷物を運ぶ" || label === "品を渡して控えを受け取る") return;
    if (reduced) this.reset();
    else this.next("fade");
  }

  private advance(view: RoadViewport, dt: number) {
    if (!this.foot) return;
    this.age += dt * 1000;
    switch (this.phase) {
      case "drop":
        this.lower(dt, "approach");
        break;
      case "lower":
        this.lower(dt, "handoff");
        break;
      case "lift":
        this.lift = Math.min(1, this.lift + dt * 2.5);
        if (this.lift === 1) this.next("detour");
        break;
      case "approach":
        this.approach(view, dt);
        break;
      case "detour":
        this.shiftLane(
          view,
          dt,
          0.82 -
            (roadHeroSize(view.width, view.height) * 0.85) / roadDepth(view.width, view.height),
          "walk",
        );
        break;
      case "walk":
        this.walk(view, dt);
        break;
      case "align":
        this.shiftLane(view, dt, 0.82, "lower");
        break;
    }
  }

  private lower(dt: number, next: Phase) {
    this.lift = Math.max(0, this.lift - dt * 2.5);
    if (!this.lift) this.next(next);
  }
  private approach(view: RoadViewport, dt: number) {
    if (!this.actor || !this.foot) return;
    const step = move(this.foot, pickupFoot(this.actor, this.center, view, this.lane), view, dt);
    this.foot = step.point;
    if (step.arrived) this.next("lift");
  }
  private walk(view: RoadViewport, dt: number) {
    if (!this.actor) return;
    const step = Math.min(Math.abs(this.destination - this.center), 90 * dt);
    this.center += Math.sign(this.destination - this.center) * step;
    this.foot = pickupFoot(this.actor, this.center, view, this.lane);
    if (this.center === this.destination) this.next("align");
  }
  private shiftLane(view: RoadViewport, dt: number, target: number, next: Phase) {
    if (!this.actor) return;
    const step = Math.min(
      Math.abs(target - this.lane),
      (75 * dt) / roadDepth(view.width, view.height),
    );
    this.lane += Math.sign(target - this.lane) * step;
    this.foot = pickupFoot(this.actor, this.center, view, this.lane);
    if (this.lane === target) this.next(next);
  }

  private next(phase: Phase) {
    this.phase = phase;
    this.age = 0;
  }

  private draw(battle: RoadBattle, look: RoadLook, worker: Traveller, view: RoadViewport) {
    if (!this.foot || !this.source || !this.actor || !look.work) return;
    const walking =
      battle.phase !== "rest" && ["approach", "detour", "walk", "align"].includes(this.phase ?? "");
    Object.assign(worker, this.foot, { facing: 1, walking });
    battle.gathering = {
      ...this.source,
      kind: "cargo",
      task: "carry",
      x: this.center - 65,
      lane: this.lane,
    };
    battle.townParcelLift = this.lift;
    battle.townParcelLiftHeight = this.phase === "drop" ? 45 : 33;
    battle.townParcelHandoff = true;
    battle.townSoloCarrier = this.actor;
    battle.townParcelDestination = this.destination;
    battle.townNextWarehouseX = this.nextWarehouse;
    battle.waterwayActions = { poses: {}, props: [], debrisHidden: false, closeContact: false };
    look.workers = [];
    look.work = {
      ...look.work,
      frame: "town-parcel",
      label:
        this.phase === "handoff" || this.phase === "fade"
          ? "品を渡して控えを受け取る"
          : "商店へ荷物を運ぶ",
    };
    this.drawPose(battle);
    if (this.phase === "handoff" || this.phase === "fade")
      townHandoff(
        battle,
        view,
        this.destination,
        this.phase === "fade" ? 2200 : this.age,
        1,
        this.actor,
      );
    if (this.phase === "fade") battle.townTransitionFade = Math.min(1, this.age / 400);
  }

  private drawPose(battle: RoadBattle) {
    const actor = this.actor,
      scene = battle.waterwayActions;
    if (
      !actor ||
      !scene ||
      !["lift", "detour", "walk", "align", "lower"].includes(this.phase ?? "")
    )
      return;
    scene.poses[actor] =
      ["detour", "walk", "align"].includes(this.phase ?? "") && battle.phase !== "rest"
        ? {
            asset: `/storybook-study/${actor}-paper-walk-${actor === "aria" ? "v1" : "v2"}.webp`,
            frame: Math.floor(battle.time / 150) % 4,
          }
        : { asset: `/storybook-study/${actor}-carry-v1.webp`, frame: this.lift < 0.75 ? 3 : 0 };
  }
}
