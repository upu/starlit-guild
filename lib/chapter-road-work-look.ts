import { encounter, targetName, type Quest, type Run } from "./game.ts";
import { movingWork } from "./chapter-road.ts";

export function roadWorkLook(q: Quest, run: Run) {
  const label = targetName(q, run.node, run.nodes);
  if (q.escortAsset) return { asset: q.escortAsset, label, cargo: false, frame: undefined };
  const waterway = ["old-waterway", "tower-restoration", "tower-moss-removal"].includes(q.id);
  const moss = q.id === "forest-wetland" || (waterway && /苔|葉|籠/.test(label));
  if (moss) return worksite("moss", label);
  if (waterway) return worksite("waterway", label);
  if (movingWork(q, run))
    return { asset: "/animations/road/cargo-v1.png", label, cargo: true, frame: undefined };
  if (encounter(q, run.node) === "gather")
    return { asset: "/animations/road/herb-v2.png", label, cargo: false, frame: undefined };
  return worksite("parcels", label);
}
function worksite(frame: string, label: string) {
  return { asset: "/animations/road/worksites-v1.png", frame, label, cargo: false };
}
