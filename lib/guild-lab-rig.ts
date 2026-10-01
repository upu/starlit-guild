import { guildLabArt } from "./guild-lab-art.ts";
import { ariaLabRig } from "./guild-lab-aria-rig.ts";
export { ariaLabRig } from "./guild-lab-aria-rig.ts";
import { labArtHeight, labArtOrigin } from "./guild-lab-art-layout.ts";

// Leon's attachment points and painted overlaps, in unscaled body coordinates.
export type LabLimbConfig = {
  frames: readonly [number, number];
  joint: { x: number; y: number };
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
type LabArmConfig = LabLimbConfig & {
  restHand: { x: number; y: number };
  walkSwing: number;
  walkShoulder: { forward: number; back: number };
  walkElbow: { forward: number; back: number };
  walkScale: number;
  idleAngles: { shoulder: number; elbow: number; scale: number };
};
const leg = {
  lengths: [22, 27],
  measured: true,
  front: "upper",
  bend: -1,
} as const;
const arm = {
  lengths: [23, 25],
  front: "lower",
  measured: true,
  bend: 1,
} as const;
export const labLimbPaintOrder = (front: LabLimbConfig["front"]) =>
  front === "upper" ? (["lower", "upper"] as const) : (["upper", "lower"] as const);

const torso = {
  frame: 2,
  x: 0,
  y: -67,
  height: labArtHeight(guildLabArt, 2, 51),
  layer: 5,
} as const;
const headHeight = guildLabArt.head.displayHeight;
const [headWidth, headFrameHeight] = guildLabArt.frames[0].slice(2);
const [torsoWidth, torsoFrameHeight] = guildLabArt.frames[torso.frame].slice(2);
const neckOnTorso =
  torso.x + (guildLabArt.torso.neck.center[0] - torsoWidth / 2) * (torso.height / torsoFrameHeight);
const neckWithinHead =
  (guildLabArt.head.neck.center[0] - headWidth / 2) * (headHeight / headFrameHeight);
const neckOnTorsoY =
  torso.y +
  (guildLabArt.torso.neck.center[1] - torsoFrameHeight / 2) * (torso.height / torsoFrameHeight);
const chinWithinHeadY =
  ((guildLabArt.head.neck.chinUnder[1] - headFrameHeight) * headHeight) / headFrameHeight;
export const labRig = {
  legStyle: "jointed",
  head: { x: neckOnTorso - neckWithinHead, y: neckOnTorsoY + 6 - chinWithinHeadY, layer: 7 },
  neckBase: {
    x: neckOnTorso,
    y: neckOnTorsoY + 6,
    width: 9,
    height: 7,
    layer: 5.8,
    color: 0xf5cfb0,
  },
  scarf: { frame: 1, x: -4, y: -85, height: labArtHeight(guildLabArt, 1, 16), layer: 6 },
  torso,
  walk: {
    forward: 16,
    back: 20,
    lift: 11,
    lean: 2,
    headCounter: 0.35,
    center: torso.x,
    pivotY: -56,
  },
  cape: {
    frame: 3,
    x: -5,
    y: -84,
    height: labArtHeight(guildLabArt, 3, 48),
    originX: labArtOrigin(guildLabArt, 3, 2, 0.78),
    originY: labArtOrigin(guildLabArt, 3, 3, 0.08),
    layer: 3,
    walkSway: 0.06,
  },
  cup: { frame: 12, height: labArtHeight(guildLabArt, 12, 17), layer: 7.5 },
  legs: [
    { ...leg, frames: [8, 9], joint: { x: 4, y: -56 }, layer: 1 },
    { ...leg, frames: [10, 11], joint: { x: -5, y: -56 }, layer: 4 },
  ] satisfies LabLimbConfig[],
  arms: [
    {
      ...arm,
      frames: [4, 5],
      joint: { x: 7, y: -80 },
      layer: 0,
      restHand: { x: -8, y: 28 },
      walkSwing: -16,
      walkShoulder: { forward: 10, back: -5 },
      walkElbow: { forward: 20, back: 7 },
      walkScale: 0.68,
      idleAngles: { shoulder: 10, elbow: 10, scale: 0.86 },
    },
    {
      ...arm,
      frames: [6, 7],
      joint: { x: -8, y: -81 },
      layer: 8,
      restHand: { x: 7, y: 41 },
      walkSwing: 17,
      walkShoulder: { forward: 25, back: -10 },
      walkElbow: { forward: 28, back: 7 },
      walkScale: 1,
      idleAngles: { shoulder: 5, elbow: 10, scale: 1 },
    },
  ] satisfies LabArmConfig[],
  stanceReach: 0.96,
  idleReach: 0.99,
  idleSettleMs: 180,
  idleFeet: [
    { x: 4.5, y: 0 },
    { x: -4.5, y: 0 },
  ],
  soleExtension: 0.12,
  armSettleMs: 180,
  seatedFoot: { x: 22, y: 38 },
  teaGrip: { x: -8.5, y: 12 },
} as const;

export const labRigs = { leon: labRig, aria: ariaLabRig } as const;
export type LabCharacterId = keyof typeof labRigs;
export type LabCharacterRig = (typeof labRigs)[LabCharacterId];
