import { isChapterThreeQuest } from "./chapter-three.ts";
import { encounter, targetName, type Quest, type Run } from "./game.ts";
import { movingWork } from "./chapter-road.ts";

export function roadWorkLook(q: Quest, run: Run) {
  const label = targetName(q, run.node, run.nodes);
  if (q.id === "spinning-signpost" && !movingWork(q, run))
    return { asset: "/animations/road/signpost-v2.webp", label, cargo: false, frame: "signpost" };
  if (q.escortAsset) return { asset: q.escortAsset, label, cargo: false, frame: undefined };
  if (movingWork(q, run))
    return { asset: "/animations/road/cargo-v1.webp", label, cargo: true, frame: undefined };
  if (isChapterThreeQuest(q.id) && /石|溝|根|柵|区画図/.test(label))
    return worksite("waterway", label);
  const waterway = ["old-waterway", "tower-restoration", "tower-moss-removal"].includes(q.id);
  const moss = q.id === "forest-wetland" || (waterway && /苔|葉|籠/.test(label));
  if (moss) return worksite("moss", label);
  if (waterway) return worksite("waterway", label);
  if (encounter(q, run.node) === "gather")
    return { asset: "/animations/road/herb-v2.webp", label, cargo: false, frame: undefined };
  return worksite("parcels", label);
}
function worksite(frame: string, label: string) {
  return { asset: "/animations/road/worksites-v1.webp", frame, label, cargo: false };
}
