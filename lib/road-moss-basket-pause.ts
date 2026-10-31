import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadLook } from "./chapter-road-presentation.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import {
  waterwayActionAssets as assets,
  waterwayPalm,
  waterwayFoot,
  waterwayAt,
  waterwayMix,
  type WaterwayActions,
  type WaterwayPoint,
} from "./road-waterway-contacts.ts";

/** A carried basket is lowered before combat, then picked up from that same ground point. */
export class RoadMossBasketPause {
  private held?: WaterwayPoint;
  private foot?: WaterwayPoint;
  private facing: 1 | -1 = 1;
  private ground?: WaterwayPoint;
  private started = 0;
  private recoveredAt?: number;
  private fighting = false;
  private recovered = false;
  prepare(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
    this.fighting = battle.enemies.some((e) => e.hp > 0);
    if (this.fighting && this.held && this.foot && !this.ground) {
      this.ground = { x: this.held.x, lane: this.foot.lane };
      this.started = battle.time;
    }
    if (!this.ground || !this.foot) return false;
    if (this.fighting && battle.time - this.started >= 350) return true;
    const target = this.fighting
      ? this.foot
      : waterwayFoot(this.ground, [144, 172], this.facing, view);
    battle.heroes = battle.heroes.map((hero) =>
      hero.id === "leon" ? { ...hero, ...target, facing: this.facing } : hero,
    );
    look.workers = ["leon"];
    return true;
  }
  finish(
    battle: RoadBattle,
    view: RoadViewport,
    scene: WaterwayActions,
  ): WaterwayPoint | undefined {
    const ground = this.ground,
      held = this.held;
    if (!ground || !held) return;
    if (this.fighting) {
      const age = battle.time - this.started;
      if (age < 350) scene.poses.leon = { asset: assets.leonWork, frame: 3 };
      return waterwayMix(held, ground, age / 350);
    }
    const leon = battle.heroes.find((h) => h.id === "leon");
    if (!leon || !waterwayAt(leon, waterwayFoot(ground, [144, 172], this.facing, view), view))
      return ground;
    this.recoveredAt ??= battle.time;
    const age = battle.time - this.recoveredAt;
    scene.poses.leon = { asset: assets.leonWork, frame: age < 300 ? 3 : 2 };
    const hand = waterwayPalm(leon, [134, 117], this.facing, view);
    const point = waterwayMix(ground, hand, (age - 300) / 350);
    if (age >= 650) {
      this.ground = undefined;
      this.held = undefined;
      this.recoveredAt = undefined;
      this.recovered = true;
    }
    return point;
  }
  record(point: WaterwayPoint, leon: Traveller) {
    if (this.ground) return;
    this.held = { ...point };
    this.foot = { x: leon.x, lane: leon.lane };
    this.facing = leon.facing;
  }
  clearHeld() {
    if (this.ground) return;
    this.held = undefined;
    this.foot = undefined;
  }
  takeRecovered() {
    const recovered = this.recovered;
    this.recovered = false;
    return recovered;
  }
}
