import { guildLabArt } from "./guild-lab-art.ts";
import { labRig } from "./guild-lab-rig.ts";
import { labJoint, type LabPose, type Point } from "./guild-lab-model.ts";

export function labArmArtwork(frame: number, length: number) {
  const joints = guildLabArt.armJoints[frame as 4 | 5 | 6 | 7];
  const [px, py] = joints.proximal,
    [dx, dy] = joints.distal;
  const [, , width, height] = guildLabArt.frames[frame];
  const scale = length / Math.hypot(dx - px, dy - py);
  return {
    originX: px / width,
    originY: py / height,
    height: height * scale,
    scale,
    rotation: Math.atan2(dx - px, dy - py),
  };
}
export type LabArmAngles = { upper: number; lower: number; scale: number };
export function labWalkingArm(time: number, index: number, reduced = false): LabArmAngles {
  const arm = labRig.arms[index];
  // Near arm follows the far leg (offset 0); positive angles here mean forward.
  const front = (1 + Math.cos((time / 900 + (index ? 0 : 0.5)) * Math.PI * 2)) / 2;
  const shoulder = reduced
    ? 0
    : arm.walkShoulder.back + front * (arm.walkShoulder.forward - arm.walkShoulder.back);
  const elbow = reduced
    ? arm.walkElbow.back
    : arm.walkElbow.back + front * (arm.walkElbow.forward - arm.walkElbow.back);
  // Phaser's downward bone rotates toward screen-right at negative angles.
  return {
    upper: (-shoulder * Math.PI) / 180,
    lower: (-elbow * Math.PI) / 180,
    scale: arm.walkScale,
  };
}

// Scene-owned interpolation only on walk -> idle. Tea/work and reactions keep IK.
export class LabArmMotion {
  private previous: LabPose = "tea";
  private last: LabArmAngles | null = null;
  private from: LabArmAngles | null = null;
  private settledAt = -Infinity;
  sample(
    time: number,
    mode: LabPose,
    index: number,
    target: Point,
    reaction: boolean,
    reduced: boolean,
  ) {
    const arm = labRig.arms[index];
    const direct = (mode === "walk" && !reaction) || (reduced && mode === "idle");
    let angles = direct
      ? labWalkingArm(time, index, reduced)
      : { ...labJoint(target, ...arm.lengths, arm.bend), scale: 1 };
    if (this.previous === "walk" && mode === "idle" && !reduced) {
      this.from = this.last;
      this.settledAt = time;
    }
    if (mode === "idle" && !reaction && !reduced && this.from)
      angles = this.settle(time, angles, this.from);
    this.previous = mode;
    this.last = angles;
    return angles;
  }
  private settle(time: number, target: LabArmAngles, from: LabArmAngles) {
    const p = Math.max(0, Math.min(1, (time - this.settledAt) / labRig.armSettleMs));
    const t = p * p * (3 - 2 * p);
    return {
      upper: from.upper + (target.upper - from.upper) * t,
      lower: from.lower + (target.lower - from.lower) * t,
      scale: from.scale + (target.scale - from.scale) * t,
    };
  }
}
