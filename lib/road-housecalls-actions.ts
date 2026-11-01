import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { WaterwayPoint, WaterwayActions } from "./road-waterway-contacts.ts";
import { waterwayAt, waterwayMix } from "./road-waterway-contacts.ts";
import {
  housecallsAssets as assets,
  housecallsLayout,
  housecallDoors,
  housecallWell,
  housecallTable,
} from "./road-housecalls-layout.ts";
import {
  housecallPalm,
  housecallCarryPose,
  housecallProp,
  housecallResidents,
} from "./road-housecalls-contacts.ts";
import { RoadGait } from "./road-gait.ts";
import { chapterTwoWork } from "./chapter-two.ts";

type Frame = { battle: RoadBattle; look: RoadLook };
type Step = "pickup" | "carry" | "handoff" | "done";
type SourcePoint = { x: number; y: number };
type StoredItem = { asset: string; point: SourcePoint; width: number; node: number };
export class RoadHousecallsActions {
  private stored = new Map<string, StoredItem>();
  private key = "";
  private node = 0;
  private step: Step = "pickup";
  private at?: number;
  private doneAt?: number;
  private coldDone = false;
  private gait = new RoadGait();
  prepare(frame: Frame, key: string, view: RoadViewport): Frame {
    const site = frame.look.housecalls;
    if (!site) return frame;
    if (this.key !== key) {
      this.key = key;
      this.node = site.node;
      this.coldDone = site.completed;
      this.stored.clear();
      this.restoreDeliveries();
      this.enter();
      this.gait = new RoadGait();
    }
    if (
      site.node > this.node &&
      this.step === "done" &&
      frame.battle.time - (this.doneAt ?? frame.battle.time) >= 500
    ) {
      this.node++;
      this.enter();
    }
    const layout = housecallsLayout(view),
      phase = this.node % 5;
    const battle: RoadBattle = {
      ...frame.battle,
      waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: true },
    };
    battle.heroes = battle.heroes.map((h) => ({
      ...h,
      ...layout.world(...this.target(h.id)),
      walking: false,
      facing: h.id === "mira" ? 1 : -1,
    }));
    const look = {
      ...frame.look,
      housecalls: { ...site, node: this.node },
      workers: [] as string[],
    };
    if (look.work)
      look.work = {
        ...look.work,
        label: chapterTwoWork("waiting-households", this.node)?.name ?? look.work.label,
      };
    if (phase === 2 || phase === 4) look.workers = ["leon"];
    return { battle, look };
  }
  private enter() {
    this.step = this.coldDone ? "done" : "pickup";
    this.at = undefined;
    this.doneAt = undefined;
  }
  private restoreDeliveries() {
    if (!this.coldDone) return;
    for (let node = 0; node < 15; node++) this.storeDelivered(node);
  }
  private door() {
    return housecallDoors[Math.min(2, Math.floor(this.node / 5))];
  }
  private carrier() {
    return this.node % 5 === 1 ? "aria" : "leon";
  }
  private endpoints(): { from: SourcePoint; to: SourcePoint } {
    const phase = this.node % 5,
      d = this.door();
    if (phase === 1) return { from: housecallWell, to: { x: d.x + 75, y: d.y + 60 } };
    if (phase === 3) return { from: { x: d.x + 75, y: d.y + 60 }, to: { x: 1070, y: 600 } };
    return { from: { x: 945, y: 535 }, to: { x: d.x + 75, y: d.y + 60 } };
  }
  private target(id: Traveller["id"]): [number, number] {
    const phase = this.node % 5;
    if (this.coldDone)
      return [700 + ["aria", "leon", "mira", "finn", "lico"].indexOf(id) * 135, 790];
    if ([0, 1, 3].includes(phase) && id === this.carrier()) {
      const p = this.step === "pickup" ? this.endpoints().from : this.endpoints().to;
      return [p.x, p.y];
    }
    if (id === "mira") return this.miraTarget();
    if (id === "aria") return this.ariaTarget(phase);
    if (id === "leon") return [965, 535];
    return id === "finn" ? [730, 780] : [1100, 780];
  }
  private ariaTarget(phase: number): [number, number] {
    return phase === 0 ? [housecallWell.x, housecallWell.y] : [800, 620];
  }
  private miraTarget(): [number, number] {
    const d = this.door();
    return [d.x + (this.node < 10 ? 170 : -170), d.y + 90];
  }
  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
    const scene = battle.waterwayActions;
    if (!look.housecalls || !scene) return;
    housecallResidents(scene, view, this.node);
    this.ground(scene, view);
    this.paintStored(scene, view);
    if (this.coldDone) return;
    this.sorting(scene, view);
    const phase = this.node % 5,
      id = this.carrier(),
      hero = battle.heroes.find((h) => h.id === id);
    if (!hero) return;
    const layout = housecallsLayout(view),
      target = this.target(id);
    const arrived = !hero.walking && waterwayAt(hero, layout.world(...target), view);
    if (arrived) this.at ??= battle.time;
    const age = Math.max(0, battle.time - (this.at ?? battle.time));
    if (phase === 2 || phase === 4) {
      this.stationary(scene, phase, arrived, age, battle.time);
      return;
    }
    this.carry(battle, scene, hero, view, arrived, age);
  }
  private done(time: number) {
    this.storeDelivered();
    this.step = "done";
    this.doneAt ??= time;
  }
  private storeDelivered(node = this.node) {
    const phase = node % 5,
      d = housecallDoors[Math.floor(node / 5)];
    if (phase === 0)
      this.stored.set(`parcel-${String(node)}`, {
        asset: assets.parcel,
        point: { x: d.x + 20, y: d.y - 35 },
        width: 38,
        node,
      });
    if (phase === 1)
      this.stored.set(`water-${String(node)}`, {
        asset: assets.bucket,
        point: { x: d.x - 45, y: d.y + 10 },
        width: 48,
        node,
      });
    if (phase === 3)
      this.stored.set("returned-bottles", {
        asset: assets.bottles,
        point: { x: 1070, y: 600 },
        width: 48,
        node,
      });
  }
  private paintStored(scene: WaterwayActions, view: RoadViewport) {
    const l = housecallsLayout(view);
    for (const [id, item] of this.stored) {
      if (item.node === this.node) continue;
      scene.props.push(
        housecallProp(view, id, item.asset, l.world(item.point.x, item.point.y), item.width),
      );
    }
    for (const actor of scene.actors ?? []) {
      const index = Number(actor.id.split("-").at(-1));
      if (this.stored.has(`parcel-${String(index * 5)}`)) actor.pose.frame = 3;
    }
  }
  private stationary(
    scene: WaterwayActions,
    phase: number,
    arrived: boolean,
    age: number,
    time: number,
  ) {
    if (!arrived) return;
    scene.poses.leon = {
      asset: phase === 4 ? assets.paper : assets.leonLower,
      frame: phase === 4 ? 0 : 1,
    };
    if (age >= 1600) this.done(time);
  }
  private carry(
    battle: RoadBattle,
    scene: WaterwayActions,
    hero: Traveller,
    view: RoadViewport,
    arrived: boolean,
    age: number,
  ) {
    const layout = housecallsLayout(view);
    const stride = this.gait.frame(hero, {
      ...view,
      stage: battle.stage,
      figureSize: layout.figureSize,
    });
    const pickup = this.step === "pickup";
    if (!hero.walking || !pickup) scene.poses[hero.id] = housecallCarryPose(hero, pickup, stride);
    const palm = housecallPalm(hero, view, stride);
    const point = this.itemPoint(view, palm, arrived, age);
    const phase = this.node % 5;
    const prop = housecallProp(
      view,
      "active-delivery",
      [assets.parcel, assets.bucket, "", assets.bottles][phase],
      point,
      phase === 0 ? 38 : 48,
    );
    if (phase === 1) prop.origin = { x: 0.5, y: 0 };
    scene.props.push(prop);
    this.advanceStep(battle.time, arrived, age);
  }
  private itemPoint(view: RoadViewport, palm: WaterwayPoint, arrived: boolean, age: number) {
    const l = housecallsLayout(view),
      phase = this.node % 5,
      d = this.door();
    const source = this.endpoints().from;
    const ground =
      phase === 0
        ? l.world(housecallTable.x, housecallTable.y)
        : phase === 3
          ? l.world(d.x + 20, d.y - 35)
          : l.world(source.x, source.y);
    if (this.step === "pickup")
      return waterwayMix(ground, palm, arrived ? Math.min(1, age / 700) : 0);
    if (!arrived) return palm;
    const to = this.deliveryPoint(view, phase, d);
    return waterwayMix(palm, to, Math.min(1, age / 900));
  }
  private deliveryPoint(view: RoadViewport, phase: number, d: SourcePoint) {
    const l = housecallsLayout(view);
    if (phase === 3) return l.world(1070, 600);
    if (phase === 1) return l.world(d.x - 45, d.y + 10);
    return l.world(d.x + 20, d.y - 35);
  }
  private advanceStep(time: number, arrived: boolean, age: number) {
    if (!arrived) return;
    if (this.step === "pickup") {
      if (age < 700) return;
      this.step = "carry";
      this.at = undefined;
      return;
    }
    if (age >= 900) this.done(time);
    else this.step = "handoff";
  }
  private sorting(scene: WaterwayActions, view: RoadViewport) {
    if (this.node % 5 !== 2) return;
    const l = housecallsLayout(view);
    scene.props.push(
      housecallProp(view, "sorting-packet", assets.parcel, l.world(925, 445), 38),
      housecallProp(view, "sorting-bottles", assets.bottles, l.world(1000, 470), 48),
    );
  }
  private ground(scene: WaterwayActions, view: RoadViewport) {
    const l = housecallsLayout(view);
    scene.props.push(
      housecallProp(view, "medicine-bag", assets.bag, l.world(1210, 770), 65),
      housecallProp(view, "mira-box", assets.box, l.world(1280, 770), 60),
    );
  }
}
