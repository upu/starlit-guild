import type { RoadViewport } from "./road-cart-layout.ts";
import type { WaterwayActions } from "./road-waterway-contacts.ts";
import { waterwayLayout } from "./road-waterway-layout.ts";
import { mossRemovalAssets as assets } from "./road-moss-removal-layout.ts";
import {
  mossHatchClosed,
  mossHatchPark,
  keeperGrabFoot,
  keeperLanternHand,
  keeperWalkHand,
  keeperInspectFoot,
  keeperLid,
  mossLanternPark,
  mossSourceSize,
  type MossSourcePoint,
} from "./road-moss-hatch-layout.ts";
import {
  coverFrame,
  lanternCarried,
  lanternFrame,
  lanternPose,
  lanternWalking,
  type MossHatchPhase,
} from "./road-moss-lantern.ts";

type Task = { index: number; open: boolean };
type Phase = MossHatchPhase;
const mix = (a: MossSourcePoint, b: MossSourcePoint, p: number) => {
  const t = Math.max(0, Math.min(1, p));
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
};
/** Two real covers share one keeper; a carried cover never appears on the ground as well. */
export class RoadMossHatches {
  private lids = [mossHatchClosed(0), mossHatchClosed(1)];
  private open = [false, false];
  private queue: Task[] = [];
  private task?: Task;
  private phase: Phase = "idle";
  private foot = keeperGrabFoot(mossHatchClosed(0));
  private from = mossHatchClosed(0);
  private destination = this.foot;
  private at = 0;
  private previous?: number;
  private travel = 0;
  private moving = false;
  private right = false;
  private first = false;
  private second = false;
  private final = false;
  private tilt = 1;
  private node = 0;
  constructor(node: number) {
    if (node > 2 && node < 9) {
      this.first = true;
      this.open[0] = true;
      this.lids[0] = { ...mossHatchPark };
      this.foot = keeperGrabFoot(mossHatchPark);
    }
    if (node >= 9) {
      this.first = true;
      this.foot = keeperGrabFoot(mossHatchClosed(1));
    }
    if (node > 9) {
      this.second = true;
      this.open[1] = true;
      this.lids[1] = { ...mossHatchPark };
      this.foot = keeperGrabFoot(mossHatchPark);
    }
    if (node > 14) {
      this.open = [false, false];
      this.lids = [mossHatchClosed(0), mossHatchClosed(1)];
      this.first = true;
      this.second = true;
      this.final = true;
      this.foot = keeperGrabFoot(mossHatchClosed(1));
    }
  }
  ready() {
    const index = this.node >= 9 ? 1 : 0;
    return (
      this.open[index] && this.task?.index !== index && !this.queue.some((t) => t.index === index)
    );
  }
  get canMove() {
    return !this.open[0] && this.first;
  }
  get complete() {
    return this.final && !this.open.some(Boolean) && !this.task && this.queue.length === 0;
  }
  get inspecting() {
    return this.phase === "inspect";
  }
  get returningLantern() {
    return ["inspect-rise", "lantern-return", "lantern-place"].includes(this.phase);
  }
  get approachingInspection() {
    return ["lantern-approach", "lantern-pick", "inspect-approach", "inspect-lower"].includes(
      this.phase,
    );
  }
  openHoles() {
    return [0, 1].filter((index) => this.open[index]);
  }
  update(time: number, node: number, reduced: boolean, canClose: boolean) {
    const dt = Math.max(0, Math.min(0.05, (time - (this.previous ?? time)) / 1000));
    this.previous = time;
    this.node = node;
    this.enqueue(node, canClose);
    if (this.phase === "idle") this.next(time);
    this.moving = false;
    if (!this.task) return;
    if (
      ["approach", "lantern-approach", "inspect-approach", "lantern-return", "carry"].includes(
        this.phase,
      )
    )
      this.walk(time, dt, reduced);
    else this.handle(time, reduced);
  }
  private enqueue(node: number, canClose: boolean) {
    if (node >= 2 && !this.first) {
      this.first = true;
      this.queue.push({ index: 0, open: true });
    }
    if (node >= 9 && !this.second) {
      this.second = true;
      if (this.open[0] || this.task?.index === 0) this.queue.push({ index: 0, open: false });
      this.queue.push({ index: 1, open: true });
    }
    if (node >= 14 && canClose && !this.final) {
      this.final = true;
      this.queue.push({ index: 1, open: false });
    }
  }
  private next(time: number) {
    this.task = this.queue.shift();
    if (!this.task) return;
    this.from = { ...this.lids[this.task.index] };
    const last = this.final && this.task.index === 1 && !this.task.open;
    this.destination = keeperGrabFoot(last ? mossHatchPark : this.from);
    this.phase = last ? "lantern-approach" : "approach";
    this.at = time;
  }
  private walk(time: number, dt: number, reduced: boolean) {
    const dx = this.destination.x - this.foot.x,
      dy = this.destination.y - this.foot.y;
    const distance = Math.hypot(dx, dy),
      step = reduced ? distance : Math.min(distance, dt * 240);
    if (distance > 0) {
      this.foot.x += (dx * step) / distance;
      this.foot.y += (dy * step) / distance;
      this.right = dx > 0;
    }
    this.travel += step;
    this.moving = distance - step > 0.01;
    if (this.phase === "carry" && this.task)
      this.lids[this.task.index] = keeperLid(this.foot, this.stride() + 4);
    if (this.moving) return;
    this.at = time;
    const next: Partial<Record<Phase, Phase>> = {
      "lantern-approach": "lantern-pick",
      "inspect-approach": "inspect-lower",
      "lantern-return": "lantern-place",
      approach: "pick",
      carry: "place",
    };
    this.phase = next[this.phase] ?? "idle";
    if (this.task) this.from = { ...this.lids[this.task.index] };
  }
  private handle(time: number, reduced: boolean) {
    const age = reduced ? 1000 : time - this.at;
    if (this.handleLantern(time, age, reduced)) return;
    if (this.phase === "pick") {
      this.pick(time, age);
      return;
    }
    if (this.phase === "place") {
      this.place(time, age);
      return;
    }
    if (this.phase === "release" && age >= 200) {
      this.phase = "idle";
      this.task = undefined;
      this.tilt = 1;
    }
  }
  private handleLantern(time: number, age: number, reduced: boolean) {
    const paths: Partial<Record<Phase, [Phase, MossSourcePoint]>> = {
      "lantern-pick": ["inspect-approach", keeperInspectFoot()],
      "inspect-rise": ["lantern-return", keeperGrabFoot(mossHatchPark)],
      "lantern-place": ["approach", keeperGrabFoot(this.from)],
    };
    if (this.phase === "inspect-lower") {
      if (age >= 800) {
        this.phase = "inspect";
        this.at = time;
      }
      return true;
    }
    if (this.phase === "inspect") {
      if (age >= (reduced ? 1 : 1500)) {
        this.phase = "inspect-rise";
        this.at = time;
      }
      return true;
    }
    const next = paths[this.phase];
    if (!next) return false;
    if (age >= 800) {
      this.phase = next[0];
      this.destination = next[1];
      this.at = time;
    }
    return true;
  }
  private pick(time: number, age: number) {
    const task = this.task;
    if (!task) return;
    if (age < 200) return;
    if (task.open) this.open[task.index] = true;
    this.tilt = 1 - 0.55 * Math.min(1, (age - 200) / 350);
    this.lids[task.index] =
      age < 550
        ? mix(this.from, keeperLid(this.foot, 2), (age - 200) / 350)
        : mix(keeperLid(this.foot, 2), keeperLid(this.foot, 3), (age - 550) / 250);
    if (age < 800) return;
    this.phase = "carry";
    this.destination = keeperGrabFoot(task.open ? mossHatchPark : mossHatchClosed(task.index));
    this.lids[task.index] = keeperLid(this.foot, this.stride() + 4);
    this.at = time;
  }
  private place(time: number, age: number) {
    const task = this.task;
    if (!task) return;
    const target = task.open ? mossHatchPark : mossHatchClosed(task.index);
    this.lids[task.index] =
      age < 250
        ? mix(this.from, keeperLid(this.foot, 2), age / 250)
        : mix(keeperLid(this.foot, 2), target, (age - 250) / 350);
    this.tilt = 0.45 + 0.55 * Math.min(1, Math.max(0, (age - 250) / 350));
    if (age < 600) return;
    this.lids[task.index] = { ...target };
    this.open[task.index] = task.open;
    this.tilt = 1;
    this.phase = "release";
    this.at = time;
  }
  private stride() {
    const phase = Math.floor(this.travel / 28) % 4;
    return (this.phase === "carry" || this.phase === "lantern-return") && this.right
      ? (4 - phase) % 4
      : phase;
  }
  private frame(time: number) {
    if (lanternWalking(this.phase)) return this.stride();
    if (lanternPose(this.phase)) return lanternFrame(this.phase, time - this.at);
    if (this.phase === "carry") return this.stride() + 4;
    return coverFrame(this.phase, time - this.at);
  }
  paint(scene: WaterwayActions, view: RoadViewport, time: number, collected: readonly boolean[]) {
    const layout = waterwayLayout(view.width, view.height),
      manager = layout.world(this.foot.x, this.foot.y);
    scene.actors ??= [];
    const walking = lanternWalking(this.phase);
    const facing = walking && this.right && !lanternCarried(this.phase) ? -1 : 1;
    const frame = this.frame(time);
    scene.actors.push({
      id: "tower-keeper",
      point: manager,
      pose: {
        asset: walking
          ? assets.keeperWalk
          : lanternPose(this.phase)
            ? assets.keeperLantern
            : assets.keeper,
        frame,
        cell: 256,
        rows: walking || lanternPose(this.phase) ? 1 : 2,
      },
      facing,
    });
    this.paintLantern(scene, view, frame, facing, walking);
    for (const index of [0, 1]) this.paintHatch(scene, view, time, index, collected);
  }
  private paintLantern(
    scene: WaterwayActions,
    view: RoadViewport,
    frame: number,
    facing: 1 | -1,
    walking: boolean,
  ) {
    const layout = waterwayLayout(view.width, view.height),
      manager = layout.world(this.foot.x, this.foot.y);
    const carryingLamp = lanternCarried(this.phase);
    const hand = carryingLamp
      ? walking
        ? keeperWalkHand(this.foot, frame, facing)
        : keeperLanternHand(this.foot, frame)
      : mossLanternPark();
    scene.props.push({
      id: "moss-inspection-lantern",
      asset: assets.lantern,
      point: layout.world(hand.x, hand.y),
      size: mossSourceSize(26, view),
      origin: { x: 0.5, y: 0 },
      depth: carryingLamp ? manager.lane + 0.002 : layout.world(hand.x, hand.y).lane,
    });
  }
  private paintHatch(
    scene: WaterwayActions,
    view: RoadViewport,
    time: number,
    index: number,
    collected: readonly boolean[],
  ) {
    const layout = waterwayLayout(view.width, view.height),
      closed = mossHatchClosed(index);
    const rim = layout.world(closed.x, closed.y + 9),
      lid = this.lids[index];
    scene.props.push({
      id: `inspection-rim-${String(index)}`,
      layer: "ground",
      asset: assets.rim,
      point: rim,
      size: mossSourceSize(205, view),
      depth: -0.5,
    });
    const held = this.task?.index === index && ["pick", "carry", "place"].includes(this.phase);
    scene.props.push({
      id: `inspection-lid-${String(index)}`,
      layer: held ? undefined : "ground",
      asset: assets.lid,
      point: layout.world(lid.x, lid.y),
      size: mossSourceSize(170, view),
      verticalScale: held ? this.tilt : 1,
      depth: held ? layout.world(this.foot.x, this.foot.y).lane - 0.001 : -0.4,
    });
    if (!this.open[index]) return;
    const active = this.node >= 9 ? 1 : 0;
    const point = layout.world(closed.x - 9, closed.y - 21);
    scene.props.push({
      id: index === active ? "moss-inside-hatch" : `moss-inside-hatch-${String(index)}`,
      layer: "ground",
      asset: assets.moss,
      point,
      size: mossSourceSize(154, view),
      alpha: (collected[index] ? 0.65 : 1) * (0.93 + 0.04 * Math.sin(time / 900)),
      depth: -0.45,
    });
  }
}
