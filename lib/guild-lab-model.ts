export const LAB_TILE = 64;
export const LAB_WIDTH = 12 * LAB_TILE;
export const LAB_HEIGHT = 9 * LAB_TILE;
export type LabMode = "tea" | "walk" | "work";
export type LabPose = LabMode | "idle";
export type Point = { x: number; y: number };
export const labStations = { tea: { x: 224, y: 454 }, work: { x: 496, y: 316 } };
export const labFurniture = [
  { id: "desk", frame: 2, col: 1, row: 2, cols: 2, rows: 2 },
  { id: "bench", frame: 1, col: 8, row: 3, cols: 3, rows: 2 },
  { id: "table", frame: 0, col: 4, row: 5, cols: 2, rows: 2 },
  { id: "chair", frame: 3, col: 3, row: 6, cols: 1, rows: 1 },
] as const;

export function labPath(from: Point, mode: LabMode): Point[] {
  const target = mode === "walk" ? { x: from.x < 384 ? 656 : 112, y: 496 } : labStations[mode];
  if (Math.hypot(target.x - from.x, target.y - from.y) < 1) return [target];
  // The clear aisle below the table connects both activity points.
  return [{ x: from.x, y: from.y }, { x: from.x, y: 496 }, { x: target.x, y: 496 }, target];
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
export function labFoot(time: number, offset: number) {
  const phase = (time / 900 + offset) % 1;
  return phase < 0.5
    ? { x: 18 - phase * 72, y: 0 }
    : { x: -18 + (phase - 0.5) * 72, y: -Math.sin((phase - 0.5) * Math.PI * 2) * 12 };
}
function handPosition(t: number, mode: LabPose, sip: number) {
  if (mode === "work") return { x: 38 + Math.sin(t / 220) * 4, y: -10 + Math.cos(t / 220) * 3 };
  if (mode === "tea") return { x: 27 - sip * 3, y: 4 - sip * 38 };
  return { x: mode === "walk" ? Math.sin((t / 900) * Math.PI * 2) * 17 : 7, y: 41 };
}
function bodyMotion(t: number, walking: boolean) {
  const phase = (t / 900) * Math.PI * 2;
  return {
    bob: walking ? -Math.abs(Math.sin(phase)) * 3 : Math.sin(t / 900) * 0.8,
    head: walking ? Math.sin(phase) * 0.025 : Math.sin(t / 1500) * 0.035,
    cape: Math.sin(t / 350) * (walking ? 0.12 : 0.025),
  };
}
export function labPose(time: number, mode: LabPose, reduced: boolean) {
  const t = reduced ? 0 : time;
  const sip =
    mode === "tea"
      ? (1 - Math.cos(Math.min(1, Math.max(0, ((t % 8000) - 3500) / 3000)) * Math.PI * 2)) / 2
      : 0;
  return {
    ...bodyMotion(t, mode === "walk"),
    blink: !reduced && t % 4700 > 4510,
    sip,
    hand: handPosition(t, mode, sip),
  };
}
