import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { waterwaySearchAssets } from "./road-waterway-search.ts";
import { waterwaySearchReturnFrame } from "./road-waterway-search-return.ts";

type Frame = { battle: RoadBattle; look: RoadLook };
function livingActors(battle: RoadBattle) {
  return battle.heroes.filter((hero) => ["aria", "leon"].includes(hero.id) && hero.hp > 0);
}
function ready(battle: RoadBattle) {
  const actors = livingActors(battle);
  return actors.every((hero) => !hero.walking && !!battle.waterwayActions?.poses[hero.id]);
}

/** Wait for the final inspection before revealing the blocked outlet. */
export class RoadWaterwaySearchCompletion {
  private key = "";
  private started?: number;
  private inspectionAt?: number;
  private transitionAt?: number;
  private revealed = false;
  private fade = 0;

  prepare(frame: Frame, key: string, view: RoadViewport): Frame {
    if (!frame.look.waterwaySearchFinalizing) return frame;
    if (this.key !== key) {
      this.key = key;
      this.started = this.inspectionAt = this.transitionAt = undefined;
      this.revealed = false;
      this.fade = 0;
    }
    const look = { ...frame.look, waterwaySearchReturn: { scene: this.revealed, fade: this.fade } };
    if (!this.revealed) return { ...frame, look };
    return {
      battle: waterwaySearchReturnFrame(frame.battle, view),
      look: {
        ...look,
        waterway: undefined,
        background: waterwaySearchAssets.returnBank,
        backgroundShade: 0,
        workers: [],
        destination: false,
        work: undefined,
      },
    };
  }
  update(battle: RoadBattle, look: RoadLook, reduced: boolean) {
    if (!look.waterwaySearchFinalizing) return;
    this.started ??= battle.time;
    if (this.transitionAt === undefined) {
      if (ready(battle)) this.inspectionAt ??= battle.time;
      else this.inspectionAt = undefined;
      if (this.readyToTransition(battle, reduced)) this.transitionAt = battle.time;
    }
    if (this.transitionAt !== undefined) this.advance(battle, look, reduced);
  }
  private readyToTransition(battle: RoadBattle, reduced: boolean) {
    return (
      !livingActors(battle).length ||
      (this.inspectionAt !== undefined &&
        battle.time - this.inspectionAt >= (reduced ? 0 : 1200)) ||
      battle.time - (this.started ?? battle.time) >= 10000
    );
  }
  private advance(battle: RoadBattle, look: RoadLook, reduced: boolean) {
    const elapsed = battle.time - (this.transitionAt ?? battle.time);
    if (reduced) {
      if (look.waterwaySearchReturn?.scene) battle.waterwaySearchVisualComplete = true;
      this.revealed = true;
      return;
    }
    if (elapsed >= 400 && !this.revealed) {
      this.revealed = true;
      this.transitionAt = battle.time - 400;
      this.fade = 1;
    } else if (elapsed >= 800 && look.waterwaySearchReturn?.scene) {
      this.fade = 0;
      battle.waterwaySearchVisualComplete = true;
    } else this.fade = Math.max(0, 1 - Math.abs(elapsed - 400) / 400);
    if (look.waterwaySearchReturn) look.waterwaySearchReturn.fade = this.fade;
  }
}
