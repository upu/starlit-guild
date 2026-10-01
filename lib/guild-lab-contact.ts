import { labRig, type LabCharacterRig } from "./guild-lab-rig.ts";
import { labSingleLeg } from "./guild-lab-single-legs.ts";
import { labAnkle } from "./guild-lab-ankles.ts";
import {
  labFoot,
  labLegTarget,
  labPose,
  LAB_ACTOR_SCALE,
  type LabPose,
} from "./guild-lab-model.ts";

export function labSole(time: number, mode: LabPose, index: number, rig: LabCharacterRig = labRig) {
  const leg = rig.legs[index],
    pose = labPose(time, mode, false, 1, 0, rig);
  if (rig.legStyle === "single" && mode !== "tea") {
    const cfg = rig.singleLegs[index],
      single = labSingleLeg(time, index, mode, pose.bob, false, rig),
      length = cfg.length;
    return {
      x: cfg.x - Math.sin(single.rotation) * length * single.scaleY,
      y:
        cfg.y +
        pose.bob +
        single.lift +
        Math.cos(single.rotation) * length * single.scaleY +
        rig.feet[index].sole * Math.cos(labAnkle(time, index, mode).angle),
    };
  }
  const target = labLegTarget(time, index / 2, mode, pose.bob, rig);
  const extension = rig.feet[index].sole;
  return {
    x: leg.joint.x + target.x - Math.sin(labAnkle(time, index, mode).angle) * extension,
    y: leg.joint.y + pose.bob + target.y + Math.cos(labAnkle(time, index, mode).angle) * extension,
  };
}
export function labShadow(time: number, mode: LabPose, rig: LabCharacterRig = labRig) {
  const index = mode === "walk" && time % 900 >= 450 ? 1 : 0;
  const sole = labSole(time, mode, index, rig);
  const foot = mode === "walk" ? labFoot(time, index / 2, rig) : { x: 0 };
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
