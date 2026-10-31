import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import { FoundingVisualQueue, type FoundingJob } from "./road-founding-queue.ts";
import { FoundingOpening } from "./road-founding-opening.ts";
import { foundingCartAsset, journeyCartWidth, type JourneyCart } from "./road-journey-cart.ts";
import { lindeCourierPose, lindeCouriers } from "./road-linde-couriers.ts";
import { waterwayAt, waterwayPalm, type WaterwayPoint } from "./road-waterway-contacts.ts";
import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";
import { RoadGait } from "./road-gait.ts";
import { FoundingDrop } from "./road-founding-drop.ts";
import { FoundingPickupRoute } from "./road-founding-pickup-route.ts";
import { FoundingCarryTurn } from "./road-founding-carry-turn.ts";
import { FoundingRecoveryRoute } from "./road-founding-recovery-route.ts";
import { interruptedFoundingFrame } from "./road-founding-interrupted-frame.ts";
import { FoundingArrival, applyFoundingArrival } from "./road-founding-arrival.ts";
import { foundingWaitingCompanion, foundingWorker } from "./road-founding-formation.ts";
import { foundingCargoPoint, removeFoundingCargo } from "./road-founding-cargo.ts";
import {
  foundingItemPoint,
  smoothFoundingItem,
  type FoundingItemTurn,
} from "./road-founding-item.ts";
import { drawFoundingItem } from "./road-founding-props.ts";
import {
  FoundingRecipient,
  foundingRecipientFoot,
  foundingRecipientHand,
  foundingRecipientItemPoint,
} from "./road-founding-recipient.ts";

type Frame = { battle: RoadBattle; look: RoadLook };

export class RoadFoundingHandoff {
  private opening = new FoundingOpening();
  private queue = new FoundingVisualQueue();
  private key = "";
  private stage: "pickup" | "walk" | "give" | "return" = "pickup";
  private actor?: Traveller["id"];
  private at?: number;
  private carried = false;
  private lastItem?: WaterwayPoint;
  private lastFoot?: WaterwayPoint;
  readonly drop = new FoundingDrop();
  private pickupRoute = new FoundingPickupRoute();
  private carryTurn = new FoundingCarryTurn();
  private recoveryRoute = new FoundingRecoveryRoute();
  private facing?: number;
  private turn?: FoundingItemTurn;
  private delivered = new Set<number>();
  private gait = new RoadGait();
  readonly recipientMotion = new FoundingRecipient();
  private arrival = new FoundingArrival();
  private resumedComplete = false;

  observe(frame: Frame, key: string): Frame {
    const site = frame.look.foundingDraft;
    if (!site) return frame;
    const fresh = this.key !== key;
    if (fresh) {
      this.key = key;
      this.queue = new FoundingVisualQueue();
      this.stage = "pickup";
      this.actor = undefined;
      this.at = undefined;
      this.carried = false;
      this.lastItem = undefined;
      this.lastFoot = undefined;
      this.drop.reset();
      this.pickupRoute.reset();
      this.carryTurn.reset();
      this.recoveryRoute.reset();
      this.facing = undefined;
      this.turn = undefined;
      this.delivered = new Set(
        Array.from({ length: site.completed ? site.total : site.node }, (_, node) => node),
      );
      this.gait = new RoadGait();
      this.recipientMotion.reset();
      this.arrival.reset();
      this.resumedComplete = !!site.completed;
    }
    const completedOffscreen = this.resumedComplete
      ? this.queue.observe(key, site.total, false, null, true, site.total)
      : this.queue.observe(
          key,
          site.node,
          site.working,
          frame.battle.gathering,
          site.completed,
          site.total,
        );
    for (const node of completedOffscreen) this.delivered.add(node);
    const job = this.queue.current;
    return job
      ? {
          ...frame,
          look: { ...frame.look, foundingDraft: { ...site, visualNode: job.node } },
          battle: { ...frame.battle, gathering: { ...job.point } },
        }
      : site.completed
        ? { ...frame, battle: { ...frame.battle, gathering: null } }
        : frame;
  }

  prepare(frame: Frame, view: RoadViewport, key: string, reduced: boolean): Frame {
    return this.opening.prepare(this.prepareHandoff(frame, view), key, view, reduced);
  }
  private prepareHandoff(frame: Frame, view: RoadViewport): Frame {
    const job = this.queue.current;
    const cart = frame.battle.journeyCart;
    if (!frame.look.foundingDraft || !job || cart?.asset !== foundingCartAsset) return frame;
    if (this.interrupted(frame, job, cart, view)) return this.interruptedFrame(frame);
    if (cart.phase !== "parked") return frame;
    this.actor = foundingWorker(job, frame.battle.heroes, this.actor);
    if (!this.actor) return this.drop.active ? this.interruptedFrame(frame) : frame;
    const worker = frame.battle.heroes.find((hero) => hero.id === this.actor);
    const pickup = this.target(job, cart, view, frame.battle.stage);
    const route = this.drop.active
      ? this.recoveryRoute.resolve(worker, cart, view, frame.battle.stage, this.drop)
      : this.pickupRoute.forActor(this.actor, this.stage, cart, view, frame.battle.stage, pickup);
    if (!route) return frame;
    return {
      look: {
        ...frame.look,
        foundingDraft: {
          ...frame.look.foundingDraft,
          actor: this.actor,
          cue: this.drop.active ? "recover" : this.stage,
        },
        workers: [],
        frontCarriers: [],
        puller: null,
      },
      battle: {
        ...frame.battle,
        gathering: null,
        waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: true },
        heroes: frame.battle.heroes.map((hero) =>
          hero.id === this.actor
            ? { ...hero, ...this.carryTurn.target(route), walking: false, facing: 1 }
            : foundingWaitingCompanion(hero, cart, view, frame.battle.stage, this.actor),
        ),
      },
    };
  }

  private interrupted(frame: Frame, job: FoundingJob, cart: JourneyCart, view: RoadViewport) {
    const unavailable =
      this.actor &&
      !frame.battle.heroes.some((hero) => hero.id === this.actor && hero.hp > 0 && !hero.paralyzed);
    const blocked =
      unavailable ||
      frame.battle.phase === "rest" ||
      frame.battle.enemies.some((enemy) => enemy.hp > 0);
    if (!blocked) return false;
    this.carryTurn.reset();
    this.recoveryRoute.reset();
    if (this.stage === "give" && this.at !== undefined && frame.battle.time - this.at >= 600) {
      this.delivered.add(job.node);
      this.carried = false;
      this.stage = "return";
    }
    if (this.lastItem && this.lastFoot && !this.delivered.has(job.node) && this.stage !== "return")
      this.drop.interrupt(
        this.lastItem,
        this.lastFoot,
        frame.battle.time,
        view,
        frame.battle.stage,
        cart.x,
        this.actor,
      );
    this.at = undefined;
    if (unavailable) this.actor = undefined;
    return true;
  }

  private interruptedFrame(frame: Frame): Frame {
    return interruptedFoundingFrame(
      frame,
      this.drop.active,
      this.stage === "return",
      !!this.recipientMotion.position,
    );
  }

  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport, reduced = false) {
    const cart = battle.journeyCart,
      job = this.queue.current,
      scene = battle.waterwayActions;
    if (!look.foundingDraft || cart?.asset !== foundingCartAsset) return;
    applyFoundingArrival(this.arrival, look, cart, !!job, this.delivered, battle.time, reduced);
    if (!job || !scene || cart.phase !== "parked") return;
    if (
      look.foundingDraft.cue === "recipient-wait" ||
      look.foundingDraft.cue === "recipient-shelter"
    ) {
      const recipient = this.recipientMotion.update(
        look.foundingDraft.cue === "recipient-wait" ? "return" : this.stage,
        foundingRecipientFoot(cart, view, battle.stage),
        battle,
        view,
      );
      scene.actors = [{ id: `founding-recipient-${job.kind}`, ...recipient }];
      if (look.foundingDraft.cue === "recipient-shelter") return;
      const point = foundingRecipientItemPoint(recipient, view, battle.stage);
      if (cart.cargo) removeFoundingCargo(cart.cargo, job);
      drawFoundingItem(scene, job, cart, view, point, recipient.point.lane);
      return;
    }
    if (this.drop.active) {
      this.finishDrop(scene, battle, look, job, cart, view);
      return;
    }
    this.finishActive(scene, battle, job, cart, view);
  }

  private finishActive(
    scene: NonNullable<RoadBattle["waterwayActions"]>,
    battle: RoadBattle,
    job: FoundingJob,
    cart: JourneyCart,
    view: RoadViewport,
  ) {
    if (!this.actor) return;
    const hero = battle.heroes.find((item) => item.id === this.actor);
    if (!hero || hero.hp <= 0 || hero.paralyzed) return;
    const target = this.target(job, cart, view, battle.stage);
    this.pickupRoute.arrived(this.actor, this.stage, hero, cart, view, battle.stage, target);
    const arrived = waterwayAt(hero, target, view);
    if (arrived) {
      hero.facing = 1;
      hero.walking = false;
    }
    const recipient = this.recipientMotion.update(
      this.stage,
      foundingRecipientFoot(cart, view, battle.stage),
      battle,
      view,
    );
    scene.actors = [{ id: `founding-recipient-${job.kind}`, ...recipient }];
    const stride = this.gait.frame(hero, { ...view, stage: battle.stage });
    const point = this.carryTurn.render({
      hero,
      now: battle.time,
      previous: this.facing,
      carried: this.carried,
      stride,
      scene,
      cart,
      job,
      view,
    });
    if (point) {
      this.lastItem = point;
      this.lastFoot = { x: hero.x, lane: hero.lane };
      this.facing = hero.facing;
      return;
    }
    this.lastFoot = { x: hero.x, lane: hero.lane };
    const returning = this.stage === "return";
    this.advance(arrived, battle.time, job, recipient.ready, recipient.gone);
    if (this.carried || arrived)
      scene.poses[hero.id] = lindeCourierPose(hero.id, hero.walking, stride);
    if (returning || this.stage === "return") {
      const point = foundingRecipientItemPoint(recipient, view, battle.stage);
      if (cart.cargo) removeFoundingCargo(cart.cargo, job);
      drawFoundingItem(scene, job, cart, view, point, recipient.point.lane);
    } else this.item(scene, hero, job, cart, view, battle.stage, battle.time);
  }

  private finishDrop(
    scene: NonNullable<RoadBattle["waterwayActions"]>,
    battle: RoadBattle,
    look: RoadLook,
    job: FoundingJob,
    cart: JourneyCart,
    view: RoadViewport,
  ) {
    if (!cart.cargo) return;
    const worker =
      look.foundingDraft?.cue === "recover"
        ? battle.heroes.find((hero) => hero.id === this.actor)
        : undefined;
    const result = this.recoveryRoute.finish(worker, cart, view, battle, this.drop);
    const point = result?.point ?? this.drop.point(battle.time);
    if (!point) return;
    const recipient = this.recipientMotion.update(
      this.stage,
      foundingRecipientFoot(cart, view, battle.stage),
      battle,
      view,
      point,
    );
    scene.actors = [{ id: `founding-recipient-${job.kind}`, ...recipient }];
    if (worker && (result?.pose || result?.done)) {
      if (result.pose) scene.poses[worker.id] = result.pose;
      this.lastItem = point;
      this.lastFoot = { x: worker.x, lane: worker.lane };
      this.facing = worker.facing;
    }
    removeFoundingCargo(cart.cargo, job);
    drawFoundingItem(scene, job, cart, view, point, point.lane, this.drop.settled(battle.time));
    if (result?.done) {
      this.recoveryRoute.reset();
      this.stage = "walk";
      this.carried = true;
      this.turn = undefined;
    }
  }

  private target(
    job: FoundingJob,
    cart: JourneyCart,
    view: RoadViewport,
    stage: string,
  ): WaterwayPoint {
    const size = roadHeroSize(view.width, view.height),
      scale = roadScale(view.width, stage);
    if (this.stage === "pickup") {
      const source = foundingCargoPoint(job, cart, view, stage, journeyCartWidth(view, cart));
      const palm = this.actor && lindeCouriers[this.actor]?.offerPalm;
      const offset = waterwayPalm({ x: 0, lane: 0 }, palm ?? [150, 106], 1, view);
      return {
        x: source.x - offset.x,
        lane: cart.lane - (size * 0.3) / roadDepth(view.width, view.height),
      };
    }
    if (this.stage === "return") return { x: cart.x - (size * 1.5) / scale, lane: cart.lane };
    const recipient = foundingRecipientFoot(cart, view, stage);
    const palm = (this.actor && lindeCouriers[this.actor]?.offerPalm) ?? [150, 106];
    const hand = foundingRecipientHand(recipient, view, stage);
    const offset = waterwayPalm({ x: 0, lane: 0 }, palm, 1, view);
    return { x: hand.x - offset.x, lane: hand.lane - offset.lane };
  }

  private advance(
    arrived: boolean,
    now: number,
    job: FoundingJob,
    recipientReady: boolean,
    recipientGone: boolean,
  ) {
    if (!arrived) {
      this.at = undefined;
      return;
    }
    this.at ??= now;
    const age = now - this.at;
    if (this.stage === "pickup" && age >= 600) {
      this.carried = true;
      this.stage = "walk";
      this.at = undefined;
    } else if (this.stage === "walk" && recipientReady) {
      this.stage = "give";
      this.at = now;
    } else if (this.stage === "give" && age >= 900) {
      this.carried = false;
      this.delivered.add(job.node);
      this.stage = "return";
      this.at = undefined;
    } else if (this.stage === "return" && age >= 300 && recipientGone) {
      this.queue.complete();
      this.pickupRoute.reset();
      this.carryTurn.reset();
      this.recipientMotion.reset();
      this.stage = "pickup";
      this.actor = undefined;
      this.at = undefined;
      this.lastItem = undefined;
      this.lastFoot = undefined;
      this.facing = undefined;
      this.turn = undefined;
    }
  }

  private item(
    scene: NonNullable<RoadBattle["waterwayActions"]>,
    hero: Traveller,
    job: FoundingJob,
    cart: JourneyCart,
    view: RoadViewport,
    stage: string,
    now: number,
  ) {
    const art = lindeCouriers[hero.id];
    if (!art || !cart.cargo) return;
    const palm = hero.walking ? art.walkPalm : art.offerPalm;
    const hand = waterwayPalm(hero, palm, hero.facing, view);
    const raw = foundingItemPoint(hand, job, cart, view, stage, this.stage, this.at, now);
    const point = raw && this.smoothItem(raw, hero, now);
    if (!point) return;
    removeFoundingCargo(cart.cargo, job);
    drawFoundingItem(scene, job, cart, view, point, hero.lane);
  }

  private smoothItem(point: WaterwayPoint, hero: Traveller, now: number) {
    const result = smoothFoundingItem({
      point,
      hero,
      now,
      phase: this.stage,
      lastItem: this.lastItem,
      facing: this.facing,
      turn: this.turn,
    });
    this.turn = result.turn;
    this.lastItem = result.point;
    this.facing = hero.facing;
    return result.point;
  }
}
