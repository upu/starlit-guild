import { roadDepth, roadScale, roadX } from "./road-layout.ts";
import { roadTravellerCanMove, type RoadBattle, type Traveller } from "./road-view.ts";

type Point = { x: number; lane: number };
type View = { width: number; height: number };

function stepTo(hero: Traveller, previous: Point, view: View, stage: string, dt: number) {
  const scale = roadScale(view.width, stage);
  const depth = roadDepth(view.width, view.height);
  const dx = (hero.x - previous.x) * scale;
  const dy = (hero.lane - previous.lane) * depth;
  const distance = Math.hypot(dx, dy);
  const step = distance ? Math.min(1, (110 * dt) / distance) : 1;
  hero.x = previous.x + (dx * step) / scale;
  hero.lane = previous.lane + (dy * step) / depth;
  if (step < 1) {
    hero.walking = true;
    if (Math.abs(dx) > 1) hero.facing = dx < 0 ? -1 : 1;
  }
  return step === 1;
}

/** Rejoin the ordinary party movement from the feet used during the handoff. */
export class TownHandoffSync {
  private feet = new Map<string, Point>();
  private returning = false;

  update(
    battle: RoadBattle,
    view: View,
    dt: number,
    reduced: boolean,
    reset: boolean,
    positions: Map<string, Point>,
    feet: Map<string, Point>,
  ) {
    if (reset || reduced) {
      this.feet.clear();
      this.returning = false;
    }
    if (battle.townParcelHandoff) {
      this.remember(battle);
    } else if (this.returning) {
      this.rejoin(battle, view, dt);
    }
    if (!battle.townParcelHandoff && !this.returning) return;
    this.sync(battle, view, positions, feet);
  }

  private remember(battle: RoadBattle) {
    this.returning = true;
    for (const hero of battle.heroes)
      if (hero.id === "aria" || hero.id === "leon")
        this.feet.set(hero.id, { x: hero.x, lane: hero.lane });
  }

  private rejoin(battle: RoadBattle, view: View, dt: number) {
    this.removeMissing(battle);
    for (const hero of battle.heroes) {
      const previous = this.feet.get(hero.id);
      if (!previous) continue;
      if (!roadTravellerCanMove(hero) || hero.paralyzed) {
        this.feet.delete(hero.id);
        continue;
      }
      if (stepTo(hero, previous, view, battle.stage, dt)) this.feet.delete(hero.id);
      else this.feet.set(hero.id, { x: hero.x, lane: hero.lane });
    }
    this.returning = this.feet.size > 0;
  }

  private removeMissing(battle: RoadBattle) {
    for (const id of this.feet.keys())
      if (!battle.heroes.some((hero) => hero.id === id)) this.feet.delete(id);
  }

  private sync(
    battle: RoadBattle,
    view: View,
    positions: Map<string, Point>,
    feet: Map<string, Point>,
  ) {
    for (const hero of battle.heroes) {
      if (hero.id !== "aria" && hero.id !== "leon") continue;
      positions.set(hero.id, {
        x: (roadX(hero.x, battle.distance, view.width, battle.stage) / view.width) * 560,
        lane: hero.lane,
      });
      feet.set(hero.id, { x: hero.x, lane: hero.lane });
    }
  }
}
