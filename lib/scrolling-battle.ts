// An isolated combat experiment. No State, storage, rewards, or story flags are modified.
export type TravellerId = "aria" | "leon";
export type Loadout = { aria: "pierce" | "rapid"; leon: "sweep" | "guard" };
export type Traveller = {
  id: TravellerId;
  hp: number;
  maxHp: number;
  nextAttack: number;
  attacks: number;
};
export type RoadEnemy = {
  id: number;
  x: number;
  lane: number;
  hp: number;
  maxHp: number;
  nextAttack: number;
  boss: boolean;
};
export type RoadEffect = {
  id: number;
  at: number;
  kind: "arrow" | "slash" | "hurt" | "assist" | "heal";
  x: number;
  lane: number;
  amount: number;
  hero?: TravellerId;
  wide?: boolean;
};
export type RoadBattle = {
  time: number;
  remainder: number;
  distance: number;
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
export const ROAD_LENGTH = 900;
export const ROAD_STEP = 50;
const encounters = [0, 110, 225, 340, 460, 570, 690];
export const travellerNames = { aria: "アリア", leon: "レオン" };
export const travellerOffset = (id: TravellerId) => (id === "leon" ? 58 : -32);
export const travellerLane = (id: TravellerId) => (id === "leon" ? 0.73 : 0.58);

export function createRoadBattle(loadout: Loadout = { aria: "pierce", leon: "sweep" }): RoadBattle {
  return {
    time: 0,
    remainder: 0,
    distance: 0,
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
    heroes: [
      { id: "aria", hp: 125, maxHp: 125, nextAttack: 0, attacks: 0 },
      { id: "leon", hp: 240, maxHp: 240, nextAttack: 0, attacks: 0 },
    ],
  };
}

function effect(state: RoadBattle, data: Omit<RoadEffect, "id" | "at">) {
  state.effects.push({ ...data, id: ++state.serial, at: state.time });
  state.effects = state.effects.slice(-32);
}

function spawnEnemies(state: RoadBattle) {
  if (state.spawn >= encounters.length || state.distance < encounters[state.spawn]) return;
  const boss = state.spawn === encounters.length - 1;
  const count = boss ? 1 : 3 + (state.spawn % 3);
  for (let index = 0; index < count; index++) {
    const hp = boss ? 420 : 38 + state.spawn * 6;
    state.enemies.push({
      id: ++state.serial,
      x: state.distance + 310 + index * 36,
      lane: 0.56 + (index % 3) * 0.1,
      hp,
      maxHp: hp,
      nextAttack: state.time + 2000 + index * 200,
      boss,
    });
  }
  state.spawn++;
}

function damage(state: RoadBattle, enemy: RoadEnemy, amount: number) {
  const actual = Math.min(enemy.hp, amount);
  enemy.hp -= actual;
  if (actual > 0 && enemy.hp === 0) state.defeated++;
  return actual;
}

function heroAttack(state: RoadBattle, hero: Traveller) {
  if (hero.hp <= 0 || state.time < hero.nextAttack) return;
  const ranged = hero.id === "aria";
  const x = state.distance + travellerOffset(hero.id);
  const targets = state.enemies.filter(
    (enemy) => enemy.hp > 0 && enemy.x - x <= (ranged ? 310 : 86),
  );
  if (!targets.length) return;
  targets.sort((a, b) => a.x - b.x);
  hero.attacks++;
  const wide = hero.attacks % 3 === 0 && ["pierce", "sweep"].includes(state.loadout[hero.id]);
  hero.nextAttack = state.time + (ranged && state.loadout.aria === "rapid" ? 700 : 1050);
  const power = ranged ? 14 : 20;
  for (const enemy of targets.slice(0, wide ? 4 : 1)) {
    const amount = damage(state, enemy, power);
    effect(state, {
      kind: ranged ? "arrow" : "slash",
      hero: hero.id,
      x: enemy.x,
      lane: enemy.lane,
      amount,
      wide,
    });
  }
}

function enemyAttack(state: RoadBattle, enemy: RoadEnemy) {
  const hero = [...state.heroes].reverse().find((member) => member.hp > 0);
  if (!hero) return;
  const x = state.distance + travellerOffset(hero.id);
  if (enemy.x - x > 64) {
    enemy.x -= ((enemy.boss ? 12 : 22) * ROAD_STEP) / 1000;
    return;
  }
  if (state.time < enemy.nextAttack) return;
  enemy.nextAttack = state.time + (enemy.boss ? 2100 : 1800);
  const guarded = hero.id === "leon" && state.loadout.leon === "guard";
  const amount = Math.min(hero.hp, (enemy.boss ? 22 : 5) * (guarded ? 0.5 : 1));
  hero.hp -= amount;
  effect(state, { kind: "hurt", hero: hero.id, x, lane: travellerLane(hero.id), amount });
}

function recover(state: RoadBattle) {
  for (const hero of state.heroes) {
    hero.hp = hero.maxHp;
    hero.nextAttack = state.time + 500;
  }
  if (state.phase === "arrived") {
    state.distance = 0;
    state.spawn = 0;
    state.enemies = [];
    state.round++;
  }
  state.phase = "journey";
}

function finishTick(state: RoadBattle) {
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
  const blocked = state.enemies.some((enemy) => enemy.x - state.distance < 132);
  state.walking = !blocked;
  if (!blocked) state.distance = Math.min(ROAD_LENGTH, state.distance + (28 * ROAD_STEP) / 1000);
  if (state.distance >= ROAD_LENGTH && !state.enemies.length && state.spawn === encounters.length) {
    state.phase = "arrived";
    state.clears++;
    state.resumeAt = state.time + 6000;
    state.walking = false;
  }
}

function tick(state: RoadBattle) {
  state.time += ROAD_STEP;
  state.effects = state.effects.filter((item) => state.time - item.at < 900);
  if (state.phase !== "journey") {
    if (state.time >= state.resumeAt) recover(state);
    return;
  }
  spawnEnemies(state);
  for (const hero of state.heroes) heroAttack(state, hero);
  for (const enemy of state.enemies) if (enemy.hp > 0) enemyAttack(state, enemy);
  if (state.heroes.every((hero) => hero.hp <= 0)) {
    state.phase = "rest";
    state.walking = false;
    state.rests++;
    state.resumeAt = state.time + 6000;
    return;
  }
  finishTick(state);
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
  if (state.enemies.some((enemy) => enemy.boss)) return "道をふさぐ大きなスライム";
  return state.walking ? "森の出口を目指して、右へ" : "前方の群れと交戦中";
}
