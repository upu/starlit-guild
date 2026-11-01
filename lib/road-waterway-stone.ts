import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./chapter-road-presentation.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { waterwayLayout } from "./road-waterway-layout.ts";
import {
  waterwayActionAssets as assets,
  waterwayPalms as palms,
  waterwayPalm,
  waterwayFoot,
  waterwayAt,
  waterwayMix,
  type WaterwayActions,
  type WaterwayPoint,
} from "./road-waterway-contacts.ts";

type Phase = "waiting" | "pickup" | "lift" | "carry" | "give" | "withdraw" | "place" | "done";
export class RoadWaterwayStone {
  private enabled = false;
  private phase: Phase = "waiting";
  private at = 0;
  private point?: WaterwayPoint;
  prepare(battle: RoadBattle, look: RoadLook, view: RoadViewport, worker: WaterwayPoint) {
    this.restorePlacedStone(battle, look, view, worker);
    if (look.waterway?.node === 11) this.enabled = true;
    if (!this.enabled) return;
    if (this.phase === "done" && battle.time - this.at > 400) return;
    if (battle.waterwayActions) battle.waterwayActions.closeContact = true;
    const targets = this.targets(view, worker);
    const point = this.targetFoot(targets);
    battle.heroes = battle.heroes.map((hero) =>
      hero.id === "leon" ? { ...hero, ...point, facing: 1, walking: false } : hero,
    );
    look.workers = ["leon"];
  }
  private restorePlacedStone(
    battle: RoadBattle,
    look: RoadLook,
    view: RoadViewport,
    worker: WaterwayPoint,
  ) {
    if (this.enabled || (look.waterway?.node ?? 0) <= 11) return;
    this.enabled = true;
    this.phase = "done";
    this.at = battle.time - 401;
    this.point = waterwayPalm(worker, palms.workerPlace, 1, view);
  }
  finish(
    battle: RoadBattle,
    view: RoadViewport,
    worker: WaterwayPoint,
    scene: WaterwayActions,
    stride: number,
    reduced: boolean,
  ) {
    const targets = this.targets(view, worker),
      leon = battle.heroes.find((h) => h.id === "leon");
    this.point ??= targets.ground;
    if (!leon) return;
    this.advance(battle, leon, view, targets, reduced);
    this.paintState(battle, leon, view, worker, scene, stride, targets);
    scene.props.push({
      asset: assets.stone,
      point: this.point,
      size: 0.23,
      depth: this.depth(leon, worker),
    });
  }
  private targets(view: RoadViewport, worker: WaterwayPoint) {
    const ground = waterwayLayout(view.width, view.height).world(935, 660);
    const contact = waterwayPalm(worker, palms.workerReceive, 1, view);
    return {
      ground,
      contact,
      away: waterwayLayout(view.width, view.height).world(970, 570),
      pickup: waterwayFoot(ground, palms.leonKneel, 1, view),
      give: waterwayFoot(contact, palms.leonCarry, 1, view),
    };
  }
  private targetFoot(targets: ReturnType<RoadWaterwayStone["targets"]>) {
    if (["waiting", "pickup", "lift"].includes(this.phase)) return targets.pickup;
    return ["withdraw", "place", "done"].includes(this.phase) ? targets.away : targets.give;
  }
  private depth(leon: WaterwayPoint, worker: WaterwayPoint) {
    if (["carry", "give"].includes(this.phase)) return leon.lane + 0.002;
    if (["withdraw", "place"].includes(this.phase)) return worker.lane + 0.002;
    return this.point?.lane ?? 0.68;
  }
  private advance(
    battle: RoadBattle,
    leon: WaterwayPoint,
    view: RoadViewport,
    targets: ReturnType<RoadWaterwayStone["targets"]>,
    reduced: boolean,
  ) {
    const age = battle.time - this.at;
    const timed: Partial<Record<Phase, [number, Phase]>> = {
      pickup: [300, "lift"],
      lift: [350, "carry"],
      give: [450, "withdraw"],
      place: [450, "done"],
    };
    const step = timed[this.phase];
    const next =
      step && (reduced || age >= step[0]) ? step[1] : this.contactPhase(leon, targets, view);
    if (next !== this.phase) {
      this.phase = next;
      this.at = battle.time;
    }
  }
  private contactPhase(
    leon: WaterwayPoint,
    targets: ReturnType<RoadWaterwayStone["targets"]>,
    view: RoadViewport,
  ): Phase {
    if (this.phase === "waiting" && this.enabled && waterwayAt(leon, targets.pickup, view))
      return "pickup";
    if (this.phase === "carry" && waterwayAt(leon, targets.give, view)) return "give";
    if (this.phase === "withdraw" && waterwayAt(leon, targets.away, view)) return "place";
    return this.phase;
  }
  private paintState(
    battle: RoadBattle,
    leon: RoadBattle["heroes"][number],
    view: RoadViewport,
    worker: WaterwayPoint,
    scene: WaterwayActions,
    stride: number,
    targets: ReturnType<RoadWaterwayStone["targets"]>,
  ) {
    const age = battle.time - this.at;
    if (this.phase === "pickup" || this.phase === "lift") {
      this.paintPickup(scene, leon, view, targets.ground, age);
    }
    if (this.phase === "carry" || this.phase === "give") {
      this.paintCarry(scene, leon, view, worker, stride);
    }
    if (this.phase === "place" || this.phase === "done") {
      this.paintPlaced(scene, worker, view, targets.contact, age);
    }
    if (this.phase === "withdraw") {
      this.point = targets.contact;
      scene.worker = {
        point: worker,
        pose: { asset: assets.worker, frame: 0, cell: 256, rows: 2 },
      };
    }
  }
  private paintPickup(
    scene: WaterwayActions,
    leon: RoadBattle["heroes"][number],
    view: RoadViewport,
    ground: WaterwayPoint,
    age: number,
  ) {
    scene.poses.leon = { asset: assets.leonWork, frame: this.phase === "pickup" ? 1 : 2 };
    this.point = waterwayMix(
      ground,
      waterwayPalm(leon, palms.leonCarry, 1, view),
      this.phase === "pickup" ? 0 : age / 350,
    );
  }
  private paintCarry(
    scene: WaterwayActions,
    leon: RoadBattle["heroes"][number],
    view: RoadViewport,
    worker: WaterwayPoint,
    stride: number,
  ) {
    scene.poses.leon = leon.walking
      ? { asset: assets.carryWalk, frame: stride, cell: 256 }
      : { asset: assets.carry, frame: 0 };
    this.point = waterwayPalm(
      leon,
      leon.walking ? palms.carryWalk[stride] : palms.leonCarry,
      1,
      view,
    );
    scene.worker = {
      point: worker,
      pose: { asset: assets.worker, frame: 0, cell: 256, rows: 2 },
    };
  }
  private paintPlaced(
    scene: WaterwayActions,
    worker: WaterwayPoint,
    view: RoadViewport,
    contact: WaterwayPoint,
    age: number,
  ) {
    const ground = waterwayPalm(worker, palms.workerPlace, 1, view);
    this.point = this.phase === "done" ? ground : waterwayMix(contact, ground, age / 450);
    scene.worker = {
      point: worker,
      pose: {
        asset: assets.worker,
        frame: this.phase === "done" && age > 400 ? 3 : 2,
        cell: 256,
        rows: 2,
      },
    };
  }
}
