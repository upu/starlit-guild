import { guildLabArt } from "./guild-lab-art.ts";
import { guildLabAriaArt } from "./guild-lab-aria-art.ts";

// Leon's attachment points and painted overlaps, in unscaled body coordinates.
export type LabLimbConfig = {
  frames: readonly [number, number];
  joint: { x: number; y: number };
  lengths: readonly [number, number];
  front: "upper" | "lower";
  layer: number;
  bend: number;
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

const torso = { frame: 2, x: 0, y: -67, height: 51, layer: 5 } as const;
const headHeight = 90;
const [headWidth, headFrameHeight] = guildLabArt.frames[0].slice(2);
const [torsoWidth, torsoFrameHeight] = guildLabArt.frames[torso.frame].slice(2);
const neckOnTorso =
  torso.x + (guildLabArt.torso.neck.center[0] - torsoWidth / 2) * (torso.height / torsoFrameHeight);
const neckWithinHead =
  (guildLabArt.head.neck.center[0] - headWidth / 2) * (headHeight / headFrameHeight);
export const labRig = {
  head: { x: neckOnTorso - neckWithinHead, y: -85.5, layer: 7 },
  scarf: { frame: 1, x: -4, y: -85, height: 16, layer: 6 },
  torso,
  cape: {
    frame: 3,
    x: -5,
    y: -84,
    height: 48,
    originX: 0.78,
    originY: 0.08,
    layer: 3,
    walkSway: 0.06,
  },
  cup: { frame: 12, height: 17, layer: 7.5 },
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
    },
  ] satisfies LabArmConfig[],
  stanceReach: 0.96,
  idleReach: 0.99,
  idleSettleMs: 180,
  soleExtension: 0.12,
  armSettleMs: 180,
  seatedFoot: { x: 22, y: 38 },
  teaGrip: { x: -8.5, y: 12 },
} as const;

const ariaHeadHeight = guildLabAriaArt.head.displayHeight;
const ariaHeadFrame = guildLabAriaArt.frames[0];
const ariaTorsoFrame = guildLabAriaArt.frames[2];
const ariaTorso = { frame: 2, x: 0, y: -65, height: 48, layer: 5 } as const;
const ariaNeckOnTorso =
  ariaTorso.x +
  (guildLabAriaArt.torso.neck.center[0] - ariaTorsoFrame[2] / 2) *
    (ariaTorso.height / ariaTorsoFrame[3]);
const ariaNeckWithinHead =
  (guildLabAriaArt.head.neck.center[0] - ariaHeadFrame[2] / 2) *
  (ariaHeadHeight / ariaHeadFrame[3]);
export const ariaLabRig = {
  head: { x: ariaNeckOnTorso - ariaNeckWithinHead, y: -84, layer: 7 },
  scarf: { frame: 1, x: -2, y: -82, height: 15, layer: 6 },
  torso: ariaTorso,
  cape: {
    frame: 3,
    x: -8,
    y: -82,
    height: 41,
    originX: 0.76,
    originY: 0.1,
    layer: 3,
    walkSway: 0.05,
  },
  cup: { frame: 12, height: 17, layer: 7.5 },
  backHair: { frame: guildLabAriaArt.extras.backHair, x: -17, y: -101, height: 73, layer: 2 },
  skirt: { frame: guildLabAriaArt.extras.skirt, x: 0, y: -52, height: 24, layer: 5.5 },
  legs: [
    {
      ...leg,
      lengths: [21, 26] as const,
      frames: [8, 9] as const,
      joint: { x: 4, y: -53 },
      layer: 1,
    },
    {
      ...leg,
      lengths: [21, 26] as const,
      frames: [10, 11] as const,
      joint: { x: -5, y: -53 },
      layer: 4,
    },
  ] satisfies LabLimbConfig[],
  arms: [
    {
      ...arm,
      lengths: [22, 24] as const,
      frames: [4, 5] as const,
      joint: { x: 6, y: -78 },
      layer: 0,
      restHand: { x: -7, y: 27 },
      walkSwing: -14,
      walkShoulder: { forward: 9, back: -5 },
      walkElbow: { forward: 20, back: 7 },
      walkScale: 0.66,
    },
    {
      ...arm,
      lengths: [22, 24] as const,
      frames: [6, 7] as const,
      joint: { x: -8, y: -80 },
      layer: 8,
      restHand: { x: 7, y: 39 },
      walkSwing: 16,
      walkShoulder: { forward: 24, back: -10 },
      walkElbow: { forward: 28, back: 7 },
      walkScale: 1,
    },
  ] satisfies LabArmConfig[],
  stanceReach: 0.96,
  idleReach: 0.99,
  idleSettleMs: 180,
  soleExtension: 0.12,
  armSettleMs: 180,
  seatedFoot: { x: 21, y: 36 },
  teaGrip: { x: -8.5, y: 6 },
} as const;

export const labRigs = { leon: labRig, aria: ariaLabRig } as const;
export type LabCharacterId = keyof typeof labRigs;
export type LabCharacterRig = (typeof labRigs)[LabCharacterId];
