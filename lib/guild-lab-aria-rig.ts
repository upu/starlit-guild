import { guildLabAriaArt as art } from "./guild-lab-aria-art.ts";
import type { LabLimbConfig } from "./guild-lab-rig.ts";

const master = art.master;
const scale = master.scale;
const world = (point: readonly number[]) => ({
  x: (point[0] - master.origin[0]) * scale,
  y: (point[1] - master.origin[1]) * scale,
});
const part = (name: string) => {
  const p = master.parts.find((p) => p.name === name);
  if (!p) throw Error(`Missing master layer ${name}`);
  return p;
};
const root = (name: string) => {
  const p = part(name);
  if (!("root" in p)) throw Error(`Missing master root ${name}`);
  return p.root;
};
const drawing = (name: string, anchor?: readonly number[]) => {
  const p = part(name),
    [x, y, w, h] = p.rect;
  const point = anchor ?? [x + w / 2, y + h / 2];
  return {
    frame: p.frame,
    ...world(point),
    height: h * scale,
    layer: p.layer,
    originX: (point[0] - x) / w,
    originY: (point[1] - y) / h,
  };
};
const angle = (a: readonly number[], b: readonly number[]) => Math.atan2(a[0] - b[0], b[1] - a[1]);
const limb = (upper: string, lower: string, layer: number) => {
  const a = part(upper),
    b = part(lower);
  if (!("joints" in a) || !("joints" in b)) throw Error("Missing measured master joints");
  const [root, knee] = a.joints,
    [, end] = b.joints;
  const distance = (p: readonly number[], q: readonly number[]) =>
    Math.hypot(p[0] - q[0], p[1] - q[1]) * scale;
  return {
    frames: [a.frame, b.frame] as const,
    joint: world(root),
    lengths: [distance(root, knee), distance(knee, end)] as const,
    layer,
    measured: true as const,
    front: "lower" as const,
    bend: 1,
    thickness: 1,
    idleBend: 1,
    idleAngles: {
      shoulder: (-angle(root, knee) * 180) / Math.PI,
      elbow: (-(angle(knee, end) - angle(root, knee)) * 180) / Math.PI,
      scale: 1,
    },
  };
};
const headPart = part("head"),
  headRect = headPart.rect;
const hairLocks = ["far-hair", "back-hair", "front-hair"].map((name, i) => {
  const p = part(name);
  if (!("root" in p)) throw Error("Missing hair root");
  return { ...drawing(name, p.root), sway: [0.025, 0.035, 0.025][i], phase: i * 0.8 };
});
const arms = [
  limb("far-upper-arm", "far-forearm", 0),
  limb("near-upper-arm", "near-forearm", 8),
].map((arm, i) => ({
  ...arm,
  restHand: { x: 7, y: 35 },
  walkSwing: i ? 16 : -14,
  walkShoulder: { forward: i ? 24 : 9, back: i ? -10 : -5 },
  walkElbow: { forward: 28, back: 7 },
  walkScale: 1,
}));
const legs = [limb("far-thigh", "far-boot", 1), limb("near-thigh", "near-boot", 4)].map((leg) => ({
  ...leg,
  front: "lower" as const,
  bend: -1,
}));
const feet = ["far-boot", "near-boot"].map((name) => {
  const p = part(name);
  if (!("joints" in p)) throw Error("Missing measured foot");
  return world(p.joints[1]);
});
const bentLegFrame = (side: number) => {
  const variant = art.variants.find((v) => v.kind === "leg" && v.side === side);
  if (!variant) throw Error("Missing painted swing leg");
  return variant.frame;
};
export const ariaLabRig = {
  legStyle: "single",
  singleLegs: ["far-leg", "near-leg"].map((name) => {
    const p = part(name);
    if (!("joints" in p)) throw Error("Missing single-leg landmarks");
    const [hip, foot] = p.joints;
    return {
      ...drawing(name, hip),
      length: Math.hypot(foot[0] - hip[0], foot[1] - hip[1]) * scale,
      paintedAngle: angle(hip, foot),
      forward: 15,
      back: 19,
      lift: 4,
      bentFrame: bentLegFrame(name === "far-leg" ? 0 : 1),
      ankleY: world(foot).y,
    };
  }),
  head: { ...world([headRect[0] + headRect[2] / 2, headRect[1] + headRect[3]]), layer: 9 },
  neckBase: { ...world(master.neck), width: 4, height: 3, layer: 5.8, color: 0xf9d1b8 },
  scarf: drawing("front-cape"),
  torso: drawing("torso"),
  walk: {
    forward: 12,
    back: 16,
    lift: 10,
    lean: 3,
    headCounter: 0.35,
    center: world(master.waist).x,
    pivotY: (legs[0].joint.y + legs[1].joint.y) / 2,
  },
  cape: {
    ...drawing("back-cape", root("back-cape")),
    walkSway: 0.05,
  },
  cup: {
    frame: 12,
    height: 17,
    layer: 7.5,
    raisedLayer: 9.1,
    handLayer: 9.2,
    restingHandLayer: 8.05,
  },
  hairLocks,
  backHair: { ...hairLocks[1] },
  skirt: {
    ...drawing("skirt", master.waist),
    follow: 0.5,
    maxRotation: 0.25,
    maxWidth: 1.12,
    spring: 100,
    damping: 5,
  },
  skirtBack: { ...drawing("skirt-back", master.waist), maxDifference: 0.06 },
  feet: art.feet.map((f, i) => ({
    frame: f.frame,
    height: art.frames[f.frame][3] * scale,
    layer: legs[i].layer + 0.01,
    originX: f.root[0] / art.frames[f.frame][2],
    originY: f.root[1] / art.frames[f.frame][3],
    sole: ((f.sole[0][1] + f.sole[1][1]) / 2) * scale - f.point[1] * scale,
    paintedSlope: Math.atan2(f.sole[1][1] - f.sole[0][1], f.sole[1][0] - f.sole[0][0]),
  })),
  floorAnkleY: -9.6,
  legs: legs satisfies LabLimbConfig[],
  arms,
  stanceReach: 0.96,
  idleReach: 1,
  idleSettleMs: 180,
  armSettleMs: 180,
  idleFeet: feet,
  idleBob: 0,
  soleExtension: 0.24,
  seatedFoot: { x: 21, y: 36 },
  teaGrip: { x: -8.5, y: 6 },
} as const;
