import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadBattle, Traveller, TravellerId } from "./road-view.ts";
import { lanternRoadAssets as assets, lanternRoadLayout } from "./road-lantern-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";
import { LindeViewportTransition } from "./road-linde-viewport.ts";
import { waterwayAt, type WaterwayActions } from "./road-waterway-contacts.ts";
import { chapterFourWork } from "./chapter-four.ts";

type Frame = { battle: RoadBattle; look: RoadLook };
const workId = (node: number) => (node % 3 === 1 ? "leon" : node % 3 === 2 ? "aria" : undefined);
const lantern = [1170, 630] as const;
const grass = [1010, 745] as const;
const positions = { leon: [1100, 625], aria: [900, 760] } as const;
const home: Record<string, readonly [number, number]> = {
  aria: [480, 690],
  leon: [610, 720],
  mira: [690, 650],
  finn: [870, 720],
  lico: [400, 740],
};

export function presentLanternRoad(frame: Frame, input: AdventureInput, view: RoadViewport) {
  const { battle, look } = frame;
  if (
    !look.storybookHeroes ||
    look.quest !== "lantern-detour" ||
    input.backgroundOverride !== assets.bank
  )
    return;
  look.lanternRoad = {
    node: input.questComplete ? 14 : (input.squad.run?.node ?? 14),
    completed: !!input.questComplete,
    working: input.squad.run?.phase === "work",
    instant: !!input.skipVisual,
    paused: input.paused,
  };
  Object.assign(look, {
    background: assets.bank,
    backgroundShade: 0.04,
    destination: false,
    puller: null,
    frontCarriers: [],
    workers: [],
  });
  const layout = lanternRoadLayout(view),
    original = battle.heroes,
    originalEnemies = battle.enemies;
  Object.assign(battle, { distance: 0, stage: "forest" });
  battle.heroes = original.map((hero) => ({
    ...hero,
    ...layout.world(...home[hero.id]),
    walking: false,
    facing: 1,
  }));
  battle.enemies = battle.enemies.map((enemy, i) => ({
    ...enemy,
    ...layout.world(1060 + i * 75, 750 + i * 40),
  }));
  battle.effects = battle.effects.map((effect) => {
    const patient = original.findIndex((hero) => hero.x === effect.x && hero.lane === effect.lane);
    const enemy = originalEnemies.findIndex(
      (target) => target.x === effect.x && target.lane === effect.lane,
    );
    const source = original.findIndex(
      (hero) => hero.x === effect.fromX && hero.lane === effect.fromLane,
    );
    return {
      ...effect,
      ...(enemy >= 0
        ? { x: battle.enemies[enemy].x, lane: battle.enemies[enemy].lane }
        : patient >= 0
          ? { x: battle.heroes[patient].x, lane: battle.heroes[patient].lane }
          : {}),
      ...(source >= 0
        ? { fromX: battle.heroes[source].x, fromLane: battle.heroes[source].lane }
        : {}),
    };
  });
}

/** Renderer-only motion. The worker and props never alter the quest state. */
export class RoadLanternRoad {
  private key = "";
  private porter = { x: 720, y: 560 };
  private at = 0;
  private startAt = 0;
  private formation = 0;
  private node = 0;
  private routed = false;
  private settled = { aria: false, leon: false };
  private activeSince?: number;
  private workAt?: number;
  private doneAt?: number;
  private complete = false;
  private returning = false;
  private returnAt = 0;
  private clock = 0;
  private viewport = new LindeViewportTransition();

  prepare(frame: Frame, key: string, view: RoadViewport, reduced: boolean): Frame {
    const site = frame.look.lanternRoad;
    if (!site) return frame;
    if (this.key !== key) {
      this.key = key;
      this.porter = { x: site.completed ? 1020 : 720, y: 560 };
      this.at = frame.battle.time;
      this.startAt = frame.battle.time;
      this.formation = 0;
      this.node = site.node;
      this.routed = false;
      this.settled = { aria: false, leon: false };
      this.activeSince = undefined;
      this.workAt = undefined;
      this.doneAt = undefined;
      this.complete = site.completed;
      this.returning = false;
      this.returnAt = 0;
      this.clock = frame.battle.time;
      this.viewport = new LindeViewportTransition();
    }
    this.advance(site, frame.battle);
    const display = this.viewport.update(view, frame.battle.time, reduced || !!site.paused);
    this.formation =
      reduced || this.complete
        ? 1
        : Math.max(0, Math.min(1, (frame.battle.time - this.startAt) / 2500));
    const layout = lanternRoadLayout(view, display.portrait);
    const battle: RoadBattle = {
      ...frame.battle,
      waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: true },
    };
    const fight = battle.enemies.some((enemy) => enemy.hp > 0);
    const working = this.working(site);
    if (working && !fight) this.activeSince ??= battle.time;
    battle.heroes = battle.heroes.map((hero) => ({
      ...hero,
      ...layout.world(
        ...this.target(hero.id, this.node, fight || this.complete || this.returning, working),
      ),
      walking: false,
      facing: 1,
    }));
    const look = {
      ...frame.look,
      lanternRoad: { ...site, ...display, node: this.node, working, visualComplete: this.complete },
      workers: [],
    };
    if (look.work)
      look.work = {
        ...look.work,
        label: chapterFourWork("lantern-detour", this.node)?.name ?? look.work.label,
      };
    return { battle, look };
  }

  private working(site: NonNullable<RoadLook["lanternRoad"]>) {
    return site.working || site.completed || site.node > this.node;
  }

  private advance(site: NonNullable<RoadLook["lanternRoad"]>, battle: RoadBattle) {
    const delta = Math.max(0, battle.time - this.clock);
    this.clock = battle.time;
    if (battle.enemies.some((enemy) => enemy.hp > 0)) {
      this.freezeClock(delta);
      return;
    }
    if (site.instant) {
      this.node = 14;
      this.complete = true;
      this.returning = false;
      return;
    }
    if (site.node > this.node && this.doneAt !== undefined && battle.time - this.doneAt >= 300) {
      this.node++;
      this.activeSince = undefined;
      this.routed = false;
      this.workAt = undefined;
      this.doneAt = undefined;
    }
    if (
      site.completed &&
      this.node === 14 &&
      this.doneAt !== undefined &&
      battle.time - this.doneAt >= 300 &&
      !this.returning &&
      !this.complete
    ) {
      this.returning = true;
      this.returnAt = battle.time;
    }
  }

  private freezeClock(delta: number) {
    if (this.activeSince !== undefined) this.activeSince += delta;
    this.startAt += delta;
    if (this.workAt !== undefined) this.workAt += delta;
    if (this.doneAt !== undefined) this.doneAt += delta;
    if (this.returning) this.returnAt += delta;
  }

  private target(
    id: TravellerId,
    node: number,
    fight: boolean,
    working = true,
  ): readonly [number, number] {
    const work = fight ? undefined : this.workTarget(id, node, working);
    if (work) return work;
    const [x, y] = home[id];
    return [x + 120 * this.formation, y - 40 * this.formation];
  }

  private workTarget(
    id: TravellerId,
    node: number,
    working: boolean,
  ): readonly [number, number] | undefined {
    if (id !== "aria" && id !== "leon") return undefined;
    if (this.settled[id]) return positions[id];
    if (!working || id !== workId(node)) return undefined;
    if (this.routed) return positions[id];
    return id === "leon" ? [930, 800] : [820, 820];
  }

  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport, reduced: boolean) {
    const site = look.lanternRoad,
      scene = battle.waterwayActions;
    if (!site || !scene) return;
    const layout = lanternRoadLayout(view, site.portrait);
    const fighting = battle.enemies.some((enemy) => enemy.hp > 0);
    this.drawPorter(
      scene,
      layout,
      battle.time,
      reduced,
      fighting,
      site.working && site.node % 3 === 0,
    );
    scene.props.push(
      housecallProp(
        view,
        "road-lantern",
        assets.lantern,
        layout.world(...lantern),
        105,
        layout.scale,
      ),
    );
    scene.props.push(
      housecallProp(view, "road-grass", assets.grass, layout.world(...grass), 120, layout.scale),
    );
    if (fighting || this.complete) return;
    if (this.returning) {
      this.finishReturn(battle, site, layout, view);
      return;
    }
    if (!site.working) return;
    if (site.node % 3 === 0) {
      this.finishGuidance(battle.time);
      return;
    }
    this.drawWork(battle, scene, layout, view, site.node, reduced);
    if (battle.time - (this.activeSince ?? battle.time) >= 6000) this.doneAt ??= battle.time;
  }

  private finishGuidance(time: number) {
    if (
      this.formation >= 1 &&
      Math.abs(this.porter.x - 1020) < 2 &&
      time - (this.activeSince ?? time) >= (this.node < 3 ? 900 : 500)
    )
      this.doneAt ??= time;
  }

  private finishReturn(
    battle: RoadBattle,
    site: NonNullable<RoadLook["lanternRoad"]>,
    layout: ReturnType<typeof lanternRoadLayout>,
    view: RoadViewport,
  ) {
    const ready = battle.heroes.every(
      (hero) =>
        hero.hp <= 0 ||
        hero.paralyzed ||
        (!hero.walking &&
          waterwayAt(hero, layout.world(...this.target(hero.id, this.node, true)), view)),
    );
    if (ready || battle.time - this.returnAt >= 8000) {
      this.complete = true;
      site.visualComplete = true;
    }
  }

  private drawWork(
    battle: RoadBattle,
    scene: WaterwayActions,
    layout: ReturnType<typeof lanternRoadLayout>,
    view: RoadViewport,
    node: number,
    reduced: boolean,
  ) {
    const id = workId(node);
    const hero = battle.heroes.find((item) => item.id === id);
    if (!hero || !this.readyForWork(hero, layout, view, node)) return;
    if (!this.routed) {
      this.routed = true;
      return;
    }
    if (id) this.settled[id] = true;
    scene.poses[hero.id] =
      id === "aria"
        ? { asset: assets.ariaWeed, frame: reduced ? 1 : 1 + (Math.floor(battle.time / 650) % 2) }
        : { asset: assets.ariaWork, frame: 7, rows: 2 };
    this.workAt ??= battle.time;
    if (battle.time - this.workAt >= (node < 3 ? 900 : 500)) this.doneAt ??= battle.time;
  }

  private readyForWork(
    hero: Traveller,
    layout: ReturnType<typeof lanternRoadLayout>,
    view: RoadViewport,
    node: number,
  ) {
    return (
      hero.hp > 0 &&
      !hero.paralyzed &&
      !hero.walking &&
      waterwayAt(hero, layout.world(...this.target(hero.id, node, false)), view)
    );
  }

  private drawPorter(
    scene: WaterwayActions,
    layout: ReturnType<typeof lanternRoadLayout>,
    time: number,
    reduced: boolean,
    fighting: boolean,
    guiding: boolean,
  ) {
    const dt = Math.max(0, Math.min(0.05, (time - this.at) / 1000));
    this.at = time;
    const dx = 1020 - this.porter.x,
      dy = 560 - this.porter.y,
      distance = Math.hypot(dx, dy);
    const amount = fighting ? 0 : reduced ? 1 : Math.min(1, (145 * dt) / (distance || 1));
    this.porter = { x: this.porter.x + dx * amount, y: this.porter.y + dy * amount };
    scene.actors = [
      {
        id: "lantern-porter",
        point: layout.world(this.porter.x, this.porter.y),
        size: layout.figureRatio,
        facing: 1,
        pose: {
          asset: assets.porter,
          cell: 128,
          rows: 3,
          frame:
            distance > 1 && !reduced && !fighting
              ? 8 + (Math.floor(time / 180) % 4)
              : guiding && !fighting
                ? 1
                : 0,
          square: { foot: 120, height: 104 },
        },
      },
    ];
  }
}
