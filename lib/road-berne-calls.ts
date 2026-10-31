import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { WaterwayActions, WaterwayPoint } from "./road-waterway-contacts.ts";
import { waterwayAt, waterwayMix } from "./road-waterway-contacts.ts";
import { housecallsAssets, housecallsLayout } from "./road-housecalls-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";
import { roadDepth, roadScale } from "./road-layout.ts";
import { RoadGait } from "./road-gait.ts";
import { chapterThreeWork } from "./chapter-three.ts";

export const berneCallsAssets = {
  ...housecallsAssets,
  bank: "/storybook-study/berne-calls-street-v1.png",
  finn: "/storybook-study/finn-handheld-balanced-v2.webp",
};
const doors = [
  { x: 235, y: 365 },
  { x: 780, y: 294 },
  { x: 1285, y: 365 },
];
const visitOrder = [1, 2, 1, 2, 1];
const well = { x: 350, y: 690 },
  table = { x: 1020, y: 430 },
  patch = { x: 875, y: 635 };
type Frame = { battle: RoadBattle; look: RoadLook };
type Point = { x: number; y: number };
type Step = "pickup" | "carry" | "done";

export function berneCallsObstacles(view: RoadViewport) {
  const l = housecallsLayout(view);
  return [
    { x: 1040, y: 455, width: 110, depth: 30 },
    { x: 210, y: 615, width: 100, depth: 55 },
  ].map((base) => ({
    x: (l.project(base.x, base.y).x / view.width) * 560,
    lane: l.world(base.x, base.y).lane,
    clearance: {
      x: ((base.width * l.scale) / view.width) * 560,
      lane: (base.depth * l.scale) / roadDepth(view.width, view.height),
    },
  }));
}

export function presentBerneCalls(frame: Frame, input: AdventureInput, view: RoadViewport) {
  const { battle, look } = frame;
  if (
    !look.storybookHeroes ||
    look.quest !== "berne-house-calls" ||
    input.backgroundOverride !== berneCallsAssets.bank
  )
    return;
  look.berneCalls = {
    node: input.squad.run?.node ?? (input.questComplete ? 14 : 0),
    completed: !!input.questComplete && !input.squad.run,
  };
  Object.assign(look, {
    background: berneCallsAssets.bank,
    backgroundShade: 0.04,
    destination: false,
    puller: null,
    frontCarriers: [],
    workers: [],
  });
  Object.assign(battle, { distance: 0, stage: "forest", effects: [] });
  const layout = housecallsLayout(view);
  battle.heroes = battle.heroes.map((hero, i) => ({
    ...hero,
    ...layout.world(500 + i * 140, 830),
    walking: false,
    facing: 1,
  }));
  if (battle.gathering && look.work) {
    Object.assign(battle.gathering, { ...layout.world(875, 650), task: "inspect", kind: "herb" });
    Object.assign(look.work, {
      frame: "housecalls",
      task: "inspect",
      cargo: false,
      asset: berneCallsAssets.parcel,
    });
  }
}

/** A visual queue follows all fifteen real work nodes without changing the game clock. */
export class RoadBerneCallsActions {
  private key = "";
  private node = 0;
  private step: Step = "pickup";
  private at?: number;
  private doneAt?: number;
  private coldDone = false;
  private gait = new RoadGait();

  prepare(frame: Frame, key: string, view: RoadViewport): Frame {
    const site = frame.look.berneCalls;
    if (!site) return frame;
    if (this.key !== key) {
      this.key = key;
      this.node = site.node;
      this.coldDone = site.completed;
      this.step = this.coldDone ? "done" : "pickup";
      this.at = undefined;
      this.doneAt = undefined;
      this.gait = new RoadGait();
    }
    if (
      site.node > this.node &&
      this.step === "done" &&
      frame.battle.time - (this.doneAt ?? frame.battle.time) >= 400
    ) {
      this.node++;
      this.step = "pickup";
      this.at = undefined;
      this.doneAt = undefined;
    }
    const layout = housecallsLayout(view);
    const battle: RoadBattle = {
      ...frame.battle,
      waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: true },
    };
    if (battle.gathering) {
      const point =
        this.node % 3 === 2 ? ([patch.x, patch.y] as [number, number]) : this.target("finn");
      const location = layout.world(...point);
      battle.gathering = { ...battle.gathering, ...location, x: location.x - 65 };
    }
    battle.heroes = battle.heroes.map((hero) => ({
      ...hero,
      ...layout.world(...this.target(hero.id)),
      walking: false,
      facing: this.facing(hero.id),
    }));
    const look = {
      ...frame.look,
      berneCalls: { ...site, node: this.node },
      workers: [] as string[],
    };
    if (look.work)
      look.work = {
        ...look.work,
        label: chapterThreeWork("berne-house-calls", this.node)?.name ?? look.work.label,
      };
    return { battle, look };
  }
  private door() {
    return doors[visitOrder[Math.min(4, Math.floor(this.node / 3))]];
  }
  private endpoints(): { from: Point; to: Point } {
    const d = this.door();
    return {
      from: this.node % 3 === 0 ? { x: table.x - 100, y: table.y + 60 } : well,
      to: { x: d.x + 85, y: d.y + 65 },
    };
  }
  private facing(id: Traveller["id"]): 1 | -1 {
    if (id === "mira") return 1;
    return id === "finn" && this.step === "pickup" && this.node % 3 === 0 ? 1 : -1;
  }
  private target(id: Traveller["id"]): [number, number] {
    const d = this.door(),
      phase = this.node % 3;
    if (this.coldDone)
      return [490 + ["aria", "leon", "mira", "finn", "lico"].indexOf(id) * 140, 830];
    if (id === "finn" && phase !== 2) {
      const p = this.step === "pickup" ? this.endpoints().from : this.endpoints().to;
      return [p.x, p.y];
    }
    if (id === "mira") return [d.x - 80, d.y + 80];
    const targets: Partial<Record<Traveller["id"], [number, number]>> =
      phase === 2
        ? { aria: [patch.x - 90, patch.y + 45], leon: [patch.x + 100, patch.y + 55] }
        : {};
    return (
      targets[id] ??
      (
        { aria: [540, 790], leon: [680, 820] } as Partial<Record<Traveller["id"], [number, number]>>
      )[id] ?? [570, 680]
    );
  }
  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
    const scene = battle.waterwayActions;
    if (!look.berneCalls || !scene) return;
    this.resident(scene, view);
    if (this.coldDone || (look.berneCalls.completed && this.step === "done")) return;
    const phase = this.node % 3,
      id = phase === 2 ? "aria" : "finn";
    const hero = battle.heroes.find((h) => h.id === id);
    if (!hero) return;
    const layout = housecallsLayout(view),
      target = this.target(id);
    const arrived = !hero.walking && waterwayAt(hero, layout.world(...target), view);
    if (arrived) this.at ??= battle.time;
    const age = Math.max(0, battle.time - (this.at ?? battle.time));
    if (phase === 2) {
      this.inspect(scene, battle, arrived, age);
      return;
    }
    this.carry(battle, scene, hero, view, arrived, age);
  }
  private inspect(scene: WaterwayActions, battle: RoadBattle, arrived: boolean, age: number) {
    if (!arrived) return;
    scene.poses.aria = { asset: housecallsAssets.ariaLower, frame: 1 };
    const leon = battle.heroes.find((hero) => hero.id === "leon");
    if (leon && !leon.walking) scene.poses.leon = { asset: housecallsAssets.paper, frame: 0 };
    if (age >= 1500) this.done(battle.time);
  }
  private resident(scene: WaterwayActions, view: RoadViewport) {
    const l = housecallsLayout(view),
      active = visitOrder[Math.min(4, Math.floor(this.node / 3))];
    scene.actors = [1, 2].map((index) => {
      const d = doors[index];
      return {
        id: `berne-resident-${String(index)}`,
        point: l.world(d.x, d.y + 15),
        size: l.figureRatio,
        pose: {
          asset: index === 1 ? housecallsAssets.parent : housecallsAssets.cook,
          cell: 128,
          rows: 2,
          frame: index === active ? (this.step === "done" ? 3 : 1) : 0,
          square: { foot: 120, height: 104 },
        },
      };
    });
  }
  private carry(
    battle: RoadBattle,
    scene: WaterwayActions,
    hero: Traveller,
    view: RoadViewport,
    arrived: boolean,
    age: number,
  ) {
    const l = housecallsLayout(view),
      stride = this.gait.frame(hero, { ...view, stage: battle.stage, figureSize: l.figureSize });
    const pickup = this.step === "pickup",
      phase = this.node % 3;
    const low = pickup && phase === 1;
    if (!hero.walking || !pickup)
      scene.poses.finn = {
        asset: berneCallsAssets.finn,
        frame: this.carryFrame(hero, pickup, low, stride),
        rows: 2,
      };
    const palm = this.palm(hero, view, low);
    const point = this.itemPoint(view, palm, pickup, arrived, age);
    const prop = housecallProp(
      view,
      "berne-delivery",
      phase === 0 ? berneCallsAssets.parcel : berneCallsAssets.bucket,
      point,
      phase === 0 ? 38 : 48,
    );
    // The carried object is in front of the carrier's hands, even though its
    // projected screen position is above his feet.
    prop.depth = Math.max(prop.depth, hero.lane + 0.03);
    if (phase === 1) prop.origin = { x: 0.5, y: 0 };
    scene.props.push(prop);
    this.advance(battle.time, pickup, arrived, age);
  }
  private carryFrame(hero: Traveller, pickup: boolean, low: boolean, stride: number) {
    if (pickup) return low ? 1 : 0;
    return hero.walking ? stride + 4 : 0;
  }
  private itemPoint(
    view: RoadViewport,
    palm: WaterwayPoint,
    pickup: boolean,
    arrived: boolean,
    age: number,
  ) {
    const l = housecallsLayout(view),
      ends = this.endpoints();
    const source =
      this.node % 3 === 0
        ? l.world(table.x - 80, table.y)
        : l.world(ends.from.x - 25, ends.from.y - 78);
    if (pickup) return waterwayMix(source, palm, arrived ? age / 700 : 0);
    if (!arrived) return palm;
    const bucketOffset = this.node % 3 === 1 ? 48 : 0;
    return waterwayMix(palm, l.world(ends.to.x - 55, ends.to.y - 25 - bucketOffset), age / 900);
  }
  private advance(time: number, pickup: boolean, arrived: boolean, age: number) {
    if (!arrived) return;
    if (pickup && age >= 700) {
      this.step = "carry";
      this.at = undefined;
    } else if (!pickup && age >= 900) this.done(time);
  }
  private palm(hero: Traveller, view: RoadViewport, low: boolean): WaterwayPoint {
    const coords = low ? [132, 169] : [116, 120];
    const size = (housecallsLayout(view).figureSize * 0.9) / 144;
    return {
      x: hero.x + ((coords[0] - 96) * size * hero.facing) / roadScale(view.width),
      lane: hero.lane + ((coords[1] - 176) * size) / roadDepth(view.width, view.height),
    };
  }
  private done(time: number) {
    this.step = "done";
    this.doneAt ??= time;
  }
}
