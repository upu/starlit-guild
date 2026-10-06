import { furnitureCatalog, type Furniture } from "./home-room-layout.ts";

export type HomeMarker = { id: string; control: string; label: string; hero?: string };
export function homeMarkerPoint(items: Furniture[], id: string) {
  const item = items.find((f) => f.id === id);
  if (!item) return null;
  const size = furnitureCatalog[item.kind];
  return { x: (item.x + size.w / 2) * 24, y: (item.y + size.h) * 24 - 24 };
}
