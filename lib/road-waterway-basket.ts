import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./chapter-road-presentation.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { roadDepth, roadHeroSize } from "./road-layout.ts";
import { waterwayLayout } from "./road-waterway-layout.ts";
import { WATERWAY_BRANCHES } from "./road-waterway.ts";
import {
  waterwayActionAssets as assets,
  waterwayPalms as palms,
  waterwayPalm,
  waterwayFoot,
  waterwayAt,
  waterwayMix,
  type WaterwayActions,
} from "./road-waterway-contacts.ts";

export class RoadWaterwayBasket {
  private node = -1;
  private at?: number;
  private filled = false;
  prepare(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
    const node = look.waterway?.node ?? -1;
    if (this.node < 0 && node > 7) this.filled = true;
    if (node !== this.node) {
      this.node = node;
      this.at = undefined;
    }
    if (![7, 10].includes(node)) return;
    const targets = this.targets(view);
    battle.heroes = battle.heroes.map((hero) => ({
      ...hero,
      ...(hero.id === "aria" ? targets.aria : targets.leon),
      facing: hero.id === "aria" ? 1 : -1,
    }));
    look.workers = ["aria", "leon"];
    if (battle.gathering)
      battle.gathering = { ...battle.gathering, x: targets.pick.x - 65, lane: targets.pick.lane };
  }
  finish(battle: RoadBattle, view: RoadViewport, scene: WaterwayActions, reduced: boolean) {
    const targets = this.targets(view);
    if (![7, 10].includes(this.node)) {
      this.paintBasket(scene, targets.basket);
      return;
    }
    const { aria, leon } = this.participants(battle, targets, view);
    if (aria) scene.poses.aria = { asset: assets.ariaWork, frame: 3 };
    if (leon) scene.poses.leon = { asset: assets.leonWork, frame: 1 };
    if (!aria || !leon) {
      this.paintBasket(scene, targets.basket);
      return;
    }
    this.at ??= battle.time;
    const age = reduced ? 1000 : battle.time - this.at;
    if (age >= 900) this.filled = true;
    this.paintBasket(scene, targets.basket, leon.lane + 0.002);
    this.paintCollection(scene, aria, leon, view, targets.basket, age);
  }
  private participants(
    battle: RoadBattle,
    targets: ReturnType<RoadWaterwayBasket["targets"]>,
    view: RoadViewport,
  ) {
    const aria = battle.heroes.find((h) => h.id === "aria"),
      leon = battle.heroes.find((h) => h.id === "leon");
    return {
      aria: aria && waterwayAt(aria, targets.aria, view) ? aria : undefined,
      leon: leon && waterwayAt(leon, targets.leon, view) ? leon : undefined,
    };
  }
  private paintBasket(
    scene: WaterwayActions,
    point: { x: number; lane: number },
    depth = point.lane,
  ) {
    scene.props.push({
      asset: this.filled ? assets.filled : assets.basket,
      point,
      size: 0.32,
      depth,
    });
  }
  private paintCollection(
    scene: WaterwayActions,
    aria: RoadBattle["heroes"][number],
    leon: RoadBattle["heroes"][number],
    view: RoadViewport,
    basket: { x: number; lane: number },
    age: number,
  ) {
    scene.poses.aria = { asset: assets.ariaWork, frame: age < 450 ? 3 : 1 };
    scene.debrisHidden = age >= 250;
    if (age < 250 || age >= 900) return;
    const hand = waterwayPalm(aria, age < 450 ? palms.ariaPick : palms.ariaDeposit, 1, view);
    scene.props.push({
      asset: WATERWAY_BRANCHES,
      point: age < 650 ? hand : waterwayMix(hand, basket, (age - 650) / 250),
      size: 0.32,
      depth: leon.lane + 0.002,
    });
  }
  private targets(view: RoadViewport) {
    const layout = waterwayLayout(view.width, view.height),
      pick = layout.world(1035, 665);
    const aria = waterwayFoot(pick, palms.ariaPick, 1, view);
    const deposit = waterwayPalm(aria, palms.ariaDeposit, 1, view);
    const basket = {
      ...deposit,
      lane:
        deposit.lane +
        (((roadHeroSize(view.width, view.height) * 0.32 * 198) / 256) * 0.87) /
          roadDepth(view.width, view.height),
    };
    return { pick, aria, basket, leon: waterwayFoot(basket, palms.leonKneel, -1, view) };
  }
}
