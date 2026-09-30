import { labLegTarget, type LabPose, type Point } from "./guild-lab-model.ts";
import type { LabCharacterRig } from "./guild-lab-rig.ts";

// A tiny lifted step settles the last stride into a relaxed split stance.
export class LabFeetMotion {
  private previous: LabPose = "tea";
  private last: Point[] | null = null;
  private from: Point[] | null = null;
  private started = -Infinity;
  constructor(privateRig: LabCharacterRig) {
    this.rig = privateRig;
  }
  private rig: LabCharacterRig;
  sample(time: number, mode: LabPose, bob: number, reduced: boolean) {
    if (this.previous === "walk" && mode === "idle") {
      this.started = time;
      this.from = this.last;
    }
    const p = reduced ? 1 : Math.min(1, Math.max(0, (time - this.started) / this.rig.idleSettleMs));
    const targets = this.rig.legs.map((_, i) => {
      const target = labLegTarget(reduced ? 0 : time, i / 2, mode, bob, this.rig);
      if (mode !== "idle" || !this.from || p >= 1) return target;
      const from = this.from[i],
        t = p * p * (3 - 2 * p);
      return {
        x: from.x + (target.x - from.x) * t,
        y: from.y + (target.y - from.y) * t - Math.sin(p * Math.PI) * 3,
      };
    });
    this.previous = mode;
    this.last = targets;
    return targets;
  }
}
