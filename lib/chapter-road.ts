import type { Encounter, GameEvent, Quest, Run, Squad } from "./game.ts";
import type { RoadPosition } from "./chapter-road-types.ts";
import { encounter, targetName } from "./game-rules.ts";
import { isPrologueQuest } from "./prologue.ts";
import { createEnemies, syncEnemyTotals, type Enemy } from "./combat.ts";

export const CHAPTER_ROAD_STEP = 100;
export const CHAPTER_ROAD_SPACING = 210;
export const workOffsets: Record<string, number> = { aria: -12, leon: 32, mira: -58 };
const speed: Record<string, number> = { aria: 87, leon: 103, mira: 82 };
export const roadPosition = (x: number): RoadPosition => ({
  x,
  previousX: x,
  recoil: 0,
  walking: false,
  facing: 1,
});
export const roadPoint = (r: Run) => r.node * CHAPTER_ROAD_SPACING + 180;
export function movingWork(q: Quest, r: Run) {
  return (
    encounter(q, r.node) === "escort" &&
    (q.id === "village-trade" || /運ぶ|運搬|配達|届け|持ち帰/.test(targetName(q, r.node, r.nodes)))
  );
}
export function workPoint(q: Quest, r: Run) {
  return roadPoint(r) + (movingWork(q, r) ? (1 - r.target / r.targetMax) * 85 : 0);
}
export function roadWorkOffset(q: Quest, r: Run, hero: string) {
  if (movingWork(q, r) && !q.escortAsset)
    return ({ aria: -110, leon: -90, mira: -145 } as Record<string, number>)[hero] || -110;
  return ({ aria: -70, leon: 70, mira: -125 } as Record<string, number>)[hero] || 0;
}

// Attaching coordinates never rebuilds an existing target or changes its health/rewards.
export function ensureChapterRoad(r: Run, sq: Squad, q: Quest, at: number) {
  if (r.road || !isPrologueQuest(q.id)) return;
  const base = roadPoint(r) - (r.phase === "work" ? 60 : 180);
  r.road = {
    version: 1,
    at,
    previousAt: at,
    nextAt: at + CHAPTER_ROAD_STEP,
    camera: Math.max(0, base),
    previousCamera: Math.max(0, base),
    members: Object.fromEntries(
      sq.members.map((id) => [id, roadPosition(base + (workOffsets[id] || 0))]),
    ),
    opponents: {},
  };
  placeRoadEnemies(r);
}
export function placeRoadEnemies(r: Run) {
  const road = r.road;
  if (!road) return;
  const rear = road.ambushNode !== undefined && r.node % 2 === 0;
  road.opponents = Object.fromEntries(
    (r.enemies || []).map((enemy, index) => {
      const x =
        road.ambushNode === undefined
          ? roadPoint(r) + index * 58
          : roadPoint(r) + (rear ? -150 - index * 40 : 185 + index * 40);
      return [enemy.id, roadPosition(x)];
    }),
  );
}
export function roadGuard(r: Run) {
  return (
    r.actors.find((a) => a.hero === "leon" && r.health[a.hero].hp > 0)?.hero ||
    r.actors.find((a) => r.health[a.hero].hp > 0)?.hero
  );
}
export function roadHasEnemies(r: Run) {
  return !!r.enemies?.some((enemy) => enemy.hp > 0 && enemy.role !== "puppeteer");
}
export function roadActionKind(q: Quest, r: Run, hero?: string): Encounter {
  const kind = encounter(q, r.node);
  if (!r.road || kind === "battle" || !roadHasEnemies(r)) return kind;
  const guard = roadGuard(r),
    health = guard ? r.health[guard] : undefined;
  const needsHelp = health && health.hp < health.maxHp * 0.8;
  return hero === guard || r.target <= 0 || !hero || needsHelp ? "battle" : kind;
}
export function roadComplete(r: Run) {
  return r.target <= 0 && (!r.road || !roadHasEnemies(r));
}
export function nearestOpponent(r: Run, hero: string) {
  const x = r.road?.members[hero]?.x ?? 0;
  return r.enemies
    ?.filter((enemy) => enemy.hp > 0 && enemy.role !== "puppeteer")
    .sort(
      (a, b) =>
        Math.abs((r.road?.opponents[a.id]?.x ?? 0) - x) -
        Math.abs((r.road?.opponents[b.id]?.x ?? 0) - x),
    )[0];
}
export function roadActorReady(q: Quest, r: Run, hero: string) {
  if (!r.road) return true;
  const position = r.road.members[hero];
  if (Math.abs(position.recoil) > 5) return false;
  if (movingWork(q, r) && roadHasEnemies(r) && roadActionKind(q, r, hero) !== "battle")
    return false;
  if (roadActionKind(q, r, hero) !== "battle")
    return Math.abs(position.x - workPoint(q, r) - roadWorkOffset(q, r, hero)) < 12;
  const target = nearestOpponent(r, hero);
  if (!target) return !r.enemies?.length;
  return Math.abs(position.x - r.road.opponents[target.id].x) <= (hero === "leon" ? 68 : 210);
}
export function roadEnemyTargets(r: Run, enemy: string) {
  const road = r.road,
    x = road?.opponents[enemy]?.x;
  const living = r.actors.map((actor) => actor.hero).filter((id) => r.health[id].hp > 0);
  if (!road || x === undefined) return living;
  return living.sort((a, b) => Math.abs(road.members[a].x - x) - Math.abs(road.members[b].x - x));
}
export function roadEnemyReady(r: Run, enemy: string) {
  if (!r.road) return true;
  const target = roadEnemyTargets(r, enemy)[0];
  return !!target && Math.abs(r.road.opponents[enemy].x - r.road.members[target].x) < 72;
}

function move(position: RoadPosition, target: number, rate: number, dt: number) {
  position.previousX = position.x;
  position.walking = false;
  if (Math.abs(position.recoil) > 5) {
    position.x += position.recoil * dt;
    position.recoil *= Math.exp(-10 * dt);
    return;
  }
  const step = Math.sign(target - position.x) * Math.min(Math.abs(target - position.x), rate * dt);
  position.x += step;
  position.walking = Math.abs(step) > 0.01;
  if (position.walking) position.facing = step > 0 ? 1 : -1;
}
function moveMember(q: Quest, r: Run, id: string, dt: number) {
  const road = r.road;
  if (!road) return;
  const position = road.members[id];
  if (r.health[id].hp <= 0) {
    position.previousX = position.x;
    position.walking = false;
    return;
  }
  const enemy = roadActionKind(q, r, id) === "battle" ? nearestOpponent(r, id) : undefined;
  let target = workPoint(q, r) + roadWorkOffset(q, r, id);
  if (enemy) {
    const x = road.opponents[enemy.id].x;
    position.facing = x >= position.x ? 1 : -1;
    const range = id === "leon" ? 48 : 185;
    target = Math.abs(x - position.x) <= range ? position.x : x - position.facing * range;
  }
  move(position, target, speed[id] || 85, dt);
}
function ambush(q: Quest, r: Run, at: number) {
  const road = r.road;
  if (!road) return;
  if (
    encounter(q, r.node) === "battle" ||
    road.ambushNode !== undefined ||
    r.node + 1 >= r.nodes ||
    encounter(q, r.node + 1) !== "battle" ||
    r.target > r.targetMax * 0.7
  )
    return;
  road.ambushNode = r.node + 1;
  r.enemies = createEnemies(q, road.ambushNode, at, r.nodes !== 15);
  placeRoadEnemies(r);
  syncEnemyTotals(r);
}
function moveEnemy(r: Run, enemy: Enemy, dt: number) {
  const road = r.road;
  if (!road) return;
  const position = road.opponents[enemy.id];
  position.previousX = position.x;
  const target = roadEnemyTargets(r, enemy.id)[0];
  if (enemy.hp <= 0 || enemy.role === "puppeteer" || !target) return;
  const x = road.members[target].x;
  move(position, Math.abs(x - position.x) > 52 ? x : position.x, enemy.role ? 18 : 25, dt);
}
export function advanceChapterRoad(q: Quest, r: Run, at: number) {
  const road = r.road;
  if (!road) return;
  const dt = Math.max(0, Math.min(0.2, (at - road.at) / 1000));
  if (!dt) return;
  road.previousAt = road.at;
  road.at = at;
  if (road.nextAt <= at) road.nextAt = at + CHAPTER_ROAD_STEP;
  road.previousCamera = road.camera;
  ambush(q, r, at);
  for (const actor of r.actors) moveMember(q, r, actor.hero, dt);
  for (const enemy of r.enemies || []) moveEnemy(r, enemy, dt);
  updateRoadCamera(r);
}
function updateRoadCamera(r: Run) {
  const road = r.road;
  if (!road) return;
  const living = r.actors.filter((actor) => r.health[actor.hero].hp > 0);
  if (living.length)
    road.camera = Math.max(
      road.camera,
      Math.min(...living.map((actor) => road.members[actor.hero].x)),
    );
}
export function roadImpact(
  r: Run,
  kind: GameEvent["kind"],
  hero?: string,
  target?: string,
  enemy?: string,
) {
  const road = r.road;
  if (!road || !enemy || !(enemy in road.opponents)) return;
  const opponent = road.opponents[enemy];
  if (kind === "hurt" && target) pushAway(road.members[target], opponent.x, 45);
  if (["hit", "skill", "assist", "combo"].includes(kind)) {
    const sourceX = hero ? road.members[hero].x : opponent.x - 1;
    pushAway(opponent, sourceX, hero === "leon" ? 50 : 12);
  }
}
function pushAway(position: RoadPosition, source: number, strength: number) {
  position.recoil = (position.x >= source ? 1 : -1) * strength;
}
