import { guildLabArt as art } from "./guild-lab-art.ts";
const master = art.master,
  s = master.scale;
const world = (p: readonly number[]) => ({
  x: (p[0] - master.origin[0]) * s,
  y: (p[1] - master.origin[1]) * s,
});
const part = (name: string) => {
  const p = master.parts.find((p) => p.name === name);
  if (!p) throw Error(`Missing Leon part ${name}`);
  return p;
};
const draw = (name: string, anchor?: readonly number[]) => {
  const p = part(name),
    [x, y, w, h] = p.rect,
    a = anchor ?? [x + w / 2, y + h / 2];
  return {
    frame: p.frame,
    ...world(a),
    height: h * s,
    layer: p.layer,
    originX: (a[0] - x) / w,
    originY: (a[1] - y) / h,
  };
};
const limb = (upper: string, lower: string, front: "upper" | "lower") => {
  const a = part(upper),
    b = part(lower);
  if (!("joints" in a) || !("joints" in b)) throw Error("Missing measured Leon joints");
  const [root, hinge] = a.joints,
    [, end] = b.joints,
    angle = (a: readonly number[], b: readonly number[]) => Math.atan2(a[0] - b[0], b[1] - a[1]);
  return {
    frames: [a.frame, b.frame] as const,
    joint: world(root),
    lengths: [
      Math.hypot(root[0] - hinge[0], root[1] - hinge[1]) * s,
      Math.hypot(end[0] - hinge[0], end[1] - hinge[1]) * s,
    ] as const,
    front,
    layer: a.layer,
    measured: true as const,
    thickness: 1,
    bend: 1,
    idleBend: 1,
    idleAngles: {
      shoulder: (-angle(root, hinge) * 180) / Math.PI,
      elbow: (-(angle(hinge, end) - angle(root, hinge)) * 180) / Math.PI,
      scale: 1,
    },
  };
};
const legs = [limb("far-thigh", "far-boot", "upper"), limb("near-thigh", "near-boot", "upper")];
const arms = [
  limb("far-upper-arm", "far-forearm", "lower"),
  limb("near-upper-arm", "near-forearm", "lower"),
].map((a, i) => ({
  ...a,
  restHand: { x: 7, y: 41 },
  walkSwing: i ? 17 : -16,
  walkShoulder: { forward: i ? 25 : 10, back: i ? -10 : -5 },
  walkElbow: { forward: 28, back: 7 },
  walkScale: 1,
}));
const head = part("head"),
  cape = part("back-cape");
export const leonLabRig = {
  legStyle: "jointed",
  head: { ...world([head.rect[0] + head.rect[2] / 2, head.rect[1] + head.rect[3]]), layer: 9 },
  neckBase: { ...world(master.neck), width: 5, height: 3, layer: 5.8, color: 0xf5c6a8 },
  torso: draw("torso"),
  scarf: draw("front-cape"),
  cape: { ...draw("back-cape", "root" in cape ? cape.root : undefined), walkSway: 0.05 },
  walk: {
    forward: 16,
    back: 20,
    lift: 11,
    lean: 2,
    headCounter: 0.35,
    center: world(master.waist).x,
    pivotY: (legs[0].joint.y + legs[1].joint.y) / 2,
  },
  cup: {
    frame: 12,
    height: 17,
    layer: 7.5,
    raisedLayer: 9.1,
    handLayer: 9.2,
    restingHandLayer: 8.05,
    rest: { x: 8, y: -78 },
  },
  legs,
  arms,
  feet: art.feet.map((f, i) => ({
    frame: f.frame,
    height: art.frames[f.frame][3] * s,
    originX: f.root[0] / art.frames[f.frame][2],
    originY: f.root[1] / art.frames[f.frame][3],
    layer: legs[i].layer + 0.01,
    sole: ((f.sole[0][1] + f.sole[1][1]) / 2 - f.point[1]) * s,
    paintedSlope: Math.atan2(f.sole[1][1] - f.sole[0][1], f.sole[1][0] - f.sole[0][0]),
  })),
  floorAnkleY: -8.45,
  stanceReach: 0.97,
  idleReach: 1,
  idleBob: 0,
  idleSettleMs: 180,
  armSettleMs: 180,
  idleFeet: art.feet.map((f) => world(f.point)),
  soleExtension: 0,
  seatedFoot: { x: 22, y: 38 },
  teaGrip: { x: -8.5, y: 12 },
} as const;
