import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./chapter-road-presentation.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { waterwayLayout, waterwayCutFoot } from "./road-waterway-layout.ts";
import {
  waterwayActionAssets as assets,
  waterwayPalm,
  type WaterwayActions,
} from "./road-waterway-contacts.ts";

export class RoadWaterwaySaw {
  private node = -1;
  private at = 0;
  finish(
    battle: RoadBattle,
    look: RoadLook,
    view: RoadViewport,
    scene: WaterwayActions,
    reduced: boolean,
  ) {
    const node = look.waterway?.node ?? -1;
    if (node !== this.node) {
      this.node = node;
      this.at = battle.time;
    }
    const foot = waterwayLayout(view.width, view.height).world(
      waterwayCutFoot.x,
      waterwayCutFoot.y,
    );
    const age = battle.time - this.at;
    if (this.pickup(node, age, reduced, foot, view, scene)) return;
    if (node < 4) {
      this.paintSaw(foot, view, scene);
      return;
    }
    if (node < 8) return;
    const frame = sawLowerFrame(age, reduced);
    if (node === 8)
      scene.worker = { point: foot, pose: { asset: assets.sawLower, frame, cell: 256 } };
    if (node === 8 && frame < 2) return;
    this.paintSaw(foot, view, scene);
  }
  private pickup(
    node: number,
    age: number,
    reduced: boolean,
    foot: { x: number; lane: number },
    view: RoadViewport,
    scene: WaterwayActions,
  ) {
    if (node !== 4 || age >= 800 || reduced) return false;
    const frame = age < 200 ? 2 : age < 500 ? 1 : 0;
    scene.worker = { point: foot, pose: { asset: assets.sawLower, frame, cell: 256 } };
    if (frame === 2) this.paintSaw(foot, view, scene);
    return true;
  }
  private paintSaw(foot: { x: number; lane: number }, view: RoadViewport, scene: WaterwayActions) {
    const point = waterwayPalm(foot, [142, 176], 1, view);
    scene.props.push({
      asset: assets.saw,
      point,
      size: 0.39,
      depth: point.lane + 0.001,
      angle: 10,
    });
  }
}
export function sawLowerFrame(age: number, reduced: boolean) {
  if (reduced || age >= 800) return 3;
  if (age >= 550) return 2;
  return age >= 250 ? 1 : 0;
}
