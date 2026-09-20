// An isolated combat experiment. No State, storage, rewards, or story flags are modified.
import {
  ROAD_STEP,
  prepareRoadStop,
  moveTravellers,
  gatherOnRoad,
  finishRoadTick,
  isRoadWorker,
  roadGuard,
} from "./scrolling-travel.ts";
import { roadStages, type RoadStageId } from "./scrolling-stages.ts";
export { ROAD_LENGTH, ROAD_STEP } from "./scrolling-travel.ts";
export type TravellerId = "aria" | "leon" | "mira";
export type Loadout = { aria: "pierce" | "rapid"; leon: "sweep" | "guard" };
export type Traveller = {
  id: TravellerId;
  hp: number;
  maxHp: number;
  nextAttack: number;
  attacks: number;
  x: number;
  previousX: number;
  recoil: number;
  walking: boolean;
  facing: 1 | -1;
};
export type RoadEnemy = {
  id: number;
  x: number;
  previousX: number;
  recoil: number;
  lane: number;
  hp: number;
  maxHp: number;
  nextAttack: number;
  boss: boolean;
};
export type RoadEffect = {
  id: number;
  at: number;
  kind: "arrow" | "slash" | "hurt" | "assist" | "gather" | "heal" | "magic";
  x: number;
  lane: number;
  amount: number;
  hero?: TravellerId;
  wide?: boolean;
  fromX?: number;
  fromLane?: number;
};
export type RoadBattle = {
  stage: RoadStageId;
  time: number;
  remainder: number;
  distance: number;
  previousDistance: number;
  herbs: number;
  gathering: {
    x: number;
    remaining: number;
    total: number;
    waves: number;
    rear: boolean;
  } | null;
  walking: boolean;
  round: number;
  clears: number;
  defeated: number;
  rests: number;
  phase: "journey" | "rest" | "arrived";
  resumeAt: number;
  spawn: number;
  serial: number;
  assistAt: number;
  loadout: Loadout;
  heroes: Traveller[];
  enemies: RoadEnemy[];
  effects: RoadEffect[];
};
export const travellerNames = { aria: "アリア", leon: "レオン", mira: "ミラ" };
export const travellerLane = (id: TravellerId) => ({ aria: 0.57, leon: 0.75, mira: 0.66 })[id];
const startingX = { aria: 0, leon: 40, mira: -40 };

export function createRoadBattle(
  loadout: Loadout = { aria: "pierce", leon: "sweep" },
  stage: RoadStageId = "forest",
): RoadBattle {
  return {
    stage,
    time: 0,
    remainder: 0,
    distance: 0,
    previousDistance: 0,
    herbs: 0,
    gathering: null,
    walking: true,
    round: 1,
    clears: 0,
    defeated: 0,
    rests: 0,
    phase: "journey",
    resumeAt: 0,
    spawn: 0,
    serial: 0,
    assistAt: 0,
    loadout: { ...loadout },
    enemies: [],
    effects: [],
    heroes: (roadStages[stage].trio
      ? (["aria", "leon", "mira"] as const)
      : (["aria", "leon"] as const)
    ).map(createTraveller),
  };
}

function createTraveller(id: TravellerId): Traveller {
  const hp = { aria: 125, leon: 240, mira: 150 }[id];
  return {
    id,
    hp,
    maxHp: hp,
    nextAttack: 0,
    attacks: 0,
    x: startingX[id],
    previousX: startingX[id],
    recoil: 0,
    walking: true,
    facing: 1,
  };
}

function effect(state: RoadBattle, data: Omit<RoadEffect, "id" | "at">) {
  state.effects.push({ ...data, id: ++state.serial, at: state.time });
  state.effects = state.effects.slice(-32);
}

function damage(state: RoadBattle, enemy: RoadEnemy, amount: number) {
  const actual = Math.min(enemy.hp, amount);
  enemy.hp -= actual;
  if (actual > 0 && enemy.hp === 0) state.defeated++;
  return actual;
}

function heroAttack(state: RoadBattle, hero: Traveller) {
  if (hero.hp <= 0 || state.time < hero.nextAttack || Math.abs(hero.recoil) > 1) return;
  if (hero.id === "mira" && healCompanion(state, hero)) return;
  if (isRoadWorker(state, hero)) return;
  attackTargets(state, hero);
}

function attackTargets(state: RoadBattle, hero: Traveller) {
  const ranged = hero.id !== "leon";
  const x = hero.x;
  const targets = state.enemies.filter(
    (enemy) => enemy.hp > 0 && Math.abs(enemy.x - x) <= (ranged ? 205 : 64),
  );
  if (!targets.length) return;
  targets.sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x));
  hero.attacks++;
  const wide =
    hero.id !== "mira" &&
    hero.attacks % 3 === 0 &&
    ["pierce", "sweep"].includes(state.loadout[hero.id]);
  hero.nextAttack = state.time + (ranged && state.loadout.aria === "rapid" ? 700 : 1050);
  for (const enemy of targets.slice(0, wide ? 4 : 1)) strikeEnemy(state, hero, enemy, wide);
}

function healCompanion(state: RoadBattle, healer: Traveller) {
  const target = state.heroes
    .filter((hero) => hero.hp > 0 && hero.hp <= hero.maxHp - 18)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
    .at(0);
  if (!target) return false;
  const amount = Math.min(24, target.maxHp - target.hp);
  target.hp += amount;
  healer.nextAttack = state.time + 2800;
  healer.attacks++;
  effect(state, {
    kind: "heal",
    hero: "mira",
    x: target.x,
    lane: travellerLane(target.id),
    amount,
    fromX: healer.x,
    fromLane: travellerLane(healer.id),
  });
  return true;
}

function strikeEnemy(state: RoadBattle, hero: Traveller, enemy: RoadEnemy, wide: boolean) {
  const ranged = hero.id !== "leon";
  hero.facing = enemy.x >= hero.x ? 1 : -1;
  const amount = damage(state, enemy, ranged ? 14 : 20);
  if (!ranged) enemy.recoil = hero.facing * (enemy.boss ? 18 : 75);
  effect(state, {
    kind: hero.id === "mira" ? "magic" : ranged ? "arrow" : "slash",
    hero: hero.id,
    x: enemy.x,
    lane: enemy.lane,
    amount,
    wide,
    fromX: hero.x,
    fromLane: travellerLane(hero.id),
  });
}

function enemyAttack(state: RoadBattle, enemy: RoadEnemy) {
  if (Math.abs(enemy.recoil) > 1) {
    enemy.x += (enemy.recoil * ROAD_STEP) / 1000;
    enemy.recoil *= 0.72;
    return;
  }
  const hero = state.heroes
    .filter((member) => member.hp > 0)
    .sort((a, b) => Math.abs(a.x - enemy.x) - Math.abs(b.x - enemy.x))
    .at(0);
  if (!hero) return;
  const x = hero.x;
  if (Math.abs(enemy.x - x) > 52) {
    enemy.x += (Math.sign(x - enemy.x) * ((enemy.boss ? 12 : 22) * ROAD_STEP)) / 1000;
    return;
  }
  if (state.time < enemy.nextAttack) return;
  strikeHero(state, enemy, hero);
}

function strikeHero(state: RoadBattle, enemy: RoadEnemy, hero: Traveller) {
  enemy.nextAttack = state.time + (enemy.boss ? 2100 : 1800);
  const guarded = hero.id === "leon" && state.loadout.leon === "guard";
  const amount = Math.min(hero.hp, (enemy.boss ? 22 : 5) * (guarded ? 0.5 : 1));
  hero.hp -= amount;
  hero.recoil = (hero.x >= enemy.x ? 1 : -1) * (guarded ? 20 : 65);
  effect(state, { kind: "hurt", hero: hero.id, x: hero.x, lane: travellerLane(hero.id), amount });
}

function recover(state: RoadBattle) {
  for (const hero of state.heroes) {
    hero.hp = hero.maxHp;
    hero.nextAttack = state.time + 500;
    hero.recoil = 0;
  }
  if (state.phase === "arrived") {
    state.distance = 0;
    state.previousDistance = 0;
    state.spawn = 0;
    state.enemies = [];
    state.gathering = null;
    for (const hero of state.heroes) {
      hero.x = startingX[hero.id];
      hero.previousX = hero.x;
      hero.walking = true;
      hero.facing = 1;
    }
    state.round++;
  }
  state.phase = "journey";
}

function tick(state: RoadBattle) {
  state.previousDistance = state.distance;
  for (const hero of state.heroes) hero.previousX = hero.x;
  for (const enemy of state.enemies) enemy.previousX = enemy.x;
  state.time += ROAD_STEP;
  state.effects = state.effects.filter((item) => state.time - item.at < 900);
  if (state.phase !== "journey") {
    if (state.time >= state.resumeAt) recover(state);
    return;
  }
  prepareRoadStop(state);
  moveTravellers(state);
  for (const hero of state.heroes) heroAttack(state, hero);
  for (const enemy of state.enemies) if (enemy.hp > 0) enemyAttack(state, enemy);
  if (state.heroes.every((hero) => hero.hp <= 0)) {
    state.phase = "rest";
    state.walking = false;
    state.rests++;
    state.resumeAt = state.time + 6000;
    return;
  }
  gatherOnRoad(state);
  finishRoadTick(state);
}

// Fixed steps make idle catch-up and live play produce identical combat outcomes.
export function advanceRoadBattle(state: RoadBattle, elapsed: number) {
  if (!Number.isFinite(elapsed) || elapsed <= 0) return;
  state.remainder += Math.min(elapsed, 12 * 60 * 60 * 1000);
  while (state.remainder >= ROAD_STEP) {
    state.remainder -= ROAD_STEP;
    tick(state);
  }
}

export function assistRoadBattle(state: RoadBattle) {
  if (state.time < state.assistAt || state.phase === "arrived") return false;
  if (state.phase === "rest") {
    state.resumeAt = Math.max(state.time + ROAD_STEP, state.resumeAt - 350);
    state.assistAt = state.time + 150;
    return true;
  }
  if (state.gathering) {
    const point = state.gathering;
    if (!state.heroes.some((hero) => hero.hp > 0 && Math.abs(hero.x - point.x) < 70)) return false;
    point.remaining = Math.max(0, point.remaining - 350);
    state.assistAt = state.time + 150;
    return true;
  }
  const enemy = state.enemies.find((item) => item.hp > 0 && item.x - state.distance < 360);
  if (!enemy) return false;
  const amount = damage(state, enemy, 8);
  effect(state, { kind: "assist", x: enemy.x, lane: enemy.lane, amount });
  state.assistAt = state.time + 150;
  return true;
}

export function roadStatus(state: RoadBattle) {
  if (state.phase === "arrived") return "森を抜けた！ ひと息ついたら、もう一周";
  if (state.phase === "rest") return "ひと休み中 · 回復したら自動で再出発";
  if (state.gathering) {
    if (state.enemies.some((enemy) => enemy.hp > 0))
      return `採取を続行 · ${travellerNames[roadGuard(state)?.id ?? "leon"]}が護衛中`;
    return state.gathering.remaining < state.gathering.total
      ? "みんなで薬草を採取中"
      : "道端に薬草を見つけた";
  }
  if (state.enemies.some((enemy) => enemy.boss)) return "道をふさぐ大きなスライム";
  return state.enemies.length ? "道中の魔物と交戦中" : "森の出口を目指して、右へ";
}
