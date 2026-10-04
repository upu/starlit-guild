import { residentWork } from "./home-actor.ts";
// Drawing reference only; no production rewards, character state or save access.
export type WorkPoint = { x: number; y: number };
export const workStudy = { ...residentWork, phases: residentWork.frames };
export const workLabels = ["手を伸ばす", "手元を動かす", "身を寄せる", "戻す"];
export const workSupport = { x: 124, y: 98 };
const keys = [
  { hand: { x: 132, y: 88 }, lean: 0 },
  { hand: { x: 141, y: 85 }, lean: 1.5 },
  { hand: { x: 139, y: 92 }, lean: 3 },
  { hand: { x: 130, y: 90 }, lean: 0.7 },
];
export function workPhase(time: number) {
  return (((time % workStudy.duration) + workStudy.duration) % workStudy.duration) / workStudy.step;
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
function elbow(shoulder: WorkPoint, hand: WorkPoint): WorkPoint {
  const dx = hand.x - shoulder.x,
    dy = hand.y - shoulder.y;
  const distance = Math.hypot(dx, dy);
  const along = (21 ** 2 - 23 ** 2 + distance ** 2) / (2 * distance);
  const bend = Math.sqrt(Math.max(0, 21 ** 2 - along ** 2));
  return {
    x: shoulder.x + (dx * along - dy * bend) / distance,
    y: shoulder.y + (dy * along + dx * bend) / distance,
  };
}
export function workStudyPose(time: number, smooth = false) {
  const phase = workPhase(time),
    frame = Math.floor(phase);
  const a = keys[frame],
    b = keys[(frame + 1) % keys.length];
  const v = smooth ? phase - frame : 0,
    t = v * v * (3 - 2 * v);
  const hand = { x: mix(a.hand.x, b.hand.x, t), y: mix(a.hand.y, b.hand.y, t) };
  const lean = mix(a.lean, b.lean, t);
  const shoulder = { x: 103 + lean, y: 84 + lean * 0.4 };
  return {
    frame,
    hand,
    shoulder,
    elbow: elbow(shoulder, hand),
    lean,
    support: workSupport,
    feet: [
      { x: 81, y: 150 },
      { x: 102, y: 145 },
    ],
  };
}
