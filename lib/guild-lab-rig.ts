import { ariaLabRig } from "./guild-lab-aria-rig.ts";
import { leonLabRig } from "./guild-lab-leon-rig.ts";
export { ariaLabRig };
export type LabLimbConfig = {
  frames: readonly [number, number];
  joint: { x: number; y: number };
  idleJoint?: { x: number; y: number };
  lengths: readonly [number, number];
  front: "upper" | "lower";
  layer: number;
  bend: number;
  // Width perpendicular to the measured bone; bone length and pivots stay fixed.
  thickness?: number | readonly [number, number];
} & (
  | { measured: true }
  | {
      measured?: false;
      // Legs retain their existing overlaps; arms use measured painted joints.
      overlap: readonly [readonly [number, number], readonly [number, number]];
    }
);
export const labLimbPaintOrder = (front: LabLimbConfig["front"]) =>
  front === "upper" ? (["lower", "upper"] as const) : (["upper", "lower"] as const);
export const labRig = leonLabRig;
export const labRigs = { leon: labRig, aria: ariaLabRig } as const;
export type LabCharacterId = keyof typeof labRigs;
export type LabCharacterRig = (typeof labRigs)[LabCharacterId];
