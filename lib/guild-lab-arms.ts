import { labRig, type LabCharacterRig } from "./guild-lab-rig.ts";
import { labJoint, type LabPose, type Point } from "./guild-lab-model.ts";
import { labLimbArtwork } from "./guild-lab-limbs.ts";

export const labArmArtwork = labLimbArtwork;
function targetArm(target: Point, index: number, rig: LabCharacterRig) {
  const arm = rig.arms[index];
  const angles = { ...labJoint(target, ...arm.lengths, arm.bend), scale: 1 };
  if (angles.lower <= 0 && angles.lower >= (-arm.elbowLimit * Math.PI) / 180) return angles;
  const beta = Math.min(Math.acos(Math.cos(angles.lower)), (arm.elbowLimit * Math.PI) / 180);
  const [upper, lower] = arm.lengths;
  const distance = Math.hypot(upper + lower * Math.cos(beta), lower * Math.sin(beta));
  return {
    upper:
      Math.atan2(-target.x, target.y) +
      Math.atan2(lower * Math.sin(beta), upper + lower * Math.cos(beta)),
    lower: -beta,
    scale: Math.min(1, Math.hypot(target.x, target.y) / distance),
  };
}
export type LabArmAngles = { upper: number; lower: number; scale: number };
export function labStretchArm(
  base: LabArmAngles,
  index: number,
  amount: number,
  rig: LabCharacterRig = labRig,
): LabArmAngles {
  const config = rig.arms[index].stretchAngles,
    t = Math.max(0, Math.min(1, amount));
  return {
    upper: base.upper + ((-config.shoulder * Math.PI) / 180 - base.upper) * t,
    lower: base.lower + ((-config.elbow * Math.PI) / 180 - base.lower) * t,
    scale: base.scale + (1 - base.scale) * t,
  };
}
export function labIdleArm(index: number, rig: LabCharacterRig = labRig): LabArmAngles {
  const config = rig.arms[index].idleAngles;
  return {
    upper: (-config.shoulder * Math.PI) / 180,
    lower: (-config.elbow * Math.PI) / 180,
    scale: config.scale,
  };
}
export function labWalkingArm(
  time: number,
  index: number,
  reduced = false,
  rig: LabCharacterRig = labRig,
): LabArmAngles {
  const arm = rig.arms[index];
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
  private rig: LabCharacterRig;
  constructor(rig: LabCharacterRig = labRig) {
    this.rig = rig;
  }
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
    stretch = 0,
  ) {
    const direct = (mode === "walk" || mode === "idle") && !reaction;
    let angles = direct
      ? mode === "idle"
        ? labIdleArm(index, this.rig)
        : labWalkingArm(time, index, reduced, this.rig)
      : targetArm(target, index, this.rig);
    if (this.previous === "walk" && mode === "idle" && !reduced) {
      this.from = this.last;
      this.settledAt = time;
    }
    if (mode === "idle" && !reaction && !reduced && this.from)
      angles = this.settle(time, angles, this.from);
    if (stretch > 0 && !reduced)
      angles = labStretchArm(labIdleArm(index, this.rig), index, stretch, this.rig);
    this.previous = mode;
    this.last = angles;
    return angles;
  }
  private settle(time: number, target: LabArmAngles, from: LabArmAngles) {
    const p = Math.max(0, Math.min(1, (time - this.settledAt) / this.rig.armSettleMs));
    const t = p * p * (3 - 2 * p);
    return {
      upper: from.upper + (target.upper - from.upper) * t,
      lower: from.lower + (target.lower - from.lower) * t,
      scale: from.scale + (target.scale - from.scale) * t,
    };
  }
}
