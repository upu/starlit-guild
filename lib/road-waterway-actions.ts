import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./chapter-road-presentation.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { waterwayLayout, waterwayCutFoot } from "./road-waterway-layout.ts";
import { RoadWaterwayBasket } from "./road-waterway-basket.ts";
import { RoadWaterwayStone } from "./road-waterway-stone.ts";
import { RoadWaterwaySaw } from "./road-waterway-saw.ts";
import { RoadGait } from "./road-gait.ts";
import { RoadMossRemovalActions } from "./road-moss-removal-actions.ts";
import { waterwayActionAssets as assets } from "./road-waterway-contacts.ts";
import { finishWaterwaySearch } from "./road-waterway-search.ts";

type Frame = { battle: RoadBattle; look: RoadLook };
export class RoadWaterwayActions {
  private key = "";
  private basket = new RoadWaterwayBasket();
  private stone = new RoadWaterwayStone();
  private saw = new RoadWaterwaySaw();
  private gait = new RoadGait();
  private moss = new RoadMossRemovalActions();
  private at = 0;
  private workerX = waterwayCutFoot.x;
  private workerY = waterwayCutFoot.y;
  private workerWalking = false;
  private workerTravel = 0;
  prepare(frame: Frame, key: string, view: RoadViewport, reduced: boolean): Frame {
    if (frame.look.waterway && frame.look.quest === "old-waterway")
      return {
        ...frame,
        battle: {
          ...frame.battle,
          waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: true },
        },
      };
    if (frame.look.waterway && frame.look.quest === "tower-moss-removal")
      return this.moss.prepare(frame, key, view, reduced);
    const site = frame.look.waterway;
    if (!site) {
      this.key = "";
      return frame;
    }
    if (this.key !== key) this.reset(key, frame.battle.time, site.node);
    this.moveWorker(frame.battle.time, site.node, reduced);
    const battle = {
      ...frame.battle,
      waterwayActions: {
        poses: {},
        props: [],
        debrisHidden: false,
        closeContact: [7, 10, 11].includes(site.node),
      },
    };
    this.basket.prepare(battle, frame.look, view);
    this.stone.prepare(
      battle,
      frame.look,
      view,
      waterwayLayout(view.width, view.height).world(this.workerX, this.workerY),
    );
    return { battle, look: frame.look };
  }
  finish(battle: RoadBattle, view: RoadViewport, look: RoadLook, reduced: boolean) {
    if (!look.waterway) return;
    const scene = battle.waterwayActions;
    if (!scene) return;
    const strides = new Map(
      battle.heroes.map((hero) => [
        hero.id,
        this.gait.frame(hero, { ...view, stage: battle.stage }),
      ]),
    );
    if (look.quest === "old-waterway") {
      finishWaterwaySearch(battle, look, view, strides.get("leon") ?? 0, reduced);
      return;
    }
    const worker = waterwayLayout(view.width, view.height).world(this.workerX, this.workerY);
    if (look.quest === "tower-moss-removal") {
      this.moss.finish(
        battle,
        view,
        scene,
        strides.get("leon") ?? 0,
        reduced,
        look,
        strides.get("aria") ?? 0,
      );
      return;
    }
    this.basket.finish(battle, view, scene, reduced);
    this.stone.finish(battle, view, worker, scene, strides.get("leon") ?? 0, reduced);
    this.saw.finish(battle, look, view, scene, reduced);
    if (!scene.worker && look.waterway.node >= 9)
      scene.worker = {
        point: worker,
        pose: {
          asset: assets.worker,
          frame: this.workerWalking ? 4 + (Math.floor(this.workerTravel / 35) % 4) : 3,
          cell: 256,
          rows: 2,
        },
      };
  }
  private reset(key: string, time: number, node: number) {
    this.key = key;
    this.at = time;
    this.workerX = node >= 9 ? 1130 : waterwayCutFoot.x;
    this.workerY = node >= 9 ? 550 : waterwayCutFoot.y;
    this.basket = new RoadWaterwayBasket();
    this.stone = new RoadWaterwayStone();
    this.saw = new RoadWaterwaySaw();
    this.gait = new RoadGait();
    this.workerTravel = 0;
  }
  private moveWorker(time: number, node: number, reduced: boolean) {
    const dt = Math.max(0, Math.min(0.05, (time - this.at) / 1000));
    this.at = time;
    const target = node >= 9 ? { x: 1130, y: 550 } : waterwayCutFoot;
    const dx = target.x - this.workerX,
      dy = target.y - this.workerY;
    const distance = Math.hypot(dx, dy),
      step = reduced ? distance : Math.min(distance, dt * 200);
    const fraction = distance > 0 ? step / distance : 0;
    this.workerX += dx * fraction;
    this.workerY += dy * fraction;
    this.workerWalking = !reduced && distance - step > 0.5;
    this.workerTravel += step;
  }
}
