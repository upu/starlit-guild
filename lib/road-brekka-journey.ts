import type { RoadLook } from "./road-look.ts";
import type { RoadBattle, TravellerId } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { brekkaLedgerScene } from "./road-brekka-ledger.ts";
import { BrekkaLedgerSequence } from "./road-brekka-sequence.ts";
import { BrekkaBattlePlace } from "./road-brekka-battle-place.ts";
import { BrekkaArrivalTransition } from "./road-brekka-arrival-transition.ts";
import { finishBrekkaNotes } from "./road-brekka-notes.ts";

type Frame = { battle: RoadBattle; look: RoadLook };
const order: TravellerId[] = ["finn", "leon", "aria", "mira", "lico"];

function presentWork(
  result: Frame,
  view: RoadViewport,
  actor: TravellerId | undefined,
  step: ReturnType<BrekkaLedgerSequence["update"]>,
  site: NonNullable<RoadLook["brekkaJourney"]>,
) {
  if (step.showLedger && step.node === 14) brekkaLedgerScene(result, view, actor, site.paused);
  else if (step.showLedger) {
    result.look.brekkaNotes = { actor, node: step.node ?? site.node, generation: step.generation };
    result.look.workers = actor ? [actor] : [];
    result.battle.gathering = null;
  } else if (site.node % 3 === 2 && !result.battle.enemies.some((e) => e.hp > 0)) {
    result.battle.gathering = null;
    result.look.workers = [];
  }
}

export class BrekkaSceneReset {
  private ledger = false;
  private idle = false;
  changed(look: RoadLook) {
    const ledger = !!look.brekkaLedger;
    const idle = !!(look.brekkaJourney?.idle || look.brekkaJourney?.arrival);
    const changed = ledger !== this.ledger || (idle && !this.idle);
    this.ledger = ledger;
    this.idle = idle;
    return changed;
  }
}

/** The investigation is a visual interlude; the live run continues unchanged. */
export class RoadBrekkaJourney {
  private key = "";
  private sequence = new BrekkaLedgerSequence();
  private place = new BrekkaBattlePlace();
  private arrival = new BrekkaArrivalTransition();
  prepare(frame: Frame, key: string, view: RoadViewport, reduced: boolean): Frame {
    const site = frame.look.brekkaJourney;
    if (!site) return frame;
    if (key !== this.key) {
      this.key = key;
      this.sequence = new BrekkaLedgerSequence();
      this.place = new BrekkaBattlePlace();
      this.arrival = new BrekkaArrivalTransition();
    }
    const actor = order.find((id) =>
      frame.battle.heroes.some((h) => h.id === id && h.hp > 0 && !h.paralyzed),
    );
    const fighting = frame.battle.enemies.some((e) => e.hp > 0);
    const place = this.place.update({
      ...site,
      fighting,
      reduced,
      defer: this.sequence.activeScene,
      time: frame.battle.time,
    });
    const step = this.sequence.update({
      ...site,
      fighting: fighting || place.busy,
      available: !!actor,
      reduced,
      skip: site.instant || site.idle,
      time: frame.battle.time,
    });
    const arrival = this.arrival.update({
      ready: step.complete && !place.busy && !fighting,
      paused: site.paused,
      instant: reduced || site.instant || site.idle,
      time: frame.battle.time,
    });
    const result: Frame = {
      battle: { ...frame.battle },
      look: {
        ...frame.look,
        brekkaJourney: {
          ...site,
          fade: Math.max(step.node === 14 ? step.fade : 0, place.fade, arrival.fade),
          field: place.field,
          arrival: arrival.arrival,
          visualComplete: arrival.complete,
          displayNode: step.phase === "route" ? site.node : (step.node ?? site.node),
          generation: step.generation,
        },
      },
    };
    presentWork(result, view, actor, step, site);
    return result;
  }
  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
    finishBrekkaNotes(battle, look, view);
    const actor = look.brekkaLedger?.actor ?? look.brekkaNotes?.actor;
    if (actor && battle.waterwayActions?.poses[actor]) this.sequence.inspected(battle.time);
  }
}
