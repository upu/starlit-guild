// Production sprites stay untouched. This is the shared drawing reference.
export type TeaPoint = { x: number; y: number };
export const teaStudy = { duration: 8000, phases: 4, step: 2000, height: 84, tableY: -34 };
export const teaLabels = [
  "テーブルの高さで構える",
  "片手で持ち上げる",
  "ひと口飲む",
  "ゆっくり下ろす",
];
const ease = (t: number) => {
  const v = Math.max(0, Math.min(1, t));
  return v * v * (3 - 2 * v);
};
const mix = (a: TeaPoint, b: TeaPoint, t: number): TeaPoint => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
export function teaPhase(time: number) {
  return (((time % teaStudy.duration) + teaStudy.duration) % teaStudy.duration) / teaStudy.step;
}
function elbow(shoulder: TeaPoint, hand: TeaPoint): TeaPoint {
  const dx = hand.x - shoulder.x,
    dy = hand.y - shoulder.y;
  const distance = Math.hypot(dx, dy);
  const bend = Math.sqrt(Math.max(0, 15 ** 2 - (distance / 2) ** 2));
  return {
    x: (shoulder.x + hand.x) / 2 - (dy / distance) * bend,
    y: (shoulder.y + hand.y) / 2 + (dx / distance) * bend,
  };
}
export function teaStudyPose(time: number) {
  const phase = teaPhase(time);
  const lift = ease(phase - 1) * (1 - ease(phase - 3));
  // Bottom of the lowered cup is level with the tabletop, never the lap.
  const cup = mix({ x: 20, y: teaStudy.tableY - 6 }, { x: 19, y: -57 }, lift);
  const hand = { x: cup.x - 8, y: cup.y + 1 };
  const shoulder = { x: -3, y: -46 };
  const reaction = teaReaction(time);
  return {
    phase,
    cup,
    hand,
    shoulder,
    elbow: elbow(shoulder, hand),
    mouth: { x: 13, y: -60 },
    hip: { x: -3, y: -27 },
    knee: { x: 17, y: -27 },
    ankle: { x: 17, y: -3 },
    restingHand: { x: 4, y: -28 },
    ...reaction,
    drinking: phase >= 2 && phase < 3,
  };
}
// A reaction overlays the held-cup pose; it is not another drinking frame.
export function teaReaction(time: number) {
  const phase = teaPhase(time);
  const responding = phase < 1;
  const amount = responding ? Math.sin(phase * Math.PI) ** 2 : 0;
  return { look: amount, nod: amount * 4, smile: responding };
}
export function teaPair(time: number) {
  return [teaStudyPose(time), teaStudyPose(time + teaStudy.duration / 2)] as const;
}
