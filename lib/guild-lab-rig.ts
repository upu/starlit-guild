import { guildLabArt } from "./guild-lab-art.ts";

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
  overlap: [
    [0.025, 0.2],
    [0.04, 0.12],
  ],
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
  cup: { frame: 12, height: 17, layer: 9 },
  legs: [
    { ...leg, frames: [8, 9], joint: { x: 4, y: -56 }, layer: 1 },
    { ...leg, frames: [10, 11], joint: { x: -5, y: -56 }, layer: 4 },
  ] satisfies LabLimbConfig[],
  arms: [
    {
      ...arm,
      frames: [4, 5],
      joint: { x: 7, y: -83 },
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
      joint: { x: -6, y: -84.5 },
      layer: 8,
      restHand: { x: 7, y: 41 },
      walkSwing: 17,
      walkShoulder: { forward: 25, back: -10 },
      walkElbow: { forward: 28, back: 7 },
      walkScale: 1,
    },
  ] satisfies LabArmConfig[],
  stanceReach: 0.96,
  armSettleMs: 180,
  seatedFoot: { x: 22, y: 38 },
} as const;
