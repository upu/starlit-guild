// Art direction only: no resident state, rewards, or save access.
export type GardenAction = "water" | "inspect";
export type GardenPoint = { x: number; y: number };
export const gardenStudy = { frames: 4, step: 600, duration: 2400 };
export const gardenLabels = {
  water: ["構える", "傾ける", "根元へ注ぐ", "起こす"],
  inspect: ["植物へ向く", "かがむ", "葉をよく見る", "体を起こす"],
};
const poses = {
  water: [
    { lean: 0, crouch: 0, handX: 117, handY: 99, tilt: -10, pour: 0 },
    { lean: 3, crouch: 0, handX: 121, handY: 98, tilt: 12, pour: 0 },
    { lean: 5, crouch: 0, handX: 122, handY: 98, tilt: 24, pour: 1 },
    { lean: 2, crouch: 0, handX: 119, handY: 99, tilt: -3, pour: 0 },
  ],
  inspect: [
    { lean: 2, crouch: 0, handX: 117, handY: 109, tilt: 0, pour: 0 },
    { lean: 11, crouch: 4, handX: 134, handY: 116, tilt: 0, pour: 0 },
    { lean: 15, crouch: 5, handX: 138, handY: 117, tilt: 0, pour: 0 },
    { lean: 6, crouch: 2, handX: 123, handY: 112, tilt: 0, pour: 0 },
  ],
};
export function gardenPhase(time: number) {
  return (
    (((time % gardenStudy.duration) + gardenStudy.duration) % gardenStudy.duration) /
    gardenStudy.step
  );
}
function joint(shoulder: GardenPoint, hand: GardenPoint) {
  const dx = hand.x - shoulder.x,
    dy = hand.y - shoulder.y;
  const d = Math.hypot(dx, dy),
    along = (24 ** 2 - 25 ** 2 + d ** 2) / (2 * d);
  const bend = Math.sqrt(Math.max(0, 24 ** 2 - along ** 2));
  return {
    x: shoulder.x + (dx * along - dy * bend) / d,
    y: shoulder.y + (dy * along + dx * bend) / d,
  };
}
export function gardenPose(action: GardenAction, time: number, smooth = false) {
  const phase = gardenPhase(time),
    frame = Math.floor(phase);
  const a = poses[action][frame],
    b = poses[action][(frame + 1) % gardenStudy.frames];
  const f = smooth ? phase - frame : 0,
    t = f * f * (3 - 2 * f);
  const mix = (x: number, y: number) => x + (y - x) * t;
  const lean = mix(a.lean, b.lean),
    crouch = mix(a.crouch, b.crouch);
  const shoulder = { x: 100 + lean, y: 85 + lean * 0.6 + crouch };
  const hand = { x: mix(a.handX, b.handX), y: mix(a.handY, b.handY) };
  const tilt = mix(a.tilt, b.tilt),
    radians = (tilt * Math.PI) / 180;
  // Spout and stream share the same transform; the water ends in the soil, not on the feet.
  const spout = {
    x: hand.x + 37 * Math.cos(radians) - 6 * Math.sin(radians),
    y: hand.y + 37 * Math.sin(radians) + 6 * Math.cos(radians),
  };
  return {
    frame,
    lean,
    crouch,
    shoulder,
    hand,
    elbow: joint(shoulder, hand),
    tilt,
    spout,
    pouring: action === "water" && a.pour === 1 && tilt >= 12,
    feet: [
      { x: 78, y: 156 },
      { x: 99, y: 151 },
    ],
  };
}
