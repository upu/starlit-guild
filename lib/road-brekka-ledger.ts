import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadBattle, TravellerId } from "./road-view.ts";
import { brekkaLedgerLayout } from "./road-brekka-ledger-layout.ts";
import { LindeViewportTransition } from "./road-linde-viewport.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";
import { waterwayAt } from "./road-waterway-contacts.ts";

export const brekkaLedgerAssets = {
  bank: "/storybook-study/brekka-alley-v1.png",
  portrait: "/storybook-study/brekka-ledger-portrait-v1.png",
  visitPortrait: "/storybook-study/brekka-visit-portrait-v1.png",
  outskirts: "/storybook-study/founding-return-path-v1.png",
  outskirtsPortrait: "/storybook-study/brekka-outskirts-portrait-v1.png",
  table: "/storybook-study/medicine-table-v1.webp",
  ledger: "/storybook-study/bed-open-ledger-v1.webp",
  finn: "/storybook-study/finn-conversation-balanced-v3.webp",
  notes: "/storybook-study/shipping-record-v1.webp",
  worker: "/storybook-study/brekka-worker-drinks-v1.webp",
};
export const BREKKA_VISIT_BANK = "/storybook-study/brekka-homes-v1.png";
const desk = { x: 820, y: 645 };
const entry = { x: 430, y: 735 };
const position = { x: 750, y: 685 };
type Frame = { battle: RoadBattle; look: RoadLook };

/** The isolated trial uses the real work node without changing the saved run. */
export function presentBrekkaLedger(frame: Frame, input: AdventureInput, view: RoadViewport) {
  if (
    input.backgroundOverride === BREKKA_VISIT_BANK &&
    frame.look.storybookHeroes &&
    frame.look.quest === "brekka-arrival"
  ) {
    frame.look.destination = false;
    frame.look.brekkaJourney = {
      node: input.squad.run?.node ?? 14,
      completed: !!input.questComplete,
      working: input.squad.run?.phase === "work",
      idle: !input.squad.run,
      paused: input.paused,
      instant: !!input.skipVisual,
    };
    return;
  }
  if (
    input.backgroundOverride !== brekkaLedgerAssets.bank ||
    !frame.look.storybookHeroes ||
    frame.look.quest !== "brekka-arrival" ||
    input.squad.run?.node !== 2 ||
    frame.battle.enemies.some((enemy) => enemy.hp > 0)
  )
    return;
  brekkaLedgerScene(frame, view, "finn", input.paused);
}

export function brekkaLedgerScene(
  frame: Frame,
  view: RoadViewport,
  actor: TravellerId | undefined,
  paused: boolean,
) {
  const layout = brekkaLedgerLayout(view);
  frame.look.brekkaLedger = { active: true, actor, paused };
  Object.assign(frame.look, {
    background: brekkaLedgerAssets.bank,
    backgroundShade: 0.04,
    workers: [],
    destination: false,
  });
  frame.battle.distance = 0;
  frame.battle.effects = [];
  frame.battle.gathering = null;
  frame.battle.heroes = frame.battle.heroes
    .filter((hero) => hero.id === actor)
    .map((hero) => ({ ...hero, ...layout.world(entry.x, entry.y), walking: false, facing: 1 }));
}

export class RoadBrekkaLedger {
  private key = "";
  private started = 0;
  private viewport = new LindeViewportTransition();
  prepare(frame: Frame, key: string, view: RoadViewport, reduced: boolean): Frame {
    if (!frame.look.brekkaLedger) return frame;
    if (key !== this.key) {
      this.key = key;
      this.started = frame.battle.time;
      this.viewport = new LindeViewportTransition();
    }
    const display = this.viewport.update(
      view,
      frame.battle.time,
      reduced || !!frame.look.brekkaLedger.paused,
    );
    const layout = brekkaLedgerLayout(view, display.portrait);
    const target = frame.battle.time - this.started < 600 ? entry : position;
    return {
      ...frame,
      look: { ...frame.look, brekkaLedger: { ...frame.look.brekkaLedger, ...display } },
      battle: {
        ...frame.battle,
        waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: true },
        heroes: frame.battle.heroes.map((hero) => ({
          ...hero,
          ...layout.world(target.x, target.y),
        })),
      },
    };
  }
  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
    const scene = battle.waterwayActions;
    if (!look.brekkaLedger || !scene) return;
    const layout = brekkaLedgerLayout(view, look.brekkaLedger.portrait);
    const point = layout.world(desk.x, desk.y);
    const table = housecallProp(
      view,
      "brekka-ledger-table",
      brekkaLedgerAssets.table,
      point,
      200,
      layout.scale,
    );
    const ledger = housecallProp(
      view,
      "brekka-ledger-open",
      brekkaLedgerAssets.ledger,
      layout.world(desk.x, desk.y - 72),
      78,
      layout.scale,
    );
    ledger.depth = point.lane + 0.03;
    scene.props.push(table, ledger);
    scene.actors = [
      {
        id: "brekka-brewery-worker",
        point: layout.world(895, 525),
        pose: {
          asset: brekkaLedgerAssets.worker,
          frame: 0,
          cell: 128,
          rows: 1,
          square: { foot: 120, height: 94 },
        },
        size: layout.figureRatio * 0.8,
        facing: -1,
      },
    ];
    const actor = battle.heroes.find((hero) => hero.id === look.brekkaLedger?.actor);
    if (actor && !actor.walking && waterwayAt(actor, layout.world(position.x, position.y), view)) {
      const asset =
        actor.id === "finn"
          ? brekkaLedgerAssets.finn
          : actor.id === "lico"
            ? "/storybook-study/lico-conversation-ponytail-v1.webp"
            : `/storybook-study/${actor.id}-conversation-v1.webp`;
      scene.poses[actor.id] = { asset, frame: 1 };
    }
  }
}
