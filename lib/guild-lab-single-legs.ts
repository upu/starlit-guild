import type { LabPose } from "./guild-lab-model.ts";
import type { LabCharacterRig } from "./guild-lab-rig.ts";

/** Complete straight/bent paintings swing from the hip; there is no animated knee seam. */
export function labSingleLeg(
  time: number,
  index: number,
  mode: LabPose,
  bob: number,
  reduced: boolean,
  rig: LabCharacterRig,
) {
  if (rig.legStyle !== "single") throw Error("This rig uses jointed legs");
  const cfg = rig.singleLegs[index];
  const idle = {
    rotation: cfg.paintedAngle,
    lift: 0,
    scaleY: (-cfg.y - bob) / (Math.cos(cfg.paintedAngle) * cfg.length),
    bent: false,
  };
  if (reduced || mode !== "walk") return idle;
  const phase = (time / 900 + index / 2) % 1;
  const swing = phase >= 0.5;
  const p = swing ? (1 - Math.cos((phase - 0.5) * Math.PI * 2)) / 2 : phase * 2;
  const degrees = swing
    ? cfg.back + (-cfg.forward - cfg.back) * p
    : -cfg.forward + (cfg.back + cfg.forward) * p;
  const rotation = (degrees * Math.PI) / 180;
  const lift = swing ? -Math.sin((phase - 0.5) * Math.PI * 2) * cfg.lift : 0;
  // Match the existing body bob with a small axial adjustment; never bend the cuff.
  const scaleY = (-cfg.y - bob) / (Math.cos(rotation) * cfg.length);
  return { rotation, lift, scaleY, bent: swing };
}
