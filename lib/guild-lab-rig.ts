// Leon's attachment points and painted overlaps, in unscaled body coordinates.
export type LabLimbConfig = {
  frames: readonly [number, number];
  joint: { x: number; y: number };
  lengths: readonly [number, number];
  // Proximal/distal extensions in bone-length units, independently per segment.
  overlap: readonly [readonly [number, number], readonly [number, number]];
  front: "upper" | "lower";
  layer: number;
  bend: number;
};
type LabArmConfig = LabLimbConfig & { restHand: { x: number; y: number }; walkSwing: number };
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
  overlap: [
    [0.12, 0.16],
    [0.08, 0.16],
  ],
  front: "lower",
  bend: 1,
} as const;
export const labRig = {
  head: { x: 3, y: -85.5, layer: 7 },
  scarf: { frame: 1, x: -4, y: -85, height: 16, layer: 6 },
  torso: { frame: 2, x: 0, y: -67, height: 51, layer: 5 },
  cape: { frame: 3, x: 0, y: -84, height: 62, originX: 0.86, originY: 0.08, layer: 3 },
  cup: { frame: 12, height: 17, layer: 9 },
  legs: [
    { ...leg, frames: [8, 9], joint: { x: 10, y: -54 }, layer: 1 },
    { ...leg, frames: [10, 11], joint: { x: -9, y: -54 }, layer: 4 },
  ] satisfies LabLimbConfig[],
  arms: [
    {
      ...arm,
      frames: [4, 5],
      joint: { x: 7, y: -83 },
      layer: 2,
      restHand: { x: -8, y: 39 },
      walkSwing: -19,
    },
    {
      ...arm,
      frames: [6, 7],
      joint: { x: -18, y: -80 },
      layer: 8,
      restHand: { x: 7, y: 41 },
      walkSwing: 17,
    },
  ] satisfies LabArmConfig[],
  stanceReach: 0.96,
  seatedFoot: { x: 22, y: 36 },
} as const;
