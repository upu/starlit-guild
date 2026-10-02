export const ROOM = { columns: 16, rows: 13, tile: 24, width: 384, height: 312 };
export const furnitureKinds = [
  "table",
  "bench",
  "desk",
  "bookcase",
  "plant",
  "rug",
  "plot",
] as const;
export type FurnitureKind = (typeof furnitureKinds)[number];
export type RoomSite = "home" | "linde" | "brekka";
export type Cell = { x: number; y: number };
export type Furniture = Cell & { id: string; kind: FurnitureKind };
export const furnitureCatalog: Record<
  FurnitureKind,
  { name: string; w: number; h: number; frame: number; solid: boolean }
> = {
  table: { name: "6人掛けのテーブル", w: 6, h: 4, frame: 0, solid: true },
  bench: { name: "作業台", w: 3, h: 2, frame: 4, solid: true },
  desk: { name: "旅団の事務机", w: 3, h: 2, frame: 3, solid: true },
  bookcase: { name: "本棚", w: 2, h: 1, frame: 5, solid: true },
  plant: { name: "観葉植物", w: 1, h: 1, frame: 9, solid: true },
  rug: { name: "星のラグ", w: 3, h: 2, frame: 11, solid: false },
  plot: { name: "プランター", w: 4, h: 2, frame: 6, solid: true },
};
export const defaultHome: Furniture[] = [
  { id: "tea", kind: "table", x: 3, y: 7 },
  { id: "bench", kind: "bench", x: 11, y: 3 },
  { id: "desk", kind: "desk", x: 6, y: 3 },
  { id: "books", kind: "bookcase", x: 1, y: 3 },
  { id: "fern", kind: "plant", x: 14, y: 10 },
  { id: "rug", kind: "rug", x: 10, y: 10 },
];
export function roomFurniture(site: RoomSite, home?: Furniture[]): Furniture[] {
  if (site === "home") return home ?? defaultHome;
  const plots: Furniture[] =
    site === "linde"
      ? [
          { id: "linde-1", kind: "plot", x: 2, y: 6 },
          { id: "linde-2", kind: "plot", x: 9, y: 9 },
        ]
      : [{ id: "brekka-1", kind: "plot", x: 6, y: 7 }];
  return [...plots, { id: "garden-fern", kind: "plant", x: 13, y: 4 }];
}
export function furnitureCells(item: Furniture): Cell[] {
  const { w, h } = furnitureCatalog[item.kind];
  return Array.from({ length: w * h }, (_, n) => ({
    x: item.x + (n % w),
    y: item.y + Math.floor(n / w),
  }));
}
export function blockedCells(items: Furniture[]) {
  return new Set(
    items
      .filter((f) => furnitureCatalog[f.kind].solid)
      .flatMap(furnitureCells)
      .map(cellKey),
  );
}
export const cellKey = (cell: Cell) => `${String(cell.x)},${String(cell.y)}`;
export const cellPoint = (cell: Cell): Cell => ({
  x: (cell.x + 0.5) * ROOM.tile,
  y: (cell.y + 0.5) * ROOM.tile,
});
export function withinRoom(cell: Cell) {
  return cell.x >= 0 && cell.x < ROOM.columns && cell.y >= 3 && cell.y < ROOM.rows;
}
export function furnitureSpots(item: Furniture): Cell[] {
  const { w, h } = furnitureCatalog[item.kind];
  if (item.kind === "table")
    return [
      [-1, 1],
      [w, 1],
      [-1, 3],
      [w, 3],
      [2, -1],
      [2, h],
    ].map(([x, y]) => ({ x: item.x + x, y: item.y + y }));
  if (item.kind === "plot") return [{ x: item.x + w, y: item.y + h - 1 }];
  if (item.kind === "bench" || item.kind === "desk") return [{ x: item.x - 1, y: item.y + h - 1 }];
  return [{ x: item.x + Math.floor(w / 2), y: item.y + h }];
}
export function roomPath(start: Cell, end: Cell, items: Furniture[]): Cell[] | null {
  const blocked = blockedCells(items),
    queue = [start];
  const parent = new Map<string, Cell | null>([[cellKey(start), null]]);
  for (let i = 0; i < queue.length; i++) {
    const cell = queue[i];
    if (cellKey(cell) === cellKey(end)) return reconstructPath(cell, parent);
    for (const next of neighboringCells(cell)) {
      const key = cellKey(next);
      if (!withinRoom(next) || blocked.has(key) || parent.has(key)) continue;
      parent.set(key, cell);
      queue.push(next);
    }
  }
  return null;
}
function reconstructPath(end: Cell, parents: Map<string, Cell | null>) {
  const path: Cell[] = [];
  let point: Cell | null = end;
  while (point) {
    path.unshift(point);
    point = parents.get(cellKey(point)) ?? null;
  }
  return path.slice(1);
}
export function layoutError(items: Furniture[]): string | null {
  if (items.length > 24 || new Set(items.map((f) => f.id)).size !== items.length)
    return "家具が多すぎます";
  if (items.flatMap(furnitureCells).some((cell) => !withinRoom(cell)))
    return "部屋の内側に置いてください";
  const solid = items
    .filter((item) => furnitureCatalog[item.kind].solid)
    .flatMap(furnitureCells)
    .map(cellKey);
  const occupied = new Set(solid);
  if (solid.length !== occupied.size) return "ほかの家具と重なっています";
  const door = { x: 8, y: 12 };
  if (occupied.has(cellKey(door))) return "入口を空けてください";
  const usable = items.filter((f) => ["table", "bench", "desk", "plot"].includes(f.kind));
  if (usable.some((f) => furnitureSpots(f).some((cell) => !roomPath(door, cell, items))))
    return "家具までの通路を空けてください";
  return null;
}

function neighboringCells(cell: Cell): Cell[] {
  return [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].map(([dx, dy]) => ({ x: cell.x + dx, y: cell.y + dy }));
}
