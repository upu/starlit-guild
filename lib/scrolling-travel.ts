import type { RoadBattle, RoadEnemy, Traveller } from "./scrolling-battle.ts";
import { roadStages, roadStops } from "./scrolling-stages.ts";
import { workCargo } from "./scrolling-work.ts";

export const ROAD_LENGTH = 900;
export const ROAD_STEP = 50;

export function prepareRoadStop(state: RoadBattle) {
  if (state.enemies.some((enemy) => enemy.hp > 0) || state.gathering) return;
  const stop = roadStops(state.stage).at(state.spawn);
  if (!stop || Math.max(...state.heroes.map((hero) => hero.x)) < stop.x - 230) return;
  state.spawn++;
  if (stop.kind === "gather" || stop.kind === "cargo") {
    state.gathering = {
      kind: stop.kind === "cargo" ? "cargo" : "herb",
      task: stop.kind === "cargo" ? "pack" : "gather",
      x: stop.x,
      previousX: stop.x,
      remaining: roadStages[state.stage].work,
      total: roadStages[state.stage].work,
      waves: 0,
      rear: state.spawn % 2 === 0,
    };
    return;
  }
  if (stop.kind === "puppets") {
    spawnRoadEnemy(state, stop.x, 160, false, 0, "puppet");
    spawnRoadEnemy(state, stop.x + 65, 480, true, 2, "golem");
    spawnRoadEnemy(state, stop.x + 155, 1, false, 0, "pumpety");
    return;
  }
  for (let index = 0; index < stop.count; index++) {
    const x = stop.x + index * 50;
    spawnRoadEnemy(state, x, stop.hp, stop.kind === "boss", index);
  }
}

function spawnRoadEnemy(
  state: RoadBattle,
  x: number,
  hp: number,
  boss = false,
  index = 0,
  kind: RoadEnemy["kind"] = "slime",
) {
  state.enemies.push({
    kind,
    id: ++state.serial,
    x,
    previousX: x,
    recoil: 0,
    lane: 0.59 + (index % 3) * 0.08,
    hp,
    maxHp: hp,
    nextAttack: state.time + 2000 + index * 200,
    boss,
  });
}

export function roadGuard(state: RoadBattle) {
  return (
    state.heroes.find((hero) => hero.id === "leon" && hero.hp > 0) ??
    state.heroes.find((hero) => hero.hp > 0)
  );
}

export function isRoadWorker(state: RoadBattle, hero: Traveller) {
  if (!state.gathering || hero.hp <= 0) return false;
  return !state.enemies.some((enemy) => enemy.hp > 0) || hero !== roadGuard(state);
}

export const gatheringOffset = { aria: -12, leon: 30, mira: -52 };

export function isWorking(state: RoadBattle, hero: Traveller) {
  if (!state.gathering || !isRoadWorker(state, hero)) return false;
  return (
    !hero.walking &&
    Math.abs(hero.recoil) <= 1 &&
    Math.abs(hero.x - state.gathering.x - gatheringOffset[hero.id]) < 3
  );
}

function travelTarget(state: RoadBattle, hero: Traveller) {
  if (state.gathering && isRoadWorker(state, hero))
    return state.gathering.x + gatheringOffset[hero.id];
  const enemy = state.enemies
    .filter((item) => item.hp > 0 && item.kind !== "pumpety")
    .sort((a, b) => Math.abs(a.x - hero.x) - Math.abs(b.x - hero.x))
    .at(0);
  if (enemy) return combatTarget(hero, enemy);
  const companion = state.heroes.find((item) => item.id !== hero.id && item.hp > 0);
  const goal = ROAD_LENGTH + (hero.id === "leon" ? 40 : 0);
  return Math.min(goal, (companion?.x ?? hero.x) + 100);
}

function combatTarget(hero: Traveller, enemy: RoadEnemy) {
  hero.facing = enemy.x >= hero.x ? 1 : -1;
  const range = hero.id === "leon" ? 48 : 190;
  return Math.abs(enemy.x - hero.x) <= range ? hero.x : enemy.x - hero.facing * range;
}

export function moveTravellers(state: RoadBattle) {
  for (const hero of state.heroes) moveTraveller(state, hero);
}

function moveTraveller(state: RoadBattle, hero: Traveller) {
  hero.walking = false;
  if (hero.hp <= 0) return;
  if (Math.abs(hero.recoil) > 1) {
    hero.x = Math.max(0, hero.x + (hero.recoil * ROAD_STEP) / 1000);
    hero.recoil *= 0.72;
    return;
  }
  const target = travelTarget(state, hero);
  const speed = travelSpeed(state, hero);
  const step =
    Math.sign(target - hero.x) * Math.min(Math.abs(target - hero.x), (speed * ROAD_STEP) / 1000);
  hero.x += step;
  hero.walking = Math.abs(step) > 0;
  if (hero.walking) hero.facing = step > 0 ? 1 : -1;
}

function travelSpeed(state: RoadBattle, hero: Traveller) {
  if (hero.id === "aria") return state.enemies.length ? 32 : 37;
  if (hero.id === "mira") return 35;
  if (state.gathering) return 80;
  return state.enemies.length ? 46 : 31;
}

export function gatherOnRoad(state: RoadBattle) {
  const point = state.gathering;
  if (!point) return;
  if (point.kind === "cargo") {
    workCargo(state);
    gatheringAmbush(state);
    return;
  }
  const workers = state.heroes.filter((hero) => isWorking(state, hero));
  const power = workers.reduce((sum, hero) => sum + (hero.id === "aria" ? 1 : 0.7), 0);
  point.remaining = Math.max(0, point.remaining - ROAD_STEP * power);
  gatheringAmbush(state);
  if (point.remaining > 0) return;
  state.herbs += 3;
  for (const hero of state.heroes) hero.hp = Math.min(hero.maxHp, hero.hp + 20);
  state.effects.push({
    id: ++state.serial,
    at: state.time,
    kind: "gather",
    x: point.x,
    lane: 0.59,
    amount: 3,
  });
  state.gathering = null;
}

function gatheringAmbush(state: RoadBattle) {
  const point = state.gathering;
  if (!point || state.enemies.some((enemy) => enemy.hp > 0)) return;
  const stage = roadStages[state.stage];
  if (point.kind === "cargo" && point.task !== "carry") return;
  if (point.waves >= stage.waves || point.remaining > point.total * (0.8 - point.waves * 0.4))
    return;
  const rear = point.waves % 2 === 0 ? point.rear : !point.rear;
  point.waves++;
  for (let index = 0; index < stage.ambushers; index++) {
    const offset = (rear ? -150 : 185) + (rear ? -1 : 1) * index * 40;
    spawnRoadEnemy(state, point.x + offset, 65, false, index);
  }
}

export function finishRoadTick(state: RoadBattle) {
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
  const living = state.heroes.filter((hero) => hero.hp > 0);
  state.distance = Math.min(
    ROAD_LENGTH,
    Math.max(state.distance, Math.min(...living.map((hero) => hero.x))),
  );
  state.walking = living.some((hero) => hero.walking);
  if (
    state.distance < ROAD_LENGTH ||
    state.enemies.length ||
    state.gathering ||
    state.spawn < roadStops(state.stage).length
  )
    return;
  state.phase = "arrived";
  state.clears++;
  state.resumeAt = state.time + 6000;
  state.walking = false;
}
