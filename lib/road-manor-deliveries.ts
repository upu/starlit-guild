import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { WaterwayActions, WaterwayPoint } from "./road-waterway-contacts.ts";
import { waterwayAt, waterwayMix } from "./road-waterway-contacts.ts";
import { housecallsAssets, manorDeliveryLayout } from "./road-housecalls-layout.ts";
import { housecallCarryPose, housecallPalm, housecallProp } from "./road-housecalls-contacts.ts";
import { RoadGait } from "./road-gait.ts";
import { chapterThreeWork } from "./chapter-three.ts";
import { manorGardenAssets, manorGardenScene } from "./road-manor-garden.ts";
import { roadDepth } from "./road-layout.ts";

export const manorDeliveryAssets = {
  ...housecallsAssets,
  bank: "/storybook-study/manor-kitchen-v1.png",
  cook: "/storybook-study/cook-motion-v2.webp",
  pot: "/storybook-study/garden-pot-v1.webp",
  parcel: "/storybook-study/lunch-cake-parcel-v1.webp",
  ...manorGardenAssets,
};
type Frame = { battle: RoadBattle; look: RoadLook };
type Point = { x: number; y: number };
type Step = "pickup" | "carry" | "done";
const parcelSpot = (round: number): Point => ({
  x: 740 + (round % 3) * 75,
  y: 515 + Math.floor(round / 3) * 65,
});

/** Keep the cook's feet clear while the party carries packages to the door. */
export function manorDeliveryObstacles(view: RoadViewport) {
  const l = manorDeliveryLayout(view),
    point = l.project(1030, 445);
  return [
    {
      x: (point.x / view.width) * 560,
      lane: l.world(1030, 445).lane,
      clearance: {
        x: ((48 * l.scale) / view.width) * 560,
        lane: (42 * l.scale) / roadDepth(view.width, view.height),
      },
    },
  ];
}

export function presentManorDeliveries(frame: Frame, input: AdventureInput, view: RoadViewport) {
  const { battle, look } = frame;
  if (
    !look.storybookHeroes ||
    look.quest !== "riverside-manor" ||
    input.backgroundOverride !== manorDeliveryAssets.bank
  )
    return;
  look.manorDelivery = {
    node: input.squad.run?.node ?? (input.questComplete ? 14 : 0),
    completed: !!input.questComplete && !input.squad.run,
  };
  Object.assign(look, {
    background: manorDeliveryAssets.bank,
    backgroundShade: 0.04,
    destination: false,
    puller: null,
    frontCarriers: [],
    workers: [],
  });
  Object.assign(battle, { distance: 0, stage: "forest", effects: [] });
  const l = manorDeliveryLayout(view);
  battle.heroes = battle.heroes.map((h, i) => ({
    ...h,
    ...l.world(600 + i * 135, 810),
    walking: false,
    facing: 1,
  }));
  if (battle.gathering && look.work) {
    Object.assign(battle.gathering, { ...l.world(800, 650), task: "inspect", kind: "herb" });
    Object.assign(look.work, {
      frame: "housecalls",
      task: "inspect",
      cargo: false,
      asset: manorDeliveryAssets.parcel,
    });
  }
}

/** Visual work follows the real nodes while keeping delivered objects in the courtyard. */
export class RoadManorDeliveries {
  private key = "";
  private node = 0;
  private step: Step = "pickup";
  private at?: number;
  private doneAt?: number;
  private coldDone = false;
  private reduced = false;
  private transitionAt?: number;
  private garden = false;
  private gait = new RoadGait();

  prepare(frame: Frame, key: string, view: RoadViewport, reduced = false): Frame {
    const site = frame.look.manorDelivery;
    if (!site) return frame;
    this.reduced = reduced;
    if (this.key !== key) {
      this.key = key;
      this.node = site.node;
      this.coldDone = site.completed;
      this.step = this.coldDone ? "done" : "pickup";
      this.at = undefined;
      this.doneAt = undefined;
      this.transitionAt = undefined;
      this.garden = this.coldDone;
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
    const fade = this.transition(frame.battle.time);
    const l = manorDeliveryLayout(view);
    const battle: RoadBattle = {
      ...frame.battle,
      waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: true },
    };
    if (battle.gathering) {
      const p = l.world(...this.target(this.carrier()));
      battle.gathering = { ...battle.gathering, ...p, x: p.x - 65 };
    }
    battle.heroes = battle.heroes.map((h) => ({
      ...h,
      ...l.world(...this.target(h.id)),
      walking: false,
      facing: h.id === this.carrier() && this.step === "carry" && this.node % 3 === 0 ? 1 : -1,
    }));
    const look = {
      ...frame.look,
      manorDelivery: { ...site, node: this.node, garden: this.garden, fade },
      background: this.garden ? manorDeliveryAssets.garden : manorDeliveryAssets.bank,
      workers: [] as string[],
    };
    if (look.work)
      look.work = {
        ...look.work,
        label: chapterThreeWork("riverside-manor", this.node)?.name ?? look.work.label,
      };
    return { battle, look };
  }
  private transition(time: number) {
    if (this.node !== 14 || this.coldDone) return 0;
    this.transitionAt ??= time;
    if (this.reduced) {
      this.garden = true;
      return 0;
    }
    const elapsed = Math.max(0, time - this.transitionAt);
    this.garden = elapsed >= 400;
    return Math.max(0, 1 - Math.abs(elapsed - 400) / 400);
  }
  private carrier(): Traveller["id"] {
    return this.node % 3 === 1 ? "aria" : "leon";
  }
  private endpoints(): { from: Point; to: Point } {
    const round = Math.floor(this.node / 3);
    return this.node % 3 === 0
      ? { from: { x: 520, y: 770 }, to: parcelSpot(round) }
      : { from: { x: 410, y: 680 }, to: { x: 330 + round * 65, y: 495 } };
  }
  private target(id: Traveller["id"]): [number, number] {
    if (this.garden) {
      const spots: Partial<Record<Traveller["id"], [number, number]>> = {
        aria: [547, 685],
        leon: [690, 670],
        mira: [436, 545],
        finn: [1155, 700],
      };
      return spots[id] ?? [1120, 900];
    }
    if (this.coldDone)
      return [600 + ["aria", "leon", "mira", "finn", "lico"].indexOf(id) * 135, 810];
    if (id === this.carrier() && this.node % 3 !== 2) {
      const p = this.step === "pickup" ? this.endpoints().from : this.endpoints().to;
      return [p.x, p.y];
    }
    const targets: Partial<Record<Traveller["id"], [number, number]>> = {
      aria: [620, 720],
      leon: this.node % 3 === 2 ? [875, 650] : [760, 730],
      mira: [650, 865],
      finn: [930, 800],
    };
    return targets[id] ?? [1100, 800];
  }
  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
    const scene = battle.waterwayActions;
    if (!look.manorDelivery || !scene) return;
    if (this.garden) {
      manorGardenScene(scene, view);
      if (this.step !== "done" && battle.time - (this.transitionAt ?? battle.time) >= 1800)
        this.done(battle.time);
      return;
    }
    this.cook(scene, view);
    this.delivered(scene, view);
    if (this.coldDone || this.step === "done") return;
    const hero = battle.heroes.find((h) => h.id === this.carrier());
    if (!hero) return;
    const l = manorDeliveryLayout(view);
    const arrived = !hero.walking && waterwayAt(hero, l.world(...this.target(hero.id)), view);
    if (arrived) this.at ??= battle.time;
    const age = Math.max(0, battle.time - (this.at ?? battle.time));
    if (this.node % 3 === 2) {
      this.inspect(scene, arrived, age, battle.time);
      return;
    }
    this.carry(battle, scene, hero, view, arrived, age);
  }
  private inspect(scene: WaterwayActions, arrived: boolean, age: number, time: number) {
    if (!arrived) return;
    scene.poses.leon = { asset: manorDeliveryAssets.paper, frame: 0 };
    if (age >= 1300) this.done(time);
  }
  private cook(scene: WaterwayActions, view: RoadViewport) {
    const l = manorDeliveryLayout(view);
    scene.actors = [
      {
        id: "manor-cook",
        point: l.world(1030, 445),
        size: l.figureRatio,
        pose: {
          asset: manorDeliveryAssets.cook,
          cell: 128,
          rows: 2,
          frame: this.node % 3 === 0 && this.step === "done" ? 3 : 0,
          square: { foot: 120, height: 94 },
        },
      },
    ];
  }
  private carry(
    battle: RoadBattle,
    scene: WaterwayActions,
    hero: Traveller,
    view: RoadViewport,
    arrived: boolean,
    age: number,
  ) {
    const l = manorDeliveryLayout(view);
    const stride = this.gait.frame(hero, {
      ...view,
      stage: battle.stage,
      figureSize: l.figureSize,
    });
    const pickup = this.step === "pickup";
    this.carryPose(scene, hero, pickup, stride);
    const palm = housecallPalm(hero, view, stride, l.figureSize);
    const ends = this.endpoints();
    const pot = this.node % 3 === 1;
    // Both objects are held at their middle. Offset their ground anchor by
    // half the image height so the visible base stays fixed when released.
    const ground = (p: Point): WaterwayPoint => l.world(p.x, p.y - 30 - (pot ? 27.5 : 32.5));
    const point = this.carriedPoint(
      pickup,
      arrived,
      this.reduced && arrived ? 700 : age,
      palm,
      ground(ends.from),
      ground(ends.to),
    );
    const prop = housecallProp(
      view,
      "manor-active",
      this.node % 3 === 0 ? manorDeliveryAssets.parcel : manorDeliveryAssets.pot,
      point,
      this.node % 3 === 0 ? 65 : 55,
      l.scale,
    );
    prop.origin = { x: 0.5, y: 0.5 };
    prop.depth = Math.max(prop.depth, hero.lane + 0.03);
    scene.props.push(prop);
    this.advanceCarry(battle.time, pickup, arrived, age);
  }
  private carryPose(scene: WaterwayActions, hero: Traveller, pickup: boolean, stride: number) {
    if (hero.walking && pickup) return;
    if (hero.id === "aria" && !pickup) {
      scene.poses.aria = {
        asset: manorDeliveryAssets.ariaCarry,
        frame: hero.walking && !this.reduced ? 4 + stride : 0,
        rows: 2,
      };
      return;
    }
    scene.poses[hero.id] = housecallCarryPose(hero, pickup, stride);
  }
  private advanceCarry(time: number, pickup: boolean, arrived: boolean, age: number) {
    if (!arrived || age < 700) return;
    if (!pickup) {
      this.done(time);
      return;
    }
    this.step = "carry";
    this.at = undefined;
  }
  private carriedPoint(
    pickup: boolean,
    arrived: boolean,
    age: number,
    palm: WaterwayPoint,
    from: WaterwayPoint,
    to: WaterwayPoint,
  ) {
    if (pickup) return waterwayMix(from, palm, arrived ? age / 700 : 0);
    return arrived ? waterwayMix(palm, to, age / 700) : palm;
  }
  private done(time: number) {
    this.step = "done";
    this.doneAt ??= time;
  }
  private delivered(scene: WaterwayActions, view: RoadViewport) {
    const l = manorDeliveryLayout(view);
    const limit = this.coldDone ? 15 : this.node + (this.step === "done" ? 1 : 0);
    for (let node = 0; node < limit; node++) {
      if (node % 3 === 2) continue;
      scene.props.push(this.placed(node, view, l));
    }
  }
  private placed(node: number, view: RoadViewport, l: ReturnType<typeof manorDeliveryLayout>) {
    const round = Math.floor(node / 3),
      parcel = node % 3 === 0;
    const spot = parcelSpot(round);
    const p = parcel ? { x: spot.x, y: spot.y - 62.5 } : { x: 330 + round * 65, y: 437.5 };
    const placed = housecallProp(
      view,
      `manor-delivered-${String(node)}`,
      parcel ? manorDeliveryAssets.parcel : manorDeliveryAssets.pot,
      l.world(p.x, p.y),
      parcel ? 65 : 55,
      l.scale,
    );
    placed.origin = { x: 0.5, y: 0.5 };
    return placed;
  }
}
