import type { RoadLook } from "./chapter-road-presentation.ts";
import { roadX } from "./road-layout.ts";
import type { RoadBattle, RoadEnemy, Traveller } from "./road-view.ts";

type Position = { x: number; lane: number };
type Frame = { battle: RoadBattle; look: RoadLook };

function approach(current: number, target: number, dt: number, speed: number) {
  const step = (target - current) * (1 - Math.exp(-dt / 0.1));
  return current + Math.sign(step) * Math.min(Math.abs(step), speed * dt);
}

function roaming(hero: Traveller, battle: RoadBattle, working: boolean): Position {
  if (working || hero.hp <= 0 || hero.paralyzed || battle.scene || battle.phase !== "journey")
    return { x: hero.x, lane: hero.lane };
  const enemy = battle.enemies
    .filter((item) => item.hp > 0 && item.kind !== "pumpety")
    .sort((a, b) => Math.abs(a.x - hero.x) - Math.abs(b.x - hero.x))
    .at(0);
  if (!hero.walking && !enemy) return { x: hero.x, lane: hero.lane };
  return roamingTarget(hero, battle, enemy);
}

function attackStep(hero: Traveller, battle: RoadBattle, melee: boolean) {
  const strike = battle.effects.findLast(
    (effect) => effect.hero === hero.id && ["slash", "arrow", "magic"].includes(effect.kind),
  );
  const age = strike ? battle.time - strike.at : -1;
  return age >= 0 && age < 600 ? Math.sin((age / 600) * Math.PI) * (melee ? 34 : 10) : 0;
}

function roamingTarget(hero: Traveller, battle: RoadBattle, enemy?: RoadEnemy): Position {
  const index = ["aria", "leon", "mira", "finn", "lico"].indexOf(hero.id);
  const beat = battle.time / 1000 + index * 1.7;
  const melee = hero.id === "leon" || hero.id === "finn";
  const lane = enemy && melee ? enemy.lane + (hero.id === "leon" ? 0.1 : -0.2) : hero.lane;
  const lunge = attackStep(hero, battle, melee);
  return {
    x: hero.x + Math.sin(beat * 0.9) * (enemy ? 24 : 36) + hero.facing * lunge,
    lane: Math.max(0.3, Math.min(0.98, lane + Math.sin(beat * 0.7) * (enemy ? 0.16 : 0.23))),
  };
}

function followEffects(before: Traveller[], battle: RoadBattle) {
  battle.effects = battle.effects.map((effect) => {
    const source = before.find((hero) => hero.x === effect.fromX && hero.lane === effect.fromLane);
    const target = before.find((hero) => hero.x === effect.x && hero.lane === effect.lane);
    const from = battle.heroes.find((hero) => hero.id === source?.id);
    const to = battle.heroes.find((hero) => hero.id === target?.id);
    return {
      ...effect,
      ...(from ? { fromX: from.x, fromLane: from.lane } : {}),
      ...(to ? { x: to.x, lane: to.lane } : {}),
    };
  });
}

// Renderer-owned continuity only. Never persist these positions or use them for combat range.
export class RoadMotion {
  private key = "";
  private at = 0;
  private camera = 0;
  private positions = new Map<string, Position>();

  update(frame: Frame, key: string, width: number, reduced = false): Frame {
    const { battle: raw, look } = frame;
    // React snapshots can correct the projected clock backwards by a few milliseconds.
    // Only a different adventure (or reduced motion) may discard the visible position.
    const reset = key !== this.key || reduced;
    if (reset) this.positions.clear();
    const dt = Math.max(0, Math.min(0.05, (raw.time - this.at) / 1000));
    this.camera = reset ? raw.distance : approach(this.camera, raw.distance, dt, 360);
    this.key = key;
    this.at = raw.time;
    const battle = { ...raw, distance: this.camera };
    const workers = new Set(look.workers);
    battle.heroes = raw.heroes.map((hero) => {
      const target = reduced ? hero : roaming(hero, raw, workers.has(hero.id));
      const drawn = this.moveHero(hero, target, battle, width, dt);
      if (Math.abs(drawn.x - target.x) > 5 || Math.abs(drawn.lane - target.lane) > 0.02)
        workers.delete(hero.id);
      return drawn;
    });
    for (const id of this.positions.keys())
      if (!raw.heroes.some((hero) => hero.id === id)) this.positions.delete(id);
    followEffects(raw.heroes, battle);
    return { battle, look: { ...look, workers: [...workers] } };
  }

  private moveHero(
    hero: Traveller,
    target: Position,
    battle: RoadBattle,
    width: number,
    dt: number,
  ): Traveller {
    // Width-normalized screen positions also absorb camera/forest-to-puppet framing changes.
    const x = (roadX(target.x, battle.distance, width, battle.stage) / width) * 560;
    const previous = this.positions.get(hero.id);
    const position = {
      x: previous ? approach(previous.x, x, dt, 280) : x,
      lane: previous ? approach(previous.lane, target.lane, dt, 0.9) : target.lane,
    };
    this.positions.set(hero.id, position);
    const moving = Math.abs(x - position.x) > 2 || Math.abs(target.lane - position.lane) > 0.012;
    const scale = Math.min(1.1, width / (battle.stage === "puppets" ? 800 : 560));
    const origin = roadX(0, battle.distance, width, battle.stage);
    return {
      ...hero,
      x: ((position.x / 560) * width - origin) / scale,
      lane: position.lane,
      facing:
        moving && !battle.enemies.some((enemy) => enemy.hp > 0) && Math.abs(x - position.x) > 3
          ? x > position.x
            ? 1
            : -1
          : hero.facing,
      walking: hero.hp > 0 && !hero.paralyzed && (hero.walking || moving),
    };
  }
}
