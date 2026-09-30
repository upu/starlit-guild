import { LAB_HEIGHT, LAB_WIDTH, LAB_ACTOR_SCALE, type Point } from "./guild-lab-model.ts";

export type LabCameraView = "auto" | "room" | "residents";
// Keep chibi faces readable: 12 tiles on phones, the full room on desktop.
export function labCameraZoom(width: number, view: LabCameraView) {
  return view === "room" || (view === "auto" && width >= 600) ? 1 : width < 600 ? 2.1 : 1.8;
}
export function labCameraTarget(points: Point[], zoom: number) {
  const halfWidth = LAB_WIDTH / zoom / 2,
    halfHeight = LAB_HEIGHT / zoom / 2;
  const center = {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2 - 85 * LAB_ACTOR_SCALE,
  };
  return {
    x: Math.max(halfWidth, Math.min(LAB_WIDTH - halfWidth, center.x)),
    y: Math.max(halfHeight, Math.min(LAB_HEIGHT - halfHeight, center.y)),
  };
}
export class LabCameraFollow {
  private position: Point | null = null;
  sample(points: Point[], zoom: number, delta: number, instant = false) {
    const target = labCameraTarget(points, zoom);
    const t = instant || !this.position ? 1 : 1 - Math.exp(-Math.max(0, delta) / 180);
    this.position = {
      x: (this.position?.x ?? target.x) + (target.x - (this.position?.x ?? target.x)) * t,
      y: (this.position?.y ?? target.y) + (target.y - (this.position?.y ?? target.y)) * t,
    };
    // A resize or switching to the whole room must clamp the old center too.
    const halfWidth = LAB_WIDTH / zoom / 2,
      halfHeight = LAB_HEIGHT / zoom / 2;
    this.position = {
      x: Math.max(halfWidth, Math.min(LAB_WIDTH - halfWidth, this.position.x)),
      y: Math.max(halfHeight, Math.min(LAB_HEIGHT - halfHeight, this.position.y)),
    };
    return this.position;
  }
}
