import type { RoomSite } from "./home-room-layout.ts";

export function homeFloor(site: RoomSite, x: number, y: number) {
  if (site === "home") return { tile: y < 2 ? 4 : y === 2 ? 5 : 0, tint: 0xffffff };
  if (site === "linde") return { tile: y < 3 || x === 7 || x === 8 ? 2 : 3, tint: 0xfff3cd };
  return { tile: y < 3 || x === 4 || x === 5 || y === 4 ? 1 : 3, tint: 0x94b7a0 };
}
// Scenery stays behind the non-walkable north edge. Usable plots still use the
// shared tile occupancy and tap model; these decorations never block a route.
export const gardenScenery = {
  linde: [
    { frame: 0, x: 100, y: 72, width: 120 },
    { frame: 1, x: 293, y: 72, width: 62 },
  ],
  brekka: [
    { frame: 2, x: 102, y: 73, width: 80 },
    { frame: 3, x: 284, y: 72, width: 136 },
  ],
};
