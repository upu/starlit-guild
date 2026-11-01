import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { AdventureInput } from "./adventure-presentation.ts";
import type { Quest } from "./game.ts";
import { workPoint } from "./chapter-road.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { forestReturnAssets, forestReturnFrame } from "./road-forest-return.ts";

export function prepareForestCompletion(
  battle: RoadBattle,
  look: RoadLook,
  input: AdventureInput,
  quest: Quest,
) {
  const run = input.squad.run;
  if (!input.forestFinalizing || !run) return;
  battle.distance = workPoint(quest, run);
  battle.enemies = [];
  look.workers = input.squad.members.filter((id) => run.health[id].hp > 0);
}

function gatheringReady(battle: RoadBattle) {
  const aria = battle.heroes.find((hero) => hero.id === "aria");
  const jar = battle.handheld?.find((item) => item.kind === "forest-moss-jar");
  return !!battle.gathering && !!aria && !aria.walking && jar?.phase === "ground" && !jar.returning;
}

/** Rendering-only pause at the last gathering point; the saved quest is already complete. */
export class RoadForestCompletion {
  private key = "";
  private started?: number;
  private gatheringAt?: number;
  private transitionAt?: number;
  private revealed = false;
  private fade = 0;

  prepare(frame: { battle: RoadBattle; look: RoadLook }, key: string, view: RoadViewport) {
    if (!frame.look.forestFinalizing) return frame;
    if (this.key !== key) {
      this.key = key;
      this.started = undefined;
      this.gatheringAt = undefined;
      this.transitionAt = undefined;
      this.revealed = false;
      this.fade = 0;
    }
    const look = { ...frame.look, forestReturn: { scene: this.revealed, fade: this.fade } };
    if (!this.revealed) return { ...frame, look };
    return {
      battle: forestReturnFrame(frame.battle, view),
      look: {
        ...look,
        background: forestReturnAssets.background,
        backgroundShade: 0,
        workers: [],
        destination: false,
        work: undefined,
      },
    };
  }

  update(battle: RoadBattle, look: RoadLook, reduced: boolean) {
    if (!look.forestFinalizing) {
      this.started = undefined;
      this.gatheringAt = undefined;
      return;
    }
    this.started ??= battle.time;
    if (this.transitionAt === undefined) {
      if (gatheringReady(battle)) this.gatheringAt ??= battle.time;
      else this.gatheringAt = undefined;
      if (this.readyToTransition(battle, reduced)) this.transitionAt = battle.time;
    }
    if (this.transitionAt === undefined) return;
    this.advance(battle, look, reduced);
  }

  private readyToTransition(battle: RoadBattle, reduced: boolean) {
    const aria = battle.heroes.find((hero) => hero.id === "aria");
    return (
      !aria ||
      aria.hp <= 0 ||
      (this.gatheringAt !== undefined && battle.time - this.gatheringAt >= (reduced ? 0 : 1200)) ||
      battle.time - (this.started ?? battle.time) >= 10000
    );
  }

  private advance(battle: RoadBattle, look: RoadLook, reduced: boolean) {
    const elapsed = battle.time - (this.transitionAt ?? battle.time);
    if (reduced) {
      if (look.forestReturn?.scene) battle.forestVisualComplete = true;
      this.revealed = true;
      return;
    }
    if (elapsed >= 400 && !this.revealed) {
      this.revealed = true;
      this.transitionAt = battle.time - 400;
      this.fade = 1;
    } else if (elapsed >= 800 && look.forestReturn?.scene) {
      this.fade = 0;
      battle.forestVisualComplete = true;
    } else this.fade = Math.max(0, 1 - Math.abs(elapsed - 400) / 400);
    if (look.forestReturn) look.forestReturn.fade = this.fade;
  }
}
