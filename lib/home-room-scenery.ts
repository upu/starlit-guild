import type { RoomSite } from "./home-room-layout.ts";

// Keep generation and preloading aligned. Omitted cells belong to retired scenery/effects.
export const homeStaticFrames = {
  prop: [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11],
  tile: [0, 1, 2, 3, 4, 5],
  icons: [0, 1, 2],
  decor: [1, 2, 3, 4, 5],
} as const;

export function homeFloor(site: RoomSite, x: number, y: number) {
  if (site === "home") return { tile: y < 2 ? 4 : y === 2 ? 5 : 0, tint: 0xffffff };
  if (site === "linde") return { tile: y < 3 || x === 7 || x === 8 ? 2 : 3, tint: 0xfff3cd };
  return { tile: y < 3 || x === 4 || x === 5 || y === 4 ? 1 : 3, tint: 0x94b7a0 };
}
// Scenery stays behind the non-walkable north edge. Usable plots still use the
// shared tile occupancy and tap model; these decorations never block a route.
const boundary = [42, 142, 242, 342].map((x) => ({ frame: 3, x, y: 58, width: 104 }));
export const gardenScenery = {
  linde: [...boundary, { frame: 1, x: 302, y: 72, width: 48 }],
  brekka: [
    ...boundary,
    { frame: 2, x: 90, y: 72, width: 80 },
    { frame: 1, x: 302, y: 72, width: 48 },
  ],
};
