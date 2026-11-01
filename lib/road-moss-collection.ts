import type { RoadBattle } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { roadDepth } from "./road-layout.ts";
import { waterwayLayout } from "./road-waterway-layout.ts";
import { mossRemovalAssets as assets } from "./road-moss-removal-layout.ts";
import {
  waterwayActionAssets as shared,
  waterwayAt,
  waterwayPalm,
  waterwayMix,
  type WaterwayActions,
  type WaterwayPoint,
} from "./road-waterway-contacts.ts";

export const mossGatheringNodes = [3, 4, 7, 8, 10, 11];
export const mossScraperTips = [
  [159, 139],
  [166, 139],
  [155, 111],
  [158, 153],
  [158, 162],
  [158, 143],
];
export type MossCollectionTargets = {
  aria: WaterwayPoint;
  leon: WaterwayPoint;
  basket: WaterwayPoint;
};
const scrapeFrame = (age: number) => {
  const index = [400, 800, 1150, 1450, 1850].findIndex((limit) => age < limit);
  return index < 0 ? 6 : index + 1;
};
export class RoadMossCollection {
  private node = -1;
  private at?: number;
  paint(
    battle: RoadBattle,
    view: RoadViewport,
    scene: WaterwayActions,
    node: number,
    open: boolean,
    targets: MossCollectionTargets,
    reduced: boolean,
  ) {
    if (node !== this.node) {
      this.node = node;
      this.at = undefined;
    }
    const aria = battle.heroes.find((hero) => hero.id === "aria"),
      leon = battle.heroes.find((hero) => hero.id === "leon");
    if (!aria || !leon || !waterwayAt(leon, targets.leon, view)) return false;
    scene.poses.leon = { asset: shared.leonWork, frame: 1 };
    leon.facing = -1;
    if (!open || !mossGatheringNodes.includes(node) || !waterwayAt(aria, targets.aria, view))
      return false;
    this.at ??= battle.time;
    const age = reduced ? 2100 : battle.time - this.at,
      frame = scrapeFrame(age);
    scene.poses.aria = { asset: assets.cycle, frame, cell: 256, rows: 2 };
    this.paintTuft(aria, leon, view, scene, targets.basket, age, frame);
    return age >= 1850;
  }
  private paintTuft(
    aria: WaterwayPoint,
    leon: WaterwayPoint,
    view: RoadViewport,
    scene: WaterwayActions,
    basket: WaterwayPoint,
    age: number,
    frame: number,
  ) {
    if (age < 700 || age >= 1850) return;
    const tip = waterwayPalm(aria, mossScraperTips[frame - 1], 1, view);
    const rim = {
      ...basket,
      lane:
        basket.lane -
        (22 * waterwayLayout(view.width, view.height).figureScale) /
          roadDepth(view.width, view.height),
    };
    scene.props.push({
      id: "moss-on-spatula",
      asset: assets.moss,
      point: age < 1550 ? tip : waterwayMix(tip, rim, (age - 1550) / 300),
      size: 0.095,
      depth: leon.lane + 0.004,
    });
  }
}
