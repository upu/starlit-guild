import type { ResidentId } from "./home-actor.ts";

// Right-hand wrist centers in the registered 128px cells (ground contact y=120).
// Unlike carried items, an applied dressing follows the arm through its walking swing.
// null means the far arm is behind the torso in this frame.
const walking = {
  aria: [[76, 80], [76, 80], null, null, null, null, null, [83, 75]],
  leon: [[76, 82], [76, 82], null, null, [76, 82], [76, 82], null, null],
};
const conversation: Record<string, Partial<Record<number, number[]>>> = {
  aria: { 0: [76, 82], 3: [72, 69], 4: [83, 65] },
  leon: {
    0: [76, 83],
    3: [73, 73],
    4: [81, 70],
    6: [68, 96],
    7: [68, 96],
    8: [81, 71],
    9: [81, 71],
    22: [81, 71],
    23: [81, 71],
    14: [76, 77],
    13: [77, 108],
  },
};
export function stageWrist(id: ResidentId, atlas: string, frame: number) {
  if (id !== "aria" && id !== "leon") return undefined;
  const point =
    atlas === "home"
      ? walking[id][frame]
      : atlas === "conversation"
        ? conversation[id][frame]
        : undefined;
  return point ? { x: point[0], y: point[1] } : undefined;
}
