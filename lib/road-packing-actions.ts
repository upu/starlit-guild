import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { fixedRoadLayout } from "./road-fixed-layout.ts";
import { waterwayAt, type WaterwayActions } from "./road-waterway-contacts.ts";
import { medicinePackingAssets as assets, packingFeet } from "./road-medicine-packing.ts";
import { packingProp, packingBagProps } from "./road-packing-contacts.ts";
import { RoadPackingCarrier } from "./road-packing-carrier.ts";
import { RoadGait } from "./road-gait.ts";
import { chapterTwoWork } from "./chapter-two.ts";
import { packingWrapAsset, packingWrapFrame, PACKING_PACKET_WIDTH } from "./road-packing-finish.ts";
type Frame = { battle: RoadBattle; look: RoadLook };
function packingArrived(battle: RoadBattle, view: RoadViewport) {
  const layout = fixedRoadLayout(view.width, view.height);
  return battle.heroes.every((h) => {
    const p = packingFeet[h.id === "aria" ? "aria" : "leon"];
    return !h.walking && waterwayAt(h, layout.world(p.x, p.y), view);
  });
}
function ariaPackingPose(phase: number, age: number) {
  if (phase === 2 && age < 300) return { asset: assets.ariaPaper, frame: 1, cell: 192 };
  const frame = phase === 0 ? 1 : phase === 1 && age < 1200 ? 2 : 3;
  return { asset: assets.aria, frame, cell: 256 };
}
function leonPackingPose(phase: number, age: number) {
  if (phase === 2 && age < 300) return { asset: assets.paper, frame: 1 };
  return {
    asset: assets.leon,
    frame: phase === 0 ? 0 : phase === 1 ? 1 + Math.min(2, Math.floor(age / 600)) : 2,
  };
}
/** Renderer-owned batches wait for both packets to be stored before the next pair appears. */
export class RoadPackingActions {
  private key = "";
  private node = 0;
  private pending = 0;
  private at?: number;
  private started = false;
  private finished = false;
  private carriers = [new RoadPackingCarrier("aria"), new RoadPackingCarrier("leon")];
  private gait = new RoadGait();
  prepare(frame: Frame, key: string, view: RoadViewport): Frame {
    if (!frame.look.packing) return frame;
    if (key !== this.key) this.reset(frame, key);
    this.pending = Math.max(this.pending, frame.look.packing.node);
    this.nextTask(frame.battle.time);
    const battle = {
      ...frame.battle,
      waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: true },
    };
    const look = { ...frame.look, packing: { ...frame.look.packing, node: this.node } };
    battle.heroes = battle.heroes.map((hero) => {
      const carrier = this.carriers.find((c) => c.id === hero.id);
      return carrier?.begun
        ? { ...hero, ...carrier.target(view), facing: carrier.facing(), walking: false }
        : hero;
    });
    if (look.work)
      look.work = {
        ...look.work,
        label: chapterTwoWork("medicine-packing", this.node)?.name ?? look.work.label,
      };
    if (this.carriers.some((c) => c.begun) && !this.finished) look.workers = ["aria", "leon"];
    return { battle, look };
  }
  private reset(frame: Frame, key: string) {
    this.key = key;
    this.node = frame.look.packing?.node ?? 0;
    this.pending = this.node;
    this.at = undefined;
    this.finished = frame.look.packing?.completed ?? false;
    this.started = !!frame.look.work;
    this.carriers = [new RoadPackingCarrier("aria"), new RoadPackingCarrier("leon")];
    for (const c of this.carriers) c.restore(this.finished ? 5 : Math.floor(this.node / 3));
    this.gait = new RoadGait();
  }
  private nextTask(time: number) {
    if (this.at === undefined || this.finished) return;
    if (this.node % 3 === 2) {
      if (!this.carriers.every((c) => c.done)) return;
      if (this.node >= 14) {
        this.finished = true;
        return;
      }
    }
    const minimum = [1000, 1800, 800][this.node % 3];
    if (this.pending <= this.node || time - this.at < minimum) return;
    this.node++;
    this.at = undefined;
    if (this.node % 3 === 0) for (const c of this.carriers) c.next();
  }
  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport, reduced: boolean) {
    if (!look.packing) return;
    const scene = battle.waterwayActions;
    if (!scene) return;
    const arrived = packingArrived(battle, view);
    if (arrived) this.at ??= battle.time;
    const age = this.age(battle.time, reduced),
      phase = this.node % 3;
    this.furniture(scene, view, phase);
    if (this.started && arrived && !this.finished) this.work(battle, scene, view, phase, age);
    if (!this.finished) this.goods(scene, view, phase, age);
    for (const c of this.carriers) {
      const hero = battle.heroes.find((h) => h.id === c.id);
      const stride = hero ? this.gait.frame(hero, { ...view, stage: battle.stage }) : 0;
      c.paint(battle, view, scene, stride, reduced);
    }
  }
  private age(time: number, reduced: boolean) {
    if (!this.started) return 0;
    return reduced ? 2500 : Math.max(0, time - (this.at ?? time));
  }
  private work(
    battle: RoadBattle,
    scene: WaterwayActions,
    view: RoadViewport,
    phase: number,
    age: number,
  ) {
    scene.poses.aria = ariaPackingPose(phase, age);
    scene.poses.leon = leonPackingPose(phase, age);
    if (phase === 2 && age >= 800 && !this.carriers.some((c) => c.begun))
      for (const c of this.carriers) c.start(battle.time, view);
  }
  private furniture(scene: WaterwayActions, view: RoadViewport, phase: number) {
    const layout = fixedRoadLayout(view.width, view.height);
    scene.props.push(
      packingProp(view, "packing-table", assets.table, { x: 950, y: 760 }, 250, 715),
    );
    for (const carrier of this.carriers)
      scene.props.push(...packingBagProps(view, carrier.id, carrier.bagFrame));
    scene.actors = [
      {
        id: "packing-merchant",
        point: layout.world(packingFeet.merchant.x, packingFeet.merchant.y),
        pose: { asset: assets.merchant, frame: phase === 0 ? 1 : 0, cell: 256 },
      },
    ];
  }
  private goods(scene: WaterwayActions, view: RoadViewport, phase: number, age: number) {
    const frame = packingWrapFrame(phase, age);
    if (!this.carriers[0].begun)
      scene.props.push(
        packingProp(
          view,
          "packing-wrapped-medicine",
          packingWrapAsset("aria", frame),
          { x: 850, y: 690 },
          PACKING_PACKET_WIDTH,
          744,
        ),
      );
    if (!this.carriers[1].begun)
      scene.props.push(
        packingProp(
          view,
          "packing-wrapped-honey",
          packingWrapAsset("leon", frame),
          { x: 1070, y: 660 },
          PACKING_PACKET_WIDTH,
          722,
        ),
      );
    scene.props.push(
      packingProp(view, "packing-spare-cloth", assets.cloth, { x: 990, y: 650 }, 42, 715),
    );
  }
}
