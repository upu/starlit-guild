import { labRig, type LabCharacterRig } from "./guild-lab-rig.ts";
import {
  labFoot,
  labJoint,
  labLegTarget,
  labPose,
  LAB_ACTOR_SCALE,
  type LabPose,
} from "./guild-lab-model.ts";

export function labSole(time: number, mode: LabPose, index: number, rig: LabCharacterRig = labRig) {
  const leg = rig.legs[index],
    pose = labPose(time, mode, false, 1, 0, rig);
  const target = labLegTarget(time, index / 2, mode, pose.bob, rig);
  const angle = labJoint(target, leg.lengths[0], leg.lengths[1], leg.bend);
  const extension = leg.lengths[1] * rig.soleExtension;
  return {
    x: leg.joint.x + target.x - Math.sin(angle.upper + angle.lower) * extension,
    y: leg.joint.y + pose.bob + target.y + Math.cos(angle.upper + angle.lower) * extension,
  };
}
export function labShadow(time: number, mode: LabPose, rig: LabCharacterRig = labRig) {
  const index = mode === "walk" && time % 900 >= 450 ? 1 : 0;
  const sole = labSole(time, mode, index, rig);
  const foot = mode === "walk" ? labFoot(time, index / 2) : { x: 0 };
  return {
    x: sole.x * LAB_ACTOR_SCALE * 0.35,
    y:
      mode === "tea"
        ? rig.legs[0].lengths[1] * rig.soleExtension * LAB_ACTOR_SCALE
        : sole.y * LAB_ACTOR_SCALE,
    width: 35 + Math.abs(foot.x) * LAB_ACTOR_SCALE * 0.35,
    height: 3.8,
  };
}
