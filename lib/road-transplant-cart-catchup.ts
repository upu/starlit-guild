import type { RoadBattle } from "./road-view.ts";

/** Move the visual cart back toward its simulation position after a pickup. */
export class TransplantCartCatchup {
  private x?: number;
  private at?: number;
  private catching = false;
  reset() {
    this.x = undefined;
    this.at = undefined;
    this.catching = false;
  }
  update(battle: RoadBattle, held: boolean) {
    const cart = battle.gathering;
    if (!cart || cart.task !== "carry") {
      this.reset();
      return battle;
    }
    const dt = Math.max(0, Math.min(0.1, (battle.time - (this.at ?? battle.time)) / 1000));
    this.at = battle.time;
    if (held) {
      this.x = cart.x;
      this.catching = true;
    } else if (this.x === undefined || !this.catching) this.x = cart.x;
    else if (!battle.enemies.some((enemy) => enemy.hp > 0)) {
      const distance = cart.x - this.x;
      this.x += Math.sign(distance) * Math.min(Math.abs(distance), 160 * dt);
      if (Math.abs(cart.x - this.x) < 0.001) this.catching = false;
    }
    return { ...battle, gathering: { ...cart, x: this.x } };
  }
}
