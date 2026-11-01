import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { HandheldItem, HandheldView } from "./road-handheld.ts";

export const forestHandheld = (look?: RoadLook) =>
  !!look?.storybookHeroes && look.quest === "forest-wetland" && !look.forestReturn?.scene;

export function forestWorkReady(
  battle: RoadBattle,
  look: RoadLook,
  view: HandheldView,
  items: HandheldItem[],
  previous?: Traveller,
) {
  if (!forestHandheld(look) || !battle.gathering || !look.workers.includes("aria")) return false;
  const item = items.find((i) => i.kind === "forest-moss-jar");
  // A later work point must not interrupt the return to a previous jar.
  if (!item || item.returning || item.phase === "lift") return false;
  if (item.phase !== "held") return true;
  const target = battle.heroes.find((hero) => hero.id === "aria");
  if (!previous || !target) return false;
  const dx = (previous.x - target.x) * roadScale(view.width, battle.stage);
  const dy = (previous.lane - target.lane) * roadDepth(view.width, view.height);
  return Math.hypot(dx, dy) <= roadHeroSize(view.width, view.height) * 0.65;
}
