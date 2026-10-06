import {
  cellPoint,
  furnitureCatalog,
  furnitureSpots,
  teaSeatOffset,
  type Furniture,
} from "./home-room-layout.ts";
import type { Resident } from "./home-room-life.ts";
import { residentHand, residentArt, type ResidentId } from "./home-actor.ts";

// Head widths measured from public/home-pixel/anchors.json: idle, right tea,
// left tea (four-pose mean). Chair height must not determine a person's size.
export const residentHeadWidths: Record<ResidentId, readonly [number, number, number]> = {
  leon: [52.98, 49.7, 49.5],
  aria: [58.85, 48.4, 45.88],
  mira: [61.07, 51.15, 51.8],
  finn: [54.07, 53.73, 52.6],
  lico: [52.57, 48.1, 43.15],
};
export function residentDisplayCell(r: Pick<Resident, "id" | "pose" | "left">) {
  if (r.pose !== "tea") return residentArt.displayCell;
  const widths = residentHeadWidths[r.id];
  return Math.round((residentArt.displayCell * widths[0]) / widths[r.left ? 2 : 1] / 2) * 2;
}

// The saved footprint and approach cells stay stable. Draw the smaller table
// and its six chairs around the same floor anchor, including the far seat.
export const homeFurnitureScale = 0.84;
export const workBenchOffset = (id: ResidentId) => ({
  x: residentHand(id) === "left" ? 8 : -8,
  y: -8,
});
// Reach over the side rim so the spout points into the soil, not at the front board.
export const gardenOffset = (id: ResidentId) => ({
  x: residentHand(id) === "left" ? -2 : 2,
  y: -8,
});
export function teaChairPosition(item: Furniture, seat: number) {
  const point = cellPoint(furnitureSpots(item)[seat]);
  const x = (item.x + furnitureCatalog.table.w / 2) * 24;
  const y = (item.y + furnitureCatalog.table.h) * 24 - 11;
  return {
    x: x + (point.x - x) * homeFurnitureScale,
    y: y + (point.y + teaSeatOffset(seat) - y) * homeFurnitureScale,
  };
}
export function residentDisplayPosition(r: Resident, furniture: Furniture[]) {
  if (r.pose === "garden" && furniture.some((f) => f.id === r.furniture && f.kind === "plot")) {
    const offset = gardenOffset(r.id);
    return { x: r.x + offset.x, y: r.y + offset.y };
  }
  if (
    ["craft", "paper"].includes(r.pose) &&
    furniture.some((f) => f.id === r.furniture && ["bench", "desk"].includes(f.kind))
  ) {
    const offset = workBenchOffset(r.id);
    return { x: r.x + offset.x, y: r.y + offset.y };
  }
  const table =
    r.pose === "tea"
      ? furniture.find((f) => f.id === r.furniture && f.kind === "table")
      : undefined;
  if (!table) return { x: r.x, y: r.y };
  const approach = cellPoint(furnitureSpots(table)[r.seat]);
  const chair = teaChairPosition(table, r.seat);
  return { x: chair.x + (r.x - approach.x), y: chair.y + (r.y - approach.y) };
}
