import {
  cellPoint,
  furnitureCatalog,
  furnitureSpots,
  teaSeatOffset,
  type Furniture,
} from "./home-room-layout.ts";
import type { Resident } from "./home-room-life.ts";
import { residentHand, type ResidentId } from "./home-actor.ts";

// The saved footprint and approach cells stay stable. Draw the smaller table
// and its six chairs around the same floor anchor, including the far seat.
export const homeFurnitureScale = 0.84;
export const workBenchOffset = (id: ResidentId) => ({
  x: residentHand(id) === "left" ? 8 : -8,
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
  if (r.pose === "craft" && furniture.some((f) => f.id === r.furniture && f.kind === "bench")) {
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
