import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { fixedRoadLayout } from "./road-fixed-layout.ts";
import { RoadSignpostCarry } from "./road-signpost-carry.ts";
import { RoadGait } from "./road-gait.ts";
import { signpostAssets as assets, signpostSize } from "./road-signpost.ts";
import { RoadSignpostOwner } from "./road-signpost-owner.ts";

export class RoadSignpostActions {
  private key = "";
  private node = 0;
  private enteredAt = 0;
  private carry = new RoadSignpostCarry();
  private gait = new RoadGait();
  private owner = new RoadSignpostOwner();
  prepare(frame: { battle: RoadBattle; look: RoadLook }, key: string, view: RoadViewport) {
    const site = frame.look.signpost;
    if (!site) return frame;
    if (this.key !== key) {
      this.key = key;
      this.node = site.node;
      this.enter(frame.battle.time, true, site.completed);
      this.gait = new RoadGait();
    }
    if (this.canAdvance(site.node, frame.battle.time)) {
      this.node++;
      this.enter(frame.battle.time);
    }
    const phase = this.node % 3,
      battle: RoadBattle = {
        ...frame.battle,
        waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: false },
      };
    const look = { ...frame.look, signpost: { ...site, node: this.node } };
    if (site.node !== this.node) battle.effects = [];
    if (phase !== 2) this.owner.prepare(battle, view);
    if (phase === 2 || (phase !== 1 && !battle.enemies.some((e) => e.hp > 0))) {
      battle.enemies = [];
      battle.effects = [];
      look.workers = battle.heroes.map((h) => h.id);
    }
    if (phase === 2) this.placeCarrier(battle, view);
    return { battle, look };
  }
  private enter(time: number, cold = false, completed = false) {
    this.enteredAt = time;
    this.carry.start(time, completed);
    this.owner.enter(this.node, time, cold);
    if (this.node % 3 === 2) this.owner.beginDeparture(time);
  }
  private canAdvance(node: number, time: number) {
    if (node <= this.node) return false;
    if (this.node % 3 === 2) return this.carry.done;
    return time - this.enteredAt >= (this.node % 3 === 0 ? 900 : 450);
  }
  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
    if (!look.signpost) return;
    const scene = battle.waterwayActions;
    if (!scene) return;
    const layout = fixedRoadLayout(view.width, view.height),
      phase = this.node % 3;
    scene.props.push(
      ...[
        ["medicine-bag", assets.bag, 710, 825, 65],
        ["honey-bag", assets.bag, 785, 825, 65],
        ["mira-box", assets.box, 650, 790, 55],
      ].map(([id, asset, x, y, width]) => {
        const point = layout.world(Number(x), Number(y));
        return {
          id: String(id),
          asset: String(asset),
          point,
          size: signpostSize(view, Number(width)),
          depth: point.lane,
        };
      }),
    );
    const leon = battle.heroes.find((h) => h.id === "leon");
    if (!leon) return;
    if (phase === 2 && !this.carry.done) {
      this.owner.depart(scene, view, battle.time);
      scene.props.push(
        this.carry.paint(
          leon,
          battle.time,
          view,
          scene,
          this.gait.frame(leon, { ...view, stage: battle.stage }),
        ),
      );
      return;
    }
    if (phase !== 2) scene.props.push(this.owner.paint(battle, view, scene, phase));
    else scene.props.push(this.carry.standing(view));
    if (phase === 1 || battle.enemies.some((e) => e.hp > 0)) return;
    if (look.workers.includes("aria")) scene.poses.aria = { asset: assets.inspect, frame: 1 };
    if (look.workers.includes("leon")) scene.poses.leon = { asset: assets.paper, frame: 0 };
  }
  private placeCarrier(battle: RoadBattle, view: RoadViewport) {
    const leon = battle.heroes.find((h) => h.id === "leon");
    if (!leon) return;
    Object.assign(leon, this.carry.target(view), {
      walking: false,
      facing: ["carry", "plant", "done"].includes(this.carry.phase) ? -1 : 1,
    });
  }
}
