import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { WaterwayActions } from "./road-waterway-contacts.ts";
import { waterwayAt } from "./road-waterway-contacts.ts";
import { foundationLayout } from "./road-housecalls-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";
import { roadDepth } from "./road-layout.ts";
import { chapterThreeWork } from "./chapter-three.ts";
import {
  foundationReturnAssets,
  foundationReturnGear,
  foundationReturnScene,
  foundationReturnTarget,
} from "./road-foundation-return.ts";

export const foundationAssets = {
  bank: "/storybook-study/berne-foundation-grass-v2.png",
  table: "/storybook-study/medicine-table-v1.webp",
  map: "/storybook-study/groove-plan-v1.webp",
  mason: "/storybook-study/mason-motion-v1.webp",
  keeper: "/storybook-study/keeper-poses-v1.webp",
  aria: "/storybook-study/aria-earthwork-v1.webp",
  leon: "/storybook-study/leon-route-notes-v1.webp",
  roots: "/storybook-study/foundation-roots-v1.webp",
  ...foundationReturnAssets,
};
const sites = [
  { x: 550, y: 445 },
  { x: 620, y: 530 },
  { x: 690, y: 610 },
  { x: 760, y: 690 },
  { x: 830, y: 770 },
];
const desk = { x: 1130, y: 570 };
type Frame = { battle: RoadBattle; look: RoadLook };
type SourcePoint = { x: number; y: number };

export function foundationObstacles(view: RoadViewport) {
  const layout = foundationLayout(view),
    point = layout.project(desk.x, desk.y);
  return [
    {
      x: (point.x / view.width) * 560,
      lane: layout.world(desk.x, desk.y).lane,
      clearance: {
        x: ((70 * layout.scale) / view.width) * 560,
        lane: (20 * layout.scale) / roadDepth(view.width, view.height),
      },
    },
  ];
}

export function presentBerneFoundation(frame: Frame, input: AdventureInput, view: RoadViewport) {
  const { battle, look } = frame;
  if (
    !look.storybookHeroes ||
    look.quest !== "missing-keystone" ||
    input.backgroundOverride !== foundationAssets.bank
  )
    return;
  look.foundation = {
    node: input.foundationFinalizing
      ? 14
      : (input.squad.run?.node ?? (input.questComplete ? 14 : 0)),
    completed: !!input.foundationFinalizing || (!!input.questComplete && !input.squad.run),
    finalizing: !!input.foundationFinalizing,
  };
  Object.assign(look, {
    background: foundationAssets.bank,
    backgroundShade: 0.04,
    destination: false,
    puller: null,
    frontCarriers: [],
    workers: [],
  });
  Object.assign(battle, { distance: 0, stage: "forest", effects: [] });
  const l = foundationLayout(view);
  battle.heroes = battle.heroes.map((h, i) => ({
    ...h,
    ...l.world(500 + i * 140, 870),
    walking: false,
    facing: 1,
  }));
  if (battle.gathering && look.work) {
    Object.assign(battle.gathering, { ...l.world(690, 610), task: "inspect", kind: "herb" });
    Object.assign(look.work, {
      frame: "housecalls",
      task: "inspect",
      cargo: false,
      asset: foundationAssets.map,
    });
  }
}

/** Renderer-only timing holds each visible survey action until the participants arrive. */
export class RoadFoundationActions {
  private key = "";
  private node = 0;
  private at?: number;
  private lastTime?: number;
  private mason: SourcePoint = { x: 640, y: 465 };
  private masonFacing: 1 | -1 = 1;
  private coldDone = false;
  private done = false;
  private transitionAt?: number;
  private reduced = false;
  obstacle(view: RoadViewport) {
    const layout = foundationLayout(view);
    const point = layout.project(this.mason.x, this.mason.y);
    return {
      x: (point.x / view.width) * 560,
      lane: layout.world(this.mason.x, this.mason.y).lane,
      clearance: {
        x: ((70 * layout.scale) / view.width) * 560,
        lane: (65 * layout.scale) / roadDepth(view.width, view.height),
      },
    };
  }
  prepare(frame: Frame, key: string, view: RoadViewport, reduced = false): Frame {
    const site = frame.look.foundation;
    if (!site) return frame;
    this.reduced = reduced;
    this.updateNode(site, key, frame.battle.time);
    const fade = this.transition(site, frame.battle.time);
    const l = foundationLayout(view),
      point = this.site();
    const battle: RoadBattle = {
      ...frame.battle,
      waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: true },
    };
    if (battle.gathering) {
      const p = l.world(point.x, point.y);
      battle.gathering = { ...battle.gathering, ...p, x: p.x - 65 };
    }
    battle.heroes = battle.heroes.map((h) => ({
      ...h,
      ...l.world(...this.target(h.id)),
      walking: false,
      facing: h.id === "aria" ? 1 : -1,
    }));
    const look = {
      ...frame.look,
      foundation: {
        ...site,
        node: this.node,
        exposed: this.done,
        fade,
        visualComplete: !!site.finalizing && this.done && this.transitionAt === undefined,
      },
      background: this.done ? foundationAssets.open : frame.look.background,
      workers: [] as string[],
    };
    if (look.work)
      look.work = {
        ...look.work,
        label: chapterThreeWork("missing-keystone", this.node)?.name ?? look.work.label,
      };
    return { battle, look };
  }
  private updateNode(site: NonNullable<RoadLook["foundation"]>, key: string, time: number) {
    if (this.key !== key) {
      this.key = key;
      this.node = site.node;
      this.at = undefined;
      this.lastTime = undefined;
      this.coldDone = site.completed && !site.finalizing;
      this.done = this.coldDone;
      this.transitionAt = undefined;
      const pos = this.masonTarget();
      this.mason = { ...pos };
      this.masonFacing = 1;
    }
    if (site.node > this.node && this.at !== undefined && time - this.at >= 1600) {
      this.node++;
      this.at = undefined;
    }
    if (site.completed && !site.finalizing) this.done = true;
  }
  private transition(site: NonNullable<RoadLook["foundation"]>, time: number) {
    if (!site.finalizing || this.coldDone) return 0;
    if (this.transitionAt === undefined && !this.done) {
      if (this.node !== 14 || this.at === undefined || time - this.at < 1600) return 0;
      this.transitionAt = time;
    }
    if (this.transitionAt === undefined) return 0;
    if (this.reduced) {
      this.done = true;
      this.transitionAt = undefined;
      return 0;
    }
    const elapsed = Math.max(0, time - this.transitionAt);
    if (elapsed >= 400 && !this.done) {
      this.done = true;
      this.transitionAt = time - 400;
      return 1;
    }
    if (elapsed >= 800) {
      this.transitionAt = undefined;
      return 0;
    }
    return Math.max(0, 1 - Math.abs(elapsed - 400) / 400);
  }
  private site() {
    return sites[Math.min(4, Math.floor(this.node / 3))];
  }
  private masonTarget(): SourcePoint {
    const p = this.site();
    return { x: p.x + 110, y: p.y + 10 };
  }
  private target(id: Traveller["id"]): [number, number] {
    if (this.done) return foundationReturnTarget(id);
    const p = this.site();
    const common: Partial<Record<Traveller["id"], [number, number]>> = {
      aria: [p.x - 100, p.y + 35],
      leon: [p.x + 100, p.y + 145],
      mira: [990, 820],
      finn: [1160, 760],
    };
    if (this.node % 3 === 1) {
      common.leon = [1040, 650];
      common.finn = [1230, 665];
    }
    return common[id] ?? [1020, 890];
  }
  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
    const scene = battle.waterwayActions;
    if (!look.foundation || !scene) return;
    if (this.done) {
      foundationReturnScene(
        scene,
        view,
        foundationAssets.mason,
        foundationAssets.keeper,
        battle.heroes.some((hero) => hero.id === "leon" && hero.hp > 0),
      );
      return;
    }
    const l = foundationLayout(view),
      phase = this.node % 3;
    this.furniture(scene, view);
    this.roots(scene, view, battle.time);
    const masonArrived = this.moveMason(battle.time);
    this.actors(scene, view, battle.time, masonArrived);
    const participants = phase === 1 ? ["leon", "finn"] : ["aria", "leon"];
    const ready =
      participants.every((id) => {
        const hero = battle.heroes.find((h) => h.id === id);
        return (
          !hero ||
          hero.hp <= 0 ||
          (!hero.walking && waterwayAt(hero, l.world(...this.target(hero.id)), view))
        );
      }) && masonArrived;
    if (ready) this.at ??= battle.time;
    if (!ready) return;
    this.poses(scene, phase, battle.time);
  }
  private furniture(scene: WaterwayActions, view: RoadViewport) {
    const l = foundationLayout(view),
      tabletop = l.world(desk.x, desk.y);
    const table = housecallProp(
      view,
      "foundation-table",
      foundationAssets.table,
      tabletop,
      200,
      l.scale,
    );
    const map = housecallProp(
      view,
      "foundation-map",
      foundationAssets.map,
      l.world(desk.x, desk.y - 72),
      92,
      l.scale,
    );
    map.depth = tabletop.lane + 0.03;
    scene.props.push(table, map);
    foundationReturnGear(scene, view);
  }
  private roots(scene: WaterwayActions, view: RoadViewport, time: number) {
    if (this.coldDone) return;
    const layout = foundationLayout(view);
    for (const [index, site] of sites.entries()) {
      const alpha = this.rootAlpha(index, time);
      if (alpha <= 0) continue;
      const point = layout.world(site.x, site.y);
      const prop = housecallProp(
        view,
        `foundation-root-${String(index)}`,
        foundationAssets.roots,
        point,
        70,
        layout.scale,
      );
      prop.alpha = alpha;
      prop.depth = point.lane - 0.15;
      scene.props.push(prop);
    }
  }
  private rootAlpha(index: number, time: number) {
    const current = Math.floor(this.node / 3);
    if (index < current || (index === current && this.node % 3 > 0)) return 0;
    const age = index === current && this.at !== undefined ? Math.max(0, time - this.at) : 0;
    if (this.reduced) return age >= 1500 ? 0 : 1;
    return 1 - Math.min(1, age / 1500);
  }
  private moveMason(time: number) {
    const target = this.masonTarget(),
      dt = Math.min(0.05, Math.max(0, (time - (this.lastTime ?? time)) / 1000));
    this.lastTime = time;
    if (this.reduced) {
      this.mason = { ...target };
      return true;
    }
    const dx = target.x - this.mason.x,
      dy = target.y - this.mason.y,
      distance = Math.hypot(dx, dy);
    if (distance > 0.01) {
      if (Math.abs(dx) > 0.1) this.masonFacing = dx > 0 ? -1 : 1;
      const step = Math.min(distance, dt * 160);
      this.mason.x += (dx / distance) * step;
      this.mason.y += (dy / distance) * step;
    }
    return distance < 2;
  }
  private actors(scene: WaterwayActions, view: RoadViewport, time: number, arrived: boolean) {
    const l = foundationLayout(view),
      phase = this.node % 3;
    const frame = arrived
      ? phase === 1 || this.done
        ? 0
        : 5 + (this.reduced ? 0 : Math.floor(time / 650) % 3)
      : 1 + (Math.floor(time / 170) % 4);
    scene.actors = [
      {
        id: "foundation-mason",
        point: l.world(this.mason.x, this.mason.y),
        size: l.figureRatio,
        facing: arrived ? 1 : this.masonFacing,
        pose: {
          asset: foundationAssets.mason,
          cell: 128,
          rows: 2,
          frame,
          square: { foot: 120, height: 104 },
        },
      },
      {
        id: "foundation-keeper",
        point: l.world(1300, 505),
        size: l.figureRatio,
        pose: {
          asset: foundationAssets.keeper,
          cell: 128,
          rows: 1,
          frame: 0,
          square: { foot: 120, height: 104 },
        },
      },
    ];
  }
  private poses(scene: WaterwayActions, phase: number, time: number) {
    if (phase !== 1)
      scene.poses.aria = {
        asset: foundationAssets.aria,
        frame: 1 + (this.reduced ? 0 : Math.floor(time / 650) % 3),
      };
    scene.poses.leon = {
      asset: foundationAssets.leon,
      frame: 1 + (this.reduced ? 0 : Math.floor(time / 850) % 3),
    };
  }
}
