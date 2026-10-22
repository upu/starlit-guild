import type { RoadLook } from "./chapter-road-presentation.ts";
import { roadScale, roadX } from "./road-layout.ts";
import type { RoadBattle, RoadEnemy, Traveller } from "./road-view.ts";
import {
  avoidPartyStep,
  partyClearance,
  partyFootClearance,
  spacedPartyTargets,
  type PartyTarget,
} from "./road-party-spacing.ts";

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

function outsideEnemy(
  hero: Traveller,
  battle: RoadBattle,
  target: RoadEnemy | undefined,
  x: number,
) {
  if (!target) return x;
  // Saved melee range measures point positions. Sway plus a lunge must not
  // put the drawn torso inside the enemy; large bodies need more room.
  const ahead = battle.enemies.filter(
    (e) =>
      e.hp > 0 && e.kind !== "pumpety" && (e.id === target.id || (e.x - hero.x) * hero.facing >= 0),
  );
  return ahead.reduce((position, enemy) => {
    const gap = enemy.boss || enemy.kind === "golem" ? 120 : 75;
    return hero.facing > 0 ? Math.min(position, enemy.x - gap) : Math.max(position, enemy.x + gap);
  }, x);
}

function roamingTarget(hero: Traveller, battle: RoadBattle, enemy?: RoadEnemy): Position {
  const index = ["aria", "leon", "mira", "finn", "lico"].indexOf(hero.id);
  const beat = battle.time / 1000 + index * 1.7;
  const melee = hero.id === "leon" || hero.id === "finn";
  const lane = enemy && melee ? enemy.lane + (hero.id === "leon" ? 0.1 : -0.2) : hero.lane;
  const lunge = attackStep(hero, battle, melee);
  return {
    x: outsideEnemy(
      hero,
      battle,
      enemy,
      hero.x + Math.sin(beat * 0.9) * (enemy ? 24 : 36) + hero.facing * lunge,
    ),
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

function carryingCart(battle: RoadBattle) {
  return (
    battle.gathering?.kind === "cargo" &&
    battle.gathering.task === "carry" &&
    !battle.enemies.some((enemy) => enemy.hp > 0)
  );
}

function partyTargets(frame: Frame, camera: number, width: number, reduced: boolean) {
  const { battle, look } = frame;
  const carrying = carryingCart(battle);
  return battle.heroes.map((hero): PartyTarget => {
    const working = look.workers.includes(hero.id);
    // Escort lanes are part of the cart formation too.
    const target = reduced ? hero : roaming(hero, battle, working || carrying);
    return {
      ...target,
      id: hero.id,
      facing: hero.facing,
      fixed: working || hero.hp <= 0 || !!hero.paralyzed,
      x: (roadX(target.x, camera, width, battle.stage) / width) * 560,
    };
  });
}

function atWorkPosition(drawn: Traveller, original: Traveller, width: number, battle: RoadBattle) {
  // Allow the small horizontal lag of a moving cart, but never use a work pose
  // while taking a different lane around a companion.
  const dx = Math.abs(drawn.x - original.x) * roadScale(width, battle.stage);
  return (
    dx <= (carryingCart(battle) ? 12 : width / 280) && Math.abs(drawn.lane - original.lane) <= 0.02
  );
}

function stepFacing(
  hero: Traveller,
  previous: Position | undefined,
  position: Position,
  battle: RoadBattle,
) {
  const dx = previous ? position.x - previous.x : 0;
  if (Math.abs(dx) < 0.1 || battle.enemies.some((enemy) => enemy.hp > 0)) return hero.facing;
  return dx > 0 ? 1 : -1;
}

// Renderer-owned continuity only. Never persist these positions or use them for combat range.
export class RoadMotion {
  private key = "";
  private at = 0;
  private camera = 0;
  private positions = new Map<string, Position>();

  update(frame: Frame, key: string, width: number, reduced = false, height = 320): Frame {
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
    for (const id of this.positions.keys())
      if (!raw.heroes.some((hero) => hero.id === id)) this.positions.delete(id);
    const gap = partyClearance(width, height);
    const targets = spacedPartyTargets(partyTargets(frame, battle.distance, width, reduced), gap);
    battle.heroes = this.moveParty(targets, battle, width, dt, partyFootClearance(width, height));
    const workers = look.workers.filter((id) => {
      const original = raw.heroes.find((hero) => hero.id === id);
      const drawn = battle.heroes.find((hero) => hero.id === id);
      return original && drawn && atWorkPosition(drawn, original, width, battle);
    });
    if (carryingCart(raw)) this.faceAlongCart(battle, raw, width);
    followEffects(raw.heroes, battle);
    return { battle, look: { ...look, workers } };
  }

  private faceAlongCart(battle: RoadBattle, raw: RoadBattle, width: number) {
    for (const drawn of battle.heroes) {
      const original = raw.heroes.find((hero) => hero.id === drawn.id);
      if (original && atWorkPosition(drawn, original, width, battle)) drawn.facing = 1;
    }
  }

  private moveParty(
    targets: PartyTarget[],
    battle: RoadBattle,
    width: number,
    dt: number,
    gap: Position,
  ) {
    const placed = new Map<string, Traveller>();
    for (const target of targets) {
      const hero = battle.heroes.find((h) => h.id === target.id);
      if (hero) placed.set(hero.id, this.moveHero(hero, target, battle, width, dt, gap));
    }
    return battle.heroes.map((hero) => placed.get(hero.id) ?? hero);
  }

  private moveHero(
    hero: Traveller,
    target: PartyTarget,
    battle: RoadBattle,
    width: number,
    dt: number,
    gap: Position,
  ): Traveller {
    // Width-normalized screen positions also absorb camera/forest-to-puppet framing changes.
    const x = target.x;
    const previous = this.positions.get(hero.id);
    const wanted = {
      x: previous ? approach(previous.x, x, dt, 280) : x,
      lane: previous ? approach(previous.lane, target.lane, dt, 0.9) : target.lane,
    };
    const blockers = [...this.positions].filter(([id]) => id !== hero.id).map(([, p]) => p);
    const position = previous
      ? avoidPartyStep(previous, wanted, target, blockers, gap, dt)
      : wanted;
    this.positions.set(hero.id, position);
    const moving = Math.abs(x - position.x) > 2 || Math.abs(target.lane - position.lane) > 0.012;
    const scale = roadScale(width, battle.stage);
    const origin = roadX(0, battle.distance, width, battle.stage);
    return {
      ...hero,
      x: ((position.x / 560) * width - origin) / scale,
      lane: position.lane,
      facing: stepFacing(hero, previous, position, battle),
      walking: hero.hp > 0 && !hero.paralyzed && (hero.walking || moving),
    };
  }
}
