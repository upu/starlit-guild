import type { RoadLook } from "./chapter-road-presentation.ts";
import type { RoadBattle } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { journeyCartGrip, type JourneyCart } from "./road-journey-cart.ts";
import { roadScale } from "./road-layout.ts";
import { waterwayLayout } from "./road-waterway-layout.ts";
import { WATERWAY_TOOL_CART } from "./road-waterway.ts";

type Frame = { battle: RoadBattle; look: RoadLook };
/** One tool cart stays in the workyard through guards, debris collection and drainage. */
export class RoadWaterwayMotion {
  private key = "";
  private sourceX = 500;
  private at = 0;
  private phase: JourneyCart["phase"] = "parked";
  prepare(frame: Frame, key: string, view: RoadViewport, reduced: boolean): Frame {
    if (!frame.look.waterway || frame.look.quest !== "tower-restoration") {
      this.key = "";
      return frame;
    }
    if (key !== this.key) {
      this.key = key;
      this.at = frame.battle.time;
      this.sourceX = frame.look.waterway.node > 2 ? 900 : 500;
      this.phase = "parked";
    }
    const dt = Math.max(0, Math.min(0.05, (frame.battle.time - this.at) / 1000));
    this.at = frame.battle.time;
    const active = frame.look.waterway.node === 2 && !frame.battle.enemies.some((e) => e.hp > 0);
    this.advance(active, reduced, dt);
    const cart: JourneyCart = {
      ...waterwayLayout(view.width, view.height).world(this.sourceX, 680),
      phase: this.phase,
      returning: false,
      asset: WATERWAY_TOOL_CART,
    };
    const battle = { ...frame.battle, journeyCart: cart };
    if (!active) return { battle, look: frame.look };
    battle.heroes = battle.heroes.map((hero) => ({
      ...hero,
      ...journeyCartGrip(hero, cart, view, battle.stage),
      walking: false,
      facing: 1,
    }));
    if (battle.gathering)
      battle.gathering = { ...battle.gathering, x: cart.x - 65, lane: cart.lane };
    return {
      battle,
      look: { ...frame.look, workers: ["aria", "leon"], frontCarriers: ["leon"], puller: "leon" },
    };
  }
  private advance(active: boolean, reduced: boolean, dt: number) {
    if (!active) {
      this.phase = "parked";
      return;
    }
    if (this.phase === "parked") this.phase = "retrieving";
    if (this.phase === "moving") this.sourceX = Math.min(900, this.sourceX + dt * 140);
    if (reduced) {
      this.sourceX = 900;
      this.phase = "moving";
    }
  }
  finish(battle: RoadBattle, view: RoadViewport) {
    const cart = battle.journeyCart;
    if (!cart || cart.asset !== WATERWAY_TOOL_CART || this.phase !== "retrieving") return;
    if (
      battle.heroes.every((hero) => {
        const grip = journeyCartGrip(hero, cart, view, battle.stage);
        return (
          Math.abs(hero.x - grip.x) * roadScale(view.width) < 2 &&
          Math.abs(hero.lane - grip.lane) < 0.02
        );
      })
    )
      this.phase = "moving";
    cart.phase = this.phase;
  }
}
