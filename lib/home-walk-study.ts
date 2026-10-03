// Authoring reference only. Game residents still use whole-body sprite frames.
export type WalkPoint = { x: number; y: number };
export const walkStudy = { frames: 8, frameMs: 100, height: 84, near: "#ec9551", far: "#58aabd" };
const turn = Math.PI * 2;
const add = (a: WalkPoint, b: WalkPoint): WalkPoint => ({ x: a.x + b.x, y: a.y + b.y });
const bone = (angle: number, length: number): WalkPoint => ({
  x: Math.sin(angle) * length,
  y: Math.cos(angle) * length,
});
function knee(hip: WalkPoint, ankle: WalkPoint) {
  const dx = ankle.x - hip.x,
    dy = ankle.y - hip.y;
  const distance = Math.hypot(dx, dy);
  const bend = Math.acos(Math.min(1, distance / 32.4));
  return add(hip, bone(Math.atan2(dx, dy) + bend, 16.2));
}
function foot(phase: number) {
  const planted = phase <= 0.625;
  const swing = (phase - 0.625) / 0.375;
  return {
    x: planted ? 9 - (20 * phase) / 0.625 : -11 + (20 * (1 - Math.cos(swing * Math.PI))) / 2,
    y: planted ? 0 : -6 * Math.sin(swing * Math.PI),
    planted,
  };
}
function side(phase: number, near: boolean, bob: number) {
  const hip = { x: near ? -4 : 4, y: (near ? -33 : -36) + bob };
  const shoulder = { x: near ? -7 : 5, y: (near ? -54 : -55) + bob };
  const angle = -Math.cos(phase * turn) * 0.3;
  const elbow = add(shoulder, bone(angle, 13));
  const hand = add(elbow, bone(angle + 0.12, 12));
  const step = foot(phase);
  const ankle = { x: hip.x + step.x, y: (near ? -2 : -5) + step.y };
  return {
    shoulder,
    elbow,
    hand,
    hip,
    knee: knee(hip, ankle),
    ankle,
    planted: step.planted,
    angle,
  };
}
export function walkStudyPose(frame: number) {
  const phase = (((frame % 8) + 8) % 8) / 8;
  const bob = 0.65 * (1 + Math.cos(phase * turn * 2));
  return { bob, near: side(phase, true, bob), far: side((phase + 0.5) % 1, false, bob) };
}
export const walkStudyLabels = [
  "手前の足が前・腕は後ろ",
  "体重を乗せる",
  "腕が真下を通る",
  "奥の足を前へ",
  "奥の足が前・手前の腕は前",
  "体重を乗せる",
  "腕が真下を通る",
  "手前の足を前へ",
];
