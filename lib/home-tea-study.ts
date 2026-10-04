// Production sprites stay untouched. This is the shared drawing reference.
export type TeaPoint = { x: number; y: number };
export const teaStudy = { duration: 16000, phases: 8, step: 2000, height: 84 };
export const teaLabels = [
  "ひざ元でカップを持つ",
  "片手で持ち上げる",
  "ひと口飲む",
  "ゆっくり下ろす",
  "ほっとひと息",
  "相手へ目を向ける",
  "笑顔でうなずく",
  "静かに聞く",
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
  const cup = mix({ x: 20, y: -30 }, { x: 19, y: -57 }, lift);
  const hand = { x: cup.x - 8, y: cup.y + 1 };
  const shoulder = { x: -3, y: -46 };
  const look = ease(phase - 5) * (1 - ease(phase - 7));
  const nod = phase >= 6 && phase < 7 ? Math.sin((phase - 6) * Math.PI) ** 2 * 4 : 0;
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
    look,
    nod,
    smile: (phase >= 4 && phase < 5) || (phase >= 6 && phase < 7),
    drinking: phase >= 2 && phase < 3,
  };
}
export function teaPair(time: number) {
  return [teaStudyPose(time), teaStudyPose(time + teaStudy.duration / 2)] as const;
}
