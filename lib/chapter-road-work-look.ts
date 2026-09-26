import { MOSS_BEDS_QUEST } from "./chapter-four.ts";
import { encounter, targetName, type Quest, type Run } from "./game.ts";
import { movingWork } from "./chapter-road.ts";
import { worksiteArt, type WorksiteArt } from "./road-worksite-art.ts";
import { worksiteByLabel } from "./road-worksite-catalog.ts";

export function roadWorkLook(q: Quest, run: Run): WorksiteArt & { label: string } {
  const label = targetName(q, run.node, run.nodes);
  const key = worksiteByLabel[label];
  const art = key ? worksiteArt[key] : fallbackWorkArt(q, run);
  const task = movingWork(q, run) ? "carry" : q.id === MOSS_BEDS_QUEST ? "inspect" : art.task;
  return { ...art, label, task };
}

// Compatibility for non-story quests. Every story work point is checked against the catalog.
function fallbackWorkArt(q: Quest, run: Run): WorksiteArt {
  if (q.escortAsset) return { asset: q.escortAsset, cargo: false, task: "inspect" };
  if (movingWork(q, run)) return worksiteArt.cart;
  return encounter(q, run.node) === "gather" ? worksiteArt.herb : worksiteArt.parcels;
}
