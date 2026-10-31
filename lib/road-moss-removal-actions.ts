import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./chapter-road-presentation.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { roadDepth } from "./road-layout.ts";
import { waterwayLayout } from "./road-waterway-layout.ts";
import { mossRemovalAssets as assets, mossBasketSupport } from "./road-moss-removal-layout.ts";
import { RoadMossHatches } from "./road-moss-hatches.ts";
import {
  RoadMossCollection,
  mossGatheringNodes as gatheringNodes,
  mossScraperTips as tips,
} from "./road-moss-collection.ts";
import { mossHatchOffset } from "./road-moss-hatch-layout.ts";
import { RoadMossBasketShuttle } from "./road-moss-basket-shuttle.ts";
import { RoadMossBasketPause } from "./road-moss-basket-pause.ts";
import { mossBasketTurn } from "./road-moss-basket-turn.ts";
import { mossCarryTargets, mossRetreat, MossApproach } from "./road-moss-approach.ts";
import { mossBasketDepth, holdMossSpatula, recordMossBasket } from "./road-moss-basket-display.ts";
import { applyMossWorkCaption } from "./road-moss-work-caption.ts";
import { mossRemovalScene } from "./road-moss-scene.ts";
import {
  waterwayActionAssets as shared,
  waterwayPalm,
  waterwayFoot,
  waterwayAt,
  waterwayMix,
} from "./road-waterway-contacts.ts";
import type { WaterwayActions, WaterwayPoint } from "./road-waterway-contacts.ts";

type Phase = "collect" | "lift" | "carry" | "give" | "shuttle" | "receive" | "return" | "settle";
type Frame = { battle: RoadBattle; look: RoadLook };
export { mossBasketSupport } from "./road-moss-removal-layout.ts";
/** Renderer-owned first basket cycle. Quest and save progress remain untouched. */
export class RoadMossRemovalActions {
  private key = "";
  private node = -1;
  private at?: number;
  private phase: Phase = "collect";
  private filled = false;
  private shuttle = new RoadMossBasketShuttle();
  private nextDelivery = 5;
  private collected = [false, false];
  private collection = new RoadMossCollection();
  private hatches = new RoadMossHatches(0);
  private relocated = false;
  private pause = new RoadMossBasketPause();
  private giveFacing: 1 | -1 = 1;
  private approach = new MossApproach();
  prepare(frame: Frame, key: string, view: RoadViewport, reduced = false): Frame {
    this.updateSite(frame, key, reduced);
    const priority =
      this.phase === "carry" && this.approach.active ? this.approach.priority : undefined;
    const scene = mossRemovalScene(this.hatches.openHoles(), this.worker(view), priority);
    const battle = { ...frame.battle, waterwayActions: scene };
    const look = { ...frame.look };
    if (!["shuttle", "receive"].includes(this.phase) && this.pause.prepare(battle, look, view))
      return { battle, look };
    if (battle.enemies.some((e) => e.hp > 0)) return { battle, look: frame.look };
    const targets = this.targets(view);
    if (battle.gathering)
      battle.gathering = {
        ...battle.gathering,
        x: targets.basket.x - 65,
        lane: targets.basket.lane,
      };
    const { aria, leon } = mossCarryTargets(
      view,
      targets,
      this.approach,
      this.phase === "carry",
      this.shuttle.departing,
      this.atWorker(),
    );
    battle.heroes = battle.heroes.map((hero) => ({
      ...hero,
      ...(hero.id === "aria" ? aria : leon),
      facing: 1,
      walking: false,
    }));
    return { battle, look: { ...frame.look, workers: ["aria", "leon"] } };
  }
  finish(
    battle: RoadBattle,
    view: RoadViewport,
    scene: WaterwayActions,
    stride: number,
    reduced: boolean,
    look: RoadLook,
    ariaStride = 0,
  ) {
    const targets = this.targets(view),
      leon = battle.heroes.find((h) => h.id === "leon");
    if (!leon) return;
    const fighting = battle.enemies.some((e) => e.hp > 0);
    if (this.phase === "carry") this.approach.advance(battle, view, targets);
    this.releaseWorker(fighting, leon, view, battle.time);
    let basket = targets.basket;
    holdMossSpatula(battle, scene, ariaStride);
    const paused = ["shuttle", "receive"].includes(this.phase)
      ? undefined
      : this.pause.finish(battle, view, scene);
    this.resumeHandoff(leon, battle.time);
    if (paused) basket = paused;
    else if (!fighting) {
      basket = this.advance(battle, view, scene, stride, reduced, targets);
      recordMossBasket(this.pause, this.phase, basket, leon, scene);
    }
    this.shuttle.paint(
      scene,
      view,
      battle.time,
      reduced,
      ["carry", "give", "receive"].includes(this.phase),
    );
    if (!["shuttle", "receive"].includes(this.phase))
      scene.props.push({
        id: "moss-active-basket",
        asset: this.filled ? assets.filled : assets.basket,
        point: basket,
        size: 0.3,
        depth: mossBasketDepth(this.phase, this.worker(view), leon, basket, fighting),
      });
    this.hatches.paint(scene, view, battle.time, this.collected);
    battle.mossVisualComplete = this.shuttle.finished && this.hatches.complete;
    applyMossWorkCaption(look, battle, scene, {
      node: this.node,
      phase: this.phase,
      filled: this.filled,
      hatches: this.hatches,
      shuttle: this.shuttle,
    });
  }
  private resumeHandoff(leon: RoadBattle["heroes"][number], time: number) {
    if (this.pause.takeRecovered() && this.phase === "give") {
      this.at = time;
      this.giveFacing = leon.facing;
    }
  }
  private updateSite(frame: Frame, key: string, reduced: boolean) {
    const requested = frame.look.waterway?.node ?? 0;
    // If the saved run outruns the animation, finish the second scrape before
    // advancing to the final handoff. This changes only the drawn work cue.
    const node =
      this.relocated && !this.collected[1] && this.phase === "collect" && requested > 11
        ? 11
        : requested;
    if (key !== this.key) this.reset(key, frame.battle.time, node, frame.look.waterway?.completed);
    this.hatches.update(frame.battle.time, node, reduced, this.shuttle.readyToClose);
    this.moveToSecond(node);
    if (node !== this.node) {
      this.node = node;
      if (this.phase === "collect") this.at = undefined;
    }
  }
  private moveToSecond(node: number) {
    if (node < 9 || !this.hatches.canMove || this.relocated) return;
    this.relocated = true;
    if (this.phase === "collect") {
      this.phase = "return";
      this.at = undefined;
    }
  }
  private reset(key: string, time: number, node: number, completed = false) {
    this.key = key;
    this.node = -1;
    this.phase = "collect";
    this.filled = node >= 5;
    this.shuttle = new RoadMossBasketShuttle();
    this.nextDelivery = node >= 7 ? 13 : 5;
    if (node >= 7) {
      this.shuttle.restoreFirst();
      this.filled = node >= 13;
    }
    this.at = undefined;
    this.collected = node >= 9 ? [true, node >= 13] : [node >= 5, false];
    this.collection = new RoadMossCollection();
    this.hatches = new RoadMossHatches(completed ? 15 : node);
    this.relocated = node >= 9;
    this.pause = new RoadMossBasketPause();
    this.giveFacing = 1;
    this.approach.reset();
    if (completed) {
      this.shuttle.restoreComplete();
      this.phase = "shuttle";
      this.filled = false;
      this.collected = [true, true];
    }
  }
  private targets(view: RoadViewport) {
    const layout = waterwayLayout(view.width, view.height),
      offset = mossHatchOffset(this.relocated ? 9 : 0),
      tip = layout.world(1043 + offset.x, 637 + offset.y);
    const aria = waterwayFoot(tip, tips[0], 1, view);
    const basket = layout.world(1040 + offset.x, 685 + offset.y);
    const leon = waterwayFoot(
      {
        ...basket,
        lane: basket.lane - (14 * layout.figureScale) / roadDepth(view.width, view.height),
      },
      [128, 132],
      -1,
      view,
    );
    const worker = this.worker(view),
      contact = waterwayPalm(worker, [62, 111], 1, view);
    return {
      aria,
      basket,
      leon,
      worker,
      contact,
      give: waterwayFoot(contact, [134, 105], 1, view),
    };
  }
  private releaseWorker(fighting: boolean, leon: WaterwayPoint, view: RoadViewport, time: number) {
    if (!fighting && this.shuttle.awaitingClearance && waterwayAt(leon, mossRetreat(view), view))
      this.shuttle.depart(time);
  }
  private advance(
    battle: RoadBattle,
    view: RoadViewport,
    scene: WaterwayActions,
    stride: number,
    reduced: boolean,
    targets: ReturnType<RoadMossRemovalActions["targets"]>,
  ): WaterwayPoint {
    const leon = battle.heroes.find((h) => h.id === "leon");
    if (!leon) return targets.basket;
    if (["shuttle", "receive"].includes(this.phase))
      return this.receiveEmpty(battle, view, scene, reduced, targets);
    if (["return", "settle"].includes(this.phase))
      return this.returnEmpty(battle, view, scene, stride, reduced, targets);
    if (this.phase === "collect") {
      if (this.node >= this.nextDelivery && this.filled && !gatheringNodes.includes(this.node)) {
        this.phase = "lift";
        this.at = battle.time;
      } else return this.collect(battle, view, scene, reduced, targets);
    }
    if (this.phase === "lift") return this.lift(battle, view, scene, reduced, leon, targets.basket);
    if (this.phase === "carry" || this.phase === "give")
      return this.carry(battle, view, scene, stride, reduced, targets);
    return targets.contact;
  }
  private lift(
    battle: RoadBattle,
    view: RoadViewport,
    scene: WaterwayActions,
    reduced: boolean,
    leon: WaterwayPoint,
    basket: WaterwayPoint,
  ) {
    const age = battle.time - (this.at ?? battle.time);
    scene.poses.leon = { asset: shared.leonWork, frame: 2 };
    const point = waterwayMix(
      basket,
      mossBasketSupport(waterwayPalm(leon, [134, 105], 1, view), view),
      reduced ? 1 : age / 350,
    );
    if (reduced || age >= 350) this.phase = "carry";
    return point;
  }
  private carry(
    battle: RoadBattle,
    view: RoadViewport,
    scene: WaterwayActions,
    stride: number,
    reduced: boolean,
    targets: ReturnType<RoadMossRemovalActions["targets"]>,
  ) {
    const leon = battle.heroes.find((h) => h.id === "leon");
    if (!leon) return targets.contact;
    if (this.phase === "carry") leon.facing = -1;
    this.prepareGive(leon, targets.give, view, battle.time);
    if (this.phase === "give") return this.offer(leon, view, scene, battle.time, reduced);
    scene.poses.leon = leon.walking
      ? { asset: shared.carryWalk, frame: stride, cell: 256 }
      : { asset: shared.carry, frame: 0 };
    const palms = [
      [126, 105],
      [135, 107],
      [124, 105],
      [129, 106],
    ];
    const hand = mossBasketSupport(
      waterwayPalm(leon, leon.walking ? palms[stride] : [134, 105], leon.facing, view),
      view,
    );
    return hand;
  }
  private prepareGive(
    leon: RoadBattle["heroes"][number],
    target: WaterwayPoint,
    view: RoadViewport,
    time: number,
  ) {
    if (this.phase === "carry" && !this.approach.active && waterwayAt(leon, target, view)) {
      this.phase = "give";
      this.at = time;
      this.giveFacing = leon.facing;
    }
    if (this.phase === "give") {
      leon.walking = false;
    }
  }
  private offer(
    leon: RoadBattle["heroes"][number],
    view: RoadViewport,
    scene: WaterwayActions,
    time: number,
    reduced: boolean,
  ) {
    const age = time - (this.at ?? time);
    const turn = mossBasketTurn(age, this.giveFacing, reduced);
    leon.facing = turn.facing;
    scene.poses.leon = { asset: turn.asset, frame: turn.frame };
    const offered = mossBasketSupport(waterwayPalm(leon, turn.palm, turn.facing, view), view);
    if (reduced || age >= (this.giveFacing < 0 ? 930 : 450)) {
      this.shuttle.begin(time, this.nextDelivery === 13);
      this.approach.reset();
      this.phase = "shuttle";
      this.nextDelivery = 13;
      this.pause = new RoadMossBasketPause();
    }
    return offered;
  }
  private collect(
    battle: RoadBattle,
    view: RoadViewport,
    scene: WaterwayActions,
    reduced: boolean,
    targets: ReturnType<RoadMossRemovalActions["targets"]>,
  ) {
    if (
      this.collection.paint(battle, view, scene, this.node, this.hatches.ready(), targets, reduced)
    ) {
      this.filled = true;
      this.collected[this.node >= 9 ? 1 : 0] = true;
    }
    return targets.basket;
  }
  private receiveEmpty(
    battle: RoadBattle,
    view: RoadViewport,
    scene: WaterwayActions,
    reduced: boolean,
    targets: ReturnType<RoadMossRemovalActions["targets"]>,
  ) {
    const leon = battle.heroes.find((hero) => hero.id === "leon");
    if (!leon || !this.shuttle.waiting || !waterwayAt(leon, targets.give, view))
      return targets.contact;
    if (this.phase === "shuttle") {
      this.phase = "receive";
      this.at = battle.time;
    }
    leon.facing = 1;
    leon.walking = false;
    scene.poses.leon = { asset: shared.carry, frame: 0 };
    if (reduced || battle.time - (this.at ?? battle.time) >= 450) {
      this.shuttle.takeEmpty();
      this.phase = "return";
      this.filled = false;
      this.at = undefined;
      this.pause = new RoadMossBasketPause();
    }
    return mossBasketSupport(waterwayPalm(leon, [134, 105], 1, view), view);
  }
  private returnEmpty(
    battle: RoadBattle,
    view: RoadViewport,
    scene: WaterwayActions,
    stride: number,
    reduced: boolean,
    targets: ReturnType<RoadMossRemovalActions["targets"]>,
  ) {
    const leon = battle.heroes.find((hero) => hero.id === "leon");
    if (!leon) return targets.basket;
    if (this.phase === "return" && !waterwayAt(leon, targets.leon, view))
      return this.carry(battle, view, scene, stride, reduced, targets);
    if (this.phase === "return") {
      this.phase = "settle";
      this.at = battle.time;
    }
    leon.facing = -1;
    leon.walking = false;
    scene.poses.leon = { asset: shared.leonWork, frame: 2 };
    const age = battle.time - (this.at ?? battle.time);
    const hand = mossBasketSupport(waterwayPalm(leon, [134, 105], -1, view), view);
    const point = waterwayMix(hand, targets.basket, reduced ? 1 : age / 350);
    if (reduced || age >= 350) {
      this.phase = "collect";
      this.at = undefined;
    }
    return point;
  }
  private worker(view: RoadViewport) {
    return this.shuttle.point(view);
  }
  private atWorker() {
    return (
      ["carry", "give", "receive"].includes(this.phase) ||
      (this.phase === "shuttle" && this.shuttle.waiting)
    );
  }
}
