import { MOSS_TRANSPLANT_QUEST } from "./chapter-four.ts";
import { roadHasEnemies, roadWorkOffset, roadPuller } from "./chapter-road.ts";
import type { Quest, Run } from "./game.ts";
import type { RoadBattle } from "./road-view.ts";
import { roadCartSlot, type RoadViewport } from "./road-cart-layout.ts";
import { roadHeroSize, roadScale } from "./road-layout.ts";

export function arrangeCarriers(
  q: Quest,
  run: Run,
  battle: RoadBattle,
  front: string[],
  view: RoadViewport,
  seedlings: boolean,
) {
  if (!front.length || roadHasEnemies(run)) return [];
  const rear = ["leon", "finn", "aria", "mira", "lico"].find(
    (id) => !front.includes(id) && battle.heroes.some((hero) => hero.id === id && hero.hp > 0),
  );
  const carriers = [...front, ...(rear ? [rear] : [])];
  const escorts = battle.heroes.filter((hero) => !carriers.includes(hero.id));
  const spacing = roadHeroSize(view.width, view.height) / roadScale(view.width, battle.stage);
  for (const hero of battle.heroes) {
    const slot = roadCartSlot(view, battle.stage, seedlings, front.includes(hero.id));
    if (!carriers.includes(hero.id)) {
      const index = escorts.indexOf(hero);
      // Companions walk beside and behind the cart; they do not push thin air.
      slot.offset -= spacing * (0.8 + Math.floor(index / 2) * 0.8);
      slot.lane = index % 2 === 0 ? 0.48 : 1.08;
    }
    hero.x += -40 + slot.offset - roadWorkOffset(q, run, hero.id);
    hero.lane = slot.lane;
  }
  return carriers;
}

export function roadCarrierLead(q: Quest, run: Run | null) {
  if (!run) return null;
  const preferred = roadPuller(q, run);
  return preferred &&
    run.quest === MOSS_TRANSPLANT_QUEST &&
    run.actors.some((actor) => actor.hero === "finn") &&
    run.health.finn.hp > 0
    ? "finn"
    : preferred;
}
