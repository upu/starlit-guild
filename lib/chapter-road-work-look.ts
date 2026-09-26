import { chapterThreeWorkFrame } from "./chapter-three-work-art.ts";
import { BREKKA_ARRIVAL_QUEST, LICO_RECORDS_QUEST, MOSS_BEDS_QUEST } from "./chapter-four.ts";
import { encounter, targetName, type Quest, type Run } from "./game.ts";
import { movingWork } from "./chapter-road.ts";

export function roadWorkLook(q: Quest, run: Run) {
  const label = targetName(q, run.node, run.nodes);
  if (q.id === MOSS_BEDS_QUEST) return mossSurveyLook(run.node, label);
  const third = chapterThreeWorkFrame(q.id, run.node);
  if ((q.id === "spinning-signpost" && !movingWork(q, run)) || third === "signpost")
    return { asset: "/animations/road/signpost-v2.webp", label, cargo: false, frame: "signpost" };
  if (q.escortAsset) return { asset: q.escortAsset, label, cargo: false, frame: undefined };
  if (movingWork(q, run))
    return { asset: "/animations/road/cargo-v1.webp", label, cargo: true, frame: undefined };
  if (isLedgerWork(q, run))
    return { asset: "/animations/road/ledger-desk-v1.webp", label, cargo: false, frame: "ledger" };
  if (third === "stonework" || third === "records")
    return { asset: "/animations/road/berne-worksites-v1.webp", label, cargo: false, frame: third };
  const terrain = terrainWorksite(q.id, label);
  if (terrain) return terrain;
  if (encounter(q, run.node) === "gather")
    return { asset: "/animations/road/herb-v2.webp", label, cargo: false, frame: undefined };
  return worksite("parcels", label);
}
function mossSurveyLook(node: number, label: string) {
  if (node % 3 === 2)
    return {
      asset: "/animations/road/berne-worksites-v1.webp",
      label,
      cargo: false,
      frame: "records",
    };
  return worksite(node % 3 === 0 ? "moss" : "waterway", label);
}
function isLedgerWork(q: Quest, run: Run) {
  return (
    [BREKKA_ARRIVAL_QUEST, LICO_RECORDS_QUEST].includes(q.id) && encounter(q, run.node) === "gather"
  );
}
function worksite(frame: string, label: string) {
  return { asset: "/animations/road/worksites-v1.webp", frame, label, cargo: false };
}

function terrainWorksite(quest: string, label: string) {
  const waterway = ["old-waterway", "tower-restoration", "tower-moss-removal"].includes(quest);
  const moss = quest === "forest-wetland" || (waterway && /苔|葉|籠/.test(label));
  if (moss) return worksite("moss", label);
  if (waterway) return worksite("waterway", label);
  return null;
}
