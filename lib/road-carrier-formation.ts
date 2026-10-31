import { MOSS_TRANSPLANT_QUEST } from "./chapter-four.ts";
import { roadHasEnemies, roadWorkOffset, roadPuller, movingWork } from "./chapter-road.ts";
import { paralyzed } from "./chapter-four-battles.ts";
import type { Quest, Run } from "./game.ts";
import type { RoadBattle } from "./road-view.ts";
import { roadCartSlot, type RoadViewport } from "./road-cart-layout.ts";
import { roadHeroSize, roadScale } from "./road-layout.ts";
import type { RoadLook } from "./chapter-road-presentation.ts";
import { usesStorybookCart } from "./road-storybook-work.ts";
import { seedlingCarrierPair } from "./road-seedling-cart-start.ts";

function orderedEscorts(heroes: RoadBattle["heroes"], carriers: string[], reorder: boolean) {
  const escorts = heroes.filter((hero) => !carriers.includes(hero.id));
  // Keep Lico in the near row and Mira in the far row after a skirmish,
  // so they do not need to exchange sides across the cart on the way back.
  if (reorder) {
    const order = ["mira", "lico", "leon"];
    escorts.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }
  return escorts;
}

export function arrangeCarriers(
  q: Quest,
  run: Run,
  battle: RoadBattle,
  front: string[],
  view: RoadViewport,
  look: RoadLook,
) {
  if (!front.length || roadHasEnemies(run)) return [];
  const seedlings = !!look.work?.asset.includes("seedling-cart");
  const painted = usesStorybookCart(look);
  const seedlingFormation = !!seedlingCarrierPair({ battle, look });
  const rearOrder = painted
    ? ["aria", "leon", "finn", "mira", "lico"]
    : ["leon", "finn", "aria", "mira", "lico"];
  const rear = rearOrder.find(
    (id) => !front.includes(id) && battle.heroes.some((hero) => hero.id === id && hero.hp > 0),
  );
  const carriers = [...front, ...(rear ? [rear] : [])];
  const escorts = orderedEscorts(battle.heroes, carriers, seedlingFormation);
  const spacing = roadHeroSize(view.width, view.height) / roadScale(view.width, battle.stage);
  for (const hero of battle.heroes) {
    const slot = roadCartSlot(
      view,
      battle.stage,
      seedlings,
      front.includes(hero.id),
      painted,
      hero.id,
    );
    if (!carriers.includes(hero.id)) {
      const index = escorts.indexOf(hero);
      // Companions walk beside and behind the cart; they do not push thin air.
      slot.offset -= spacing * (0.8 + Math.floor(index / 2) * 0.8);
      slot.lane = index % 2 === 0 ? 0.48 : 1.08;
    }
    hero.x = carrierX(
      hero,
      q,
      run,
      battle,
      look,
      painted,
      carriers,
      slot.offset,
      seedlingFormation,
    );
    hero.lane = slot.lane;
  }
  return carriers;
}

function carrierX(
  hero: RoadBattle["heroes"][number],
  q: Quest,
  run: Run,
  battle: RoadBattle,
  look: RoadLook,
  painted: boolean,
  carriers: string[],
  offset: number,
  seedlingFormation: boolean,
) {
  // Ready hands attach to the cart instead of retaining arrival tolerance.
  if (
    battle.gathering &&
    (seedlingFormation || (painted && carriers.includes(hero.id) && look.workers.includes(hero.id)))
  )
    return battle.gathering.x + 65 + offset;
  return hero.x - 40 + offset - roadWorkOffset(q, run, hero.id);
}

export function roadCarrierLead(q: Quest, run: Run | null, painted = false) {
  if (!run) return null;
  const preferred = seedlingOpeningLead(q, run, painted) ?? roadPuller(q, run);
  return preferred &&
    run.quest === MOSS_TRANSPLANT_QUEST &&
    run.actors.some((actor) => actor.hero === "finn") &&
    run.health.finn.hp > 0
    ? "finn"
    : preferred;
}
function seedlingOpeningLead(q: Quest, run: Run, painted: boolean) {
  return painted &&
    q.id === MOSS_TRANSPLANT_QUEST &&
    run.phase === "move" &&
    movingWork(q, run) &&
    !roadHasEnemies(run) &&
    ["aria", "finn"].every((id) =>
      run.actors.some(
        (actor) =>
          actor.hero === id &&
          run.health[id].hp > 0 &&
          !paralyzed(actor, run.road?.at ?? run.nextAt),
      ),
    )
    ? "finn"
    : null;
}
