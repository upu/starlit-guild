import { furnitureCatalog, type Furniture } from "./home-room-layout.ts";

export type HomeMarkerStatus = {
  text: string;
  warning: boolean;
  progress?: number;
  remaining?: string;
};
export type HomeMarker = {
  id: string;
  control: string;
  label: string;
  hero?: string;
  status?: HomeMarkerStatus;
};
export function homeMarkerPoint(items: Furniture[], id: string) {
  const item = items.find((f) => f.id === id);
  if (!item) return null;
  const size = furnitureCatalog[item.kind];
  if (item.kind === "plot") return { x: (item.x + size.w) * 24, y: item.y * 24 - 12 };
  // The worker stands in front of the bench. Keep the entry on its far-right
  // corner, leaving the head and hands visible below the tabletop.
  return {
    x: (item.x + size.w / 2) * 24 + (item.kind === "bench" ? 40 : 0),
    y: (item.y + size.h) * 24 - (item.kind === "bench" ? 48 : 24),
  };
}
