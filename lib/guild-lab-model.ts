import { guildLabArt } from "./guild-lab-art.ts";
import { labRig, type LabCharacterRig } from "./guild-lab-rig.ts";
import type { LabCharacterArt } from "./guild-lab-characters.ts";
export const LAB_TILE = 32;
export const LAB_WIDTH = 24 * LAB_TILE;
export const LAB_HEIGHT = 18 * LAB_TILE;
export const LAB_ACTOR_SCALE = 0.5;
export const LAB_WALK_SPEED = 0.08 * LAB_ACTOR_SCALE;
export function labMouth(art: LabCharacterArt = guildLabArt) {
  const headScale = art.head.displayHeight / art.frames[0][3];
  return {
    x: (art.head.mouth.x - art.frames[0][2] / 2) * headScale,
    y: (art.head.mouth.y - art.frames[0][3]) * headScale,
  };
}
export const labFace = { mouth: labMouth() };
export type LabMode = "tea" | "walk" | "work" | "detour";
export type LabPose = LabMode | "idle";
export type Point = { x: number; y: number };
export const labStations = {
  tea: { x: 272, y: 386 },
  ariaTea: { x: 369, y: 386 },
  work: { x: 504, y: 204 },
  ariaDetour: { x: 488, y: 222 },
  detour: { x: 272, y: 386 },
};
export const labFurniture = [
  { id: "desk", frame: 2, col: 3, row: 3, cols: 2, rows: 2 },
  { id: "bench", frame: 1, col: 16, row: 4, cols: 3, rows: 2 },
  { id: "table", frame: 0, col: 9, row: 10, cols: 2, rows: 2 },
  { id: "chair", frame: 3, col: 8, row: 11, cols: 1, rows: 1 },
  { id: "aria-chair", frame: 3, col: 11, row: 11, cols: 1, rows: 1 },
] as const;

export function labPathTo(from: Point, target: Point, aisle = 416): Point[] {
  if (Math.hypot(target.x - from.x, target.y - from.y) < 1) return [target];
  return [{ x: from.x, y: from.y }, { x: from.x, y: aisle }, { x: target.x, y: aisle }, target];
}
export function labPath(from: Point, mode: LabMode): Point[] {
  const target = mode === "walk" ? { x: from.x < 384 ? 656 : 112, y: 416 } : labStations[mode];
  return labPathTo(from, target);
}
export function labTravel(path: Point[], distance: number) {
  let remaining = distance;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1],
      b = path[i];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length > remaining) {
      const t = remaining / length;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, left: b.x < a.x, moving: true };
    }
    remaining -= length;
  }
  return { ...path[path.length - 1], left: false, moving: false };
}

// Two bones rotate around the painted shoulder/elbow or hip/knee overlaps.
export function labJoint(target: Point, upper: number, lower: number, bend = 1) {
  const raw = Math.hypot(target.x, target.y);
  const distance = Math.max(Math.abs(upper - lower) + 0.01, Math.min(upper + lower - 0.01, raw));
  const offset = Math.acos(
    (upper * upper + distance * distance - lower * lower) / (2 * upper * distance),
  );
  const a = Math.atan2(-target.x, target.y) + offset * bend;
  const end = { x: -Math.sin(a) * upper, y: Math.cos(a) * upper };
  const ratio = raw ? distance / raw : 0;
  const b = Math.atan2(-(target.x * ratio - end.x), target.y * ratio - end.y);
  return { upper: a, lower: b - a };
}
export function labWalkSpeed(rig: LabCharacterRig = labRig) {
  return ((rig.walk.forward + rig.walk.back) * LAB_ACTOR_SCALE) / 450;
}
export function labUpperPoint(point: Point, lean: number, rig: LabCharacterRig = labRig) {
  const rotated = rotate({ x: point.x, y: point.y - rig.walk.pivotY }, lean);
  return { x: rotated.x, y: rotated.y + rig.walk.pivotY };
}
export function labFoot(time: number, offset: number, rig: LabCharacterRig = labRig) {
  const phase = (time / 900 + offset) % 1;
  const { forward, back, lift } = rig.walk;
  const stride = (forward + back) * 2;
  return phase < 0.5
    ? { x: forward - phase * stride, y: 0 }
    : { x: -back + (phase - 0.5) * stride, y: -Math.sin((phase - 0.5) * Math.PI * 2) * lift };
}
function walkFootShift(rig: LabCharacterRig) {
  return rig.walk.center - (rig.legs[0].joint.x + rig.legs[1].joint.x) / 2;
}
export function labHip(index: number, mode: LabPose, rig: LabCharacterRig = labRig, settled = 1) {
  const leg = rig.legs[index];
  if (mode !== "idle" || !("idleJoint" in leg)) return leg.joint;
  return {
    x: leg.joint.x + (leg.idleJoint.x - leg.joint.x) * settled,
    y: leg.joint.y + (leg.idleJoint.y - leg.joint.y) * settled,
  };
}
export function labLegTarget(
  time: number,
  offset: number,
  mode: LabPose,
  bob: number,
  rig: LabCharacterRig = labRig,
) {
  if (mode === "tea") return rig.seatedFoot;
  const index = offset ? 1 : 0;
  const hip = labHip(index, mode, rig);
  const foot =
    mode === "walk"
      ? {
          ...labFoot(time, offset, rig),
          x: labFoot(time, offset, rig).x + walkFootShift(rig),
        }
      : {
          x: rig.idleFeet[index].x - hip.x,
          y: rig.idleFeet[index].y,
        };
  return { x: foot.x, y: -hip.y + foot.y - bob };
}
export function labFarHand(time: number, mode: LabPose, rig: LabCharacterRig = labRig) {
  const arm = rig.arms[0];
  const swing = mode === "walk" ? Math.sin((time / 900) * Math.PI * 2) * arm.walkSwing : 0;
  return { x: arm.restHand.x + swing, y: arm.restHand.y };
}
function handPosition(t: number, mode: LabPose, rig: LabCharacterRig) {
  if (mode === "work")
    return {
      x: 20 - rig.arms[1].joint.x + Math.sin(t / 220) * 4,
      y: -90 - rig.arms[1].joint.y + Math.cos(t / 220) * 3,
    };
  const arm = rig.arms[1];
  return {
    x: mode === "walk" ? Math.sin((t / 900) * Math.PI * 2) * arm.walkSwing : arm.restHand.x,
    y: arm.restHand.y,
  };
}
function rotate(point: Point, angle: number) {
  return {
    x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
  };
}
export function labTeaCup(
  sip: number,
  headAngle: number,
  rig: LabCharacterRig = labRig,
  art: LabCharacterArt = guildLabArt,
) {
  const face = rotate(labMouth(art), headAngle);
  const mouth = { x: rig.head.x + face.x, y: rig.head.y + face.y };
  const angle = -0.12 * sip;
  // Contact is on the near rim; the glove holds the handle below it.
  const rim = rotate({ x: -7, y: 2.5 }, angle);
  const x = 28 + (mouth.x - rim.x - 28) * sip;
  const y = -68 + (mouth.y - rim.y + 68) * sip;
  const grip = rotate(rig.teaGrip, angle);
  return {
    x,
    y,
    angle,
    mouth,
    rim: { x: x + rim.x, y: y + rim.y },
    hand: { x: x + grip.x - rig.arms[1].joint.x, y: y + grip.y - rig.arms[1].joint.y },
  };
}
function standingHeight(t: number, mode: LabPose, rig: LabCharacterRig) {
  if (mode === "idle" && "idleBob" in rig) return rig.idleBob;
  const walking = mode === "walk";
  const index = walking && t % 900 >= 450 ? 1 : 0;
  const [upper, lower] = rig.legs[0].lengths;
  const reach = (upper + lower) * (mode === "idle" ? rig.idleReach : rig.stanceReach);
  const planted = labFoot(t, index / 2, rig);
  const plantedX = planted.x - (rig.walk.forward - rig.walk.back) / 2;
  // Raise the hip over the planted foot without moving that foot on the floor.
  const idleX = Math.min(...rig.idleFeet.map((p, i) => Math.abs(p.x - labHip(i, "idle", rig).x)));
  return -rig.legs[0].joint.y - Math.sqrt(reach * reach - (walking ? plantedX ** 2 : idleX ** 2));
}
function bodyMotion(
  t: number,
  mode: LabPose,
  idleTransition: number,
  idleFromBob: number,
  rig: LabCharacterRig,
) {
  const phase = (t / 900) * Math.PI * 2,
    walking = mode === "walk",
    standing = standingHeight(t, mode, rig);
  return {
    lean: walking ? (rig.walk.lean * Math.PI) / 180 : 0,
    bob:
      mode === "tea"
        ? Math.sin(t / 900) * 0.8
        : mode === "idle" && idleTransition < 1
          ? idleFromBob * (1 - idleTransition) + standing * idleTransition
          : standing,
    head: walking ? Math.sin(phase) * 0.025 : Math.sin(t / 1500) * 0.035,
    cape: Math.sin(t / 350) * (walking ? rig.cape.walkSway : 0.025),
  };
}
export function labPose(
  time: number,
  mode: LabPose,
  reduced: boolean,
  idleTransition = 1,
  idleFromBob = 0,
  rig: LabCharacterRig = labRig,
  art: LabCharacterArt = guildLabArt,
  phaseOffset = 0,
) {
  const t = reduced ? 0 : time + phaseOffset;
  const sip =
    mode === "tea"
      ? (1 - Math.cos(Math.min(1, Math.max(0, ((t % 8000) - 3500) / 3000)) * Math.PI * 2)) / 2
      : 0;
  const motion = bodyMotion(t, mode, idleTransition, idleFromBob, rig);
  motion.lean = reduced ? 0 : motion.lean;
  motion.head -= motion.lean * rig.walk.headCounter;
  const cup = labTeaCup(sip, motion.head, rig, art);
  return {
    ...motion,
    blink: !reduced && t % 4700 > 4510,
    sip,
    cup,
    hand: mode === "tea" ? cup.hand : handPosition(t, mode, rig),
    farHand: labFarHand(t, mode, rig),
  };
}
