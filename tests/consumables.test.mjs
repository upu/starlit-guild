import test from "node:test";
import assert from "node:assert/strict";
import { initialState, testState, act, settle, settleOnScreen, skipTo } from "../lib/game.ts";
import { shopConsumables, consumableStock } from "../lib/consumables.ts";
import { applyPinchConsumable, consumableNotice } from "../lib/consumable-effects.ts";
import { event, reward, recoverRun, configureTarget, schedule } from "../lib/game-run.ts";
import { questById } from "../lib/game-rules.ts";
import { groupEnemyTurns } from "../lib/enemy-turns.ts";
import { parseBundle } from "../lib/save-format.ts";
import { TOWN_QUEST, TOWER_QUEST } from "../lib/prologue.ts";

const action = (s, a) => act(s, a, s.updatedAt);
const buy = (s, id = "salve", quantity = 1) => action(s, { type: "buyConsumable", id, quantity });
const assign = (s, hero = "aria", id = "salve") =>
  action(s, { type: "assignConsumable", hero, id });
const start = (s, id = TOWER_QUEST, repeat = false) =>
  action(s, { type: "start", id, value: repeat, readDeparture: true });
function bundle(state) {
  const id = "44444444-4444-4444-8444-444444444444";
  return {
    format: 4,
    deviceId: id,
    active: id,
    profiles: [{ id, name: "items", test: true, state }],
    serial: 0,
    sound: false,
    cloudAt: 0,
  };
}
const roundtrip = (s) => parseBundle(JSON.parse(JSON.stringify(bundle(s)))).profiles[0].state;
const same = (a, b) =>
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
function until(s, predicate, limit = 180000) {
  const end = s.updatedAt + limit;
  while (!predicate(s) && s.updatedAt < end) s = settle(s, s.updatedAt + 100);
  assert.ok(predicate(s), "condition reached");
  return s;
}

test("shop unlocks after 1-3 return, then adds the stronger salve in Berne", () => {
  const locked = testState(1000, 3, 10, 1000);
  locked.story.read = locked.story.read.filter((id) => id !== TOWN_QUEST + "-return");
  assert.deepEqual(shopConsumables(locked), []);
  assert.throws(() => buy(locked));
  assert.throws(() => assign(locked));
  const open = action(locked, { type: "readStory", id: TOWN_QUEST + "-return" });
  assert.deepEqual(
    shopConsumables(open).map((i) => i.id),
    ["salve", "travel-biscuit"],
  );
  assert.throws(() => buy(open, "fine-salve"));
  assert.equal(shopConsumables(testState(1000, 20, 20, 1000)).length, 3);
});

test("single and bulk purchases preserve resources and equipment; failures are atomic", () => {
  const before = testState(1000, 3, 10, 1000);
  const s = buy(buy(before), "salve", 10);
  assert.equal(s.gold, 890);
  assert.equal(consumableStock(s, "salve"), 11);
  assert.equal(before.consumables, undefined);
  assert.deepEqual(s.inventory, before.inventory);
  assert.equal(s.herbs, before.herbs);
  for (const quantity of [0, -1, 2, 1.5, NaN, Infinity, "10"])
    assert.throws(() => buy(s, "salve", quantity));
  assert.throws(() => buy(s, "herbs"));
  assert.throws(() => buy({ ...s, gold: 9 }));
  const full = structuredClone(s);
  full.consumables.items.salve = 9995;
  assert.throws(() => buy(full, "salve", 10));
  assert.equal(full.consumables.items.salve, 9995);
  assert.equal(buy(full).consumables.items.salve, 9996);
});

test("one shared item supports multiple registrations, including an empty stock, and removal is free", () => {
  let s = assign(assign(buy(testState(1000, 3, 10, 1000))), "leon");
  assert.equal(consumableStock(s, "salve"), 1);
  same(roundtrip(s), s);
  s = action(s, { type: "assignConsumable", hero: "aria" });
  assert.equal(s.consumables.assigned.aria, undefined);
  assert.equal(s.consumables.assigned.leon, "salve");
  s = assign(s, "aria", "travel-biscuit");
  assert.equal(consumableStock(s, "travel-biscuit"), 0);
  assert.throws(() => assign(s, "mira"));
  assert.throws(() => assign(s, "aria", "ash-bow"));
});

test("pinch recovery uses one item at 40%, never for zero damage or a fallen hero", () => {
  const s = start(assign(buy(testState(1000, 3, 10, 1000), "salve", 10)));
  const r = s.squads[0].run;
  r.health.aria = { hp: 41, maxHp: 100 };
  applyPinchConsumable(s, r, "aria", 1, s.updatedAt, event);
  assert.equal(consumableStock(s, "salve"), 10);
  r.health.aria.hp = 40;
  applyPinchConsumable(s, r, "aria", 0, s.updatedAt, event);
  assert.equal(r.health.aria.hp, 40);
  applyPinchConsumable(s, r, "aria", 1, s.updatedAt, event);
  assert.equal(r.health.aria.hp, 70);
  assert.equal(consumableStock(s, "salve"), 9);
  assert.match(r.events.at(-1).text, /アリアが傷薬/);
  r.health.aria.hp = 1;
  applyPinchConsumable(s, r, "aria", 1, s.updatedAt, event);
  assert.equal(r.health.aria.hp, 31, "does not chain until above threshold");
  r.health.aria.hp = 0;
  applyPinchConsumable(s, r, "aria", 1, s.updatedAt, event);
  assert.equal(r.health.aria.hp, 0);
  assert.equal(consumableStock(s, "salve"), 8);
});

test("stronger medicine never exceeds maximum HP", () => {
  const s = start(assign(buy(testState(1000, 20, 20, 1000), "fine-salve"), "aria", "fine-salve"));
  const r = s.squads[0].run;
  r.health.aria = { hp: 40.4, maxHp: 101 };
  applyPinchConsumable(s, r, "aria", 1, s.updatedAt, event);
  assert.equal(r.health.aria.hp, 101);
  assert.equal(consumableStock(s, "fine-salve"), 0);
});

test("empty stock retains assignment; replenishment and switching work during a run", () => {
  let s = start(assign(testState(1000, 20, 20, 1000)));
  const hurt = (s) => {
    s.squads[0].run.health.aria = { hp: 10, maxHp: 100 };
    applyPinchConsumable(s, s.squads[0].run, "aria", 1, s.updatedAt, event);
  };
  hurt(s);
  assert.equal(s.squads[0].run.health.aria.hp, 10);
  s = buy(s);
  hurt(s);
  assert.equal(s.squads[0].run.health.aria.hp, 40);
  assert.equal(s.consumables.assigned.aria, "salve");
  s = assign(buy(s, "fine-salve"), "aria", "fine-salve");
  hurt(s);
  assert.equal(s.squads[0].run.health.aria.hp, 90);
});

test("medicine restores fixed HP at different maximum HP and costs the advertised amount", () => {
  for (const [id, healing, price] of [
    ["salve", 30, 10],
    ["fine-salve", 80, 30],
  ]) {
    for (const maxHp of [100, 200, 400]) {
      const s = start(assign(buy(testState(1000, 20, 20, 1000), id), "aria", id));
      const r = s.squads[0].run;
      r.health.aria = { hp: 10, maxHp };
      applyPinchConsumable(s, r, "aria", 1, s.updatedAt, event);
      assert.equal(r.health.aria.hp, 10 + healing);
      assert.equal(s.gold, 1000 - price);
    }
  }
  assert.equal(buy(testState(1000, 3, 10, 1000), "travel-biscuit", 10).gold, 900);
});

test("five departure users are all notified with the actual shared stock consumption", () => {
  for (const stock of [5, 2]) {
    let s = testState(1000, 35, 30, 1000);
    s.consumables = { items: { "travel-biscuit": stock }, assigned: {} };
    for (const hero of s.owned) s = assign(s, hero, "travel-biscuit");
    s = start(s, "merrill-seedlings");
    const names = ["アリア", "レオン", "ミラ", "フィン", "リコ"];
    const notice = consumableNotice(roundtrip(s), 1000);
    for (const [i, name] of names.entries()) assert.equal(notice.includes(name), i < stock);
    assert.match(notice, new RegExp(`（${stock}個）`));
    assert.doesNotMatch(notice, /経験値|10%/);
    assert.equal(consumableStock(s, "travel-biscuit"), 0);
    assert.equal(Object.keys(s.squads[0].run.consumableEffects).length, stock);
    assert.equal(s.log.filter((entry) => entry.consumable).length, 1);
  }
});

test("notices retain every recent use, including older saves with individual departure logs", () => {
  const s = initialState(1000);
  s.log = ["リコ", "フィン", "ミラ", "レオン", "アリア"].map((name) => ({
    text: `${name}が旅のビスケットを使った。`,
    at: 1000,
    consumable: "travel-biscuit",
  }));
  assert.equal(consumableNotice(s, 1000).split("\n").length, 5);
  assert.equal(consumableNotice(s, 6000), "");
});

test("departure consumes in party order and boosts only the user, surviving reassignment", () => {
  let s = testState(1000, 3, 20, 1000);
  s = assign(assign(buy(s, "travel-biscuit"), "aria", "travel-biscuit"), "leon", "travel-biscuit");
  s = start(s, TOWN_QUEST);
  assert.equal(consumableStock(s, "travel-biscuit"), 0);
  same(s.squads[0].run.consumableEffects, { aria: "travel-biscuit" });
  s = action(s, { type: "assignConsumable", hero: "aria" });
  const before = { ...s.xp },
    q = questById(TOWN_QUEST);
  s = until(s, (s) => !s.squads[0].run);
  assert.ok(Math.abs(s.xp.aria - before.aria - q.xp * 1.1) < 1e-8);
  assert.ok(Math.abs(s.xp.leon - before.leon - q.xp) < 1e-8);
  const restarted = start(buy(s, "travel-biscuit"), TOWN_QUEST);
  same(restarted.squads[0].run.consumableEffects, { leon: "travel-biscuit" });
});

test("every repeat consumes anew; exhausted stock continues without an effect", () => {
  let s = assign(
    buy(buy(testState(1000, 3, 20, 1000), "travel-biscuit"), "travel-biscuit"),
    "aria",
    "travel-biscuit",
  );
  s = start(s, TOWN_QUEST, true);
  assert.equal(consumableStock(s, "travel-biscuit"), 1);
  s = until(s, (s) => s.squads[0].run?.round === 2);
  assert.equal(consumableStock(s, "travel-biscuit"), 0);
  assert.equal(s.squads[0].run.consumableEffects.aria, "travel-biscuit");
  assert.ok(
    s.squads[0].run.events.some((e) => e.id.startsWith("2-0-") && e.text.includes("ビスケット")),
    "repeat does not overwrite departure event",
  );
  s = until(s, (s) => s.squads[0].run?.round === 3);
  assert.equal(s.squads[0].run.consumableEffects, undefined);
  s = buy(s, "travel-biscuit");
  assert.equal(s.squads[0].run.consumableEffects, undefined);
  s = until(s, (s) => s.squads[0].run?.round === 4);
  assert.equal(s.squads[0].run.consumableEffects.aria, "travel-biscuit");
});

test("save, pause, rest and recovery preserve paid effects without another consumption", () => {
  const s = start(
    assign(buy(testState(1000, 3, 10, 1000), "travel-biscuit", 10), "aria", "travel-biscuit"),
  );
  same(roundtrip(s), s);
  let resumed = roundtrip(skipTo(s, 100000));
  const sq = resumed.squads[0];
  recoverRun(resumed, sq, sq.run, questById(sq.run.quest), resumed.updatedAt);
  resumed = roundtrip(resumed);
  assert.equal(consumableStock(resumed, "travel-biscuit"), 9);
  assert.equal(resumed.squads[0].run.consumableEffects.aria, "travel-biscuit");
  const before = resumed.xp.aria;
  reward(resumed, resumed.squads[0], questById(TOWER_QUEST), resumed.updatedAt, false);
  assert.ok(resumed.xp.aria > before);
});

test("legacy v4 inventory and in-progress HP/clocks are unchanged and get no retroactive effect", () => {
  const old = start(testState(1000, 3, 10, 1000));
  old.squads[0].run.health.aria.hp -= 7;
  const loaded = roundtrip(old);
  same(loaded, old);
  assert.equal(loaded.consumables, undefined);
  const assigned = assign(buy(loaded, "travel-biscuit"), "aria", "travel-biscuit");
  assert.equal(assigned.squads[0].run.consumableEffects, undefined);
  assert.equal(consumableStock(assigned, "travel-biscuit"), 1);
  same(roundtrip(initialState(1000)), initialState(1000));
});

test("invalid saved counts, IDs, owners and departure effects are rejected", () => {
  const base = start(assign(buy(testState(1000, 3, 10, 1000))));
  const invalid = [
    (s) => (s.consumables.items.salve = -1),
    (s) => (s.consumables.items.salve = 0.5),
    (s) => (s.consumables.items.salve = 10000),
    (s) => (s.consumables.items.unknown = 1),
    (s) => (s.consumables.assigned.mira = "salve"),
    (s) => (s.consumables.assigned.aria = "herbs"),
    (s) => (s.squads[0].run.consumableEffects = { aria: "salve" }),
    (s) => (s.squads[0].run.consumableEffects = { mira: "travel-biscuit" }),
  ];
  for (const mutate of invalid) {
    const s = structuredClone(base);
    mutate(s);
    assert.throws(() => roundtrip(s));
  }
});

for (const id of [TOWER_QUEST, "sweet-blockade", "lico-records", "merrill-seedlings"]) {
  test(`${id}: real damage consumes salves and batched/live/resumed progression agrees`, () => {
    let s = testState(1000, 35, id === TOWER_QUEST ? 1 : 25, 10000);
    s = buy(buy(s, "salve", 10), "travel-biscuit", 10);
    for (const hero of s.owned) s = assign(s, hero, "salve");
    s = start(s, id, true);
    s = until(s, (s) => s.squads[0].run?.enemies?.length > 0, 600000);
    for (const actor of s.squads[0].run.actors) actor.nextAt += 10000;
    s.squads[0].run.comboAt += 10000;
    for (const health of Object.values(s.squads[0].run.health)) health.hp = health.maxHp * 0.4;
    const before = roundtrip(s),
      end = s.updatedAt + 180000;
    const batched = settle(before, end);
    let fine = before;
    while (fine.updatedAt < end) fine = settleOnScreen(fine, fine.updatedAt + 200);
    assert.ok(consumableStock(batched, "salve") < 10, "dedicated fight really used a salve");
    same(batched.squads, fine.squads);
    same(batched.consumables, fine.consumables);
    same(batched.xp, fine.xp);
    const midway = roundtrip(settle(before, before.updatedAt + 87000));
    same(settle(midway, end).squads, batched.squads);
    same(roundtrip(batched), batched);
  });
}

test("legacy ungrouped damage also consumes salves before the next event", () => {
  let s = start(assign(assign(buy(testState(1000, 3, 10, 1000), "salve", 10)), "leon"));
  const sq = s.squads[0],
    r = sq.run,
    q = questById(TOWER_QUEST);
  r.node = 1;
  configureTarget(r, q);
  delete r.enemies;
  delete r.road;
  schedule(s, sq, r, s.updatedAt);
  for (const health of Object.values(r.health)) health.hp = health.maxHp * 0.4;
  s = until(s, (s) => consumableStock(s, "salve") < 10);
  assert.ok(s.squads[0].run.events.some((e) => e.kind === "heal" && e.text.includes("傷薬")));
});

test("heal assist retains the existing 5 percent or 3 HP formula and consumes no item", () => {
  const s = start(assign(buy(testState(1000, 3, 10, 1000))));
  s.squads[0].run.health.aria = { hp: 10, maxHp: 100 };
  const helped = action(s, { type: "assist", mode: "heal", id: "aria" });
  assert.equal(helped.squads[0].run.health.aria.hp, 15);
  assert.equal(consumableStock(helped, "salve"), 1);
});

test("usage notice survives event eviction and expires without replaying on resume", () => {
  const s = start(
    assign(buy(testState(1000, 3, 10, 1000), "travel-biscuit"), "aria", "travel-biscuit"),
  );
  s.squads[0].run.events = [];
  assert.match(consumableNotice(roundtrip(s), 1000), /旅のビスケット/);
  assert.equal(consumableNotice(skipTo(s, 7000), 7000), "");
  assert.equal(consumableStock(s, "travel-biscuit"), 0);
});

test("changing destinations consumes again, while assigning mid-round never grants a retroactive bonus", () => {
  let s = start(buy(testState(1000, 3, 20, 1000), "travel-biscuit", 10), TOWN_QUEST);
  s = assign(s, "aria", "travel-biscuit");
  assert.equal(s.squads[0].run.consumableEffects, undefined);
  s = action(s, { type: "stop" });
  s = start(s, TOWER_QUEST);
  assert.equal(consumableStock(s, "travel-biscuit"), 9);
  assert.equal(s.squads[0].run.consumableEffects.aria, "travel-biscuit");
  s = action(s, { type: "stop" });
  s = start(s, TOWN_QUEST);
  assert.equal(consumableStock(s, "travel-biscuit"), 8);
});

test("departure rewards, repeats and inventory agree for one long advance and live updates", () => {
  let s = assign(buy(testState(1000, 3, 20, 1000), "travel-biscuit", 10), "aria", "travel-biscuit");
  s = start(s, TOWN_QUEST, true);
  const end = s.updatedAt + 600000,
    all = settle(s, end);
  let live = s;
  while (live.updatedAt < end) live = settleOnScreen(live, live.updatedAt + 200);
  same(all.squads, live.squads);
  same(all.xp, live.xp);
  same(all.consumables, live.consumables);
  assert.ok(consumableStock(all, "travel-biscuit") < 9);
});

test("a sweeping hit resolves the last shared salve once in the stable target order", () => {
  const s = start(assign(assign(buy(testState(1000, 3, 10, 1000))), "leon"));
  const sq = s.squads[0],
    r = sq.run;
  delete r.road;
  r.health.aria = { hp: 40, maxHp: 100 };
  r.health.leon = { hp: 40, maxHp: 100 };
  r.enemies = [
    {
      id: "enemy-1",
      hp: 100,
      maxHp: 100,
      resistance: 0,
      attack: 10,
      period: 1000,
      nextAt: 1000,
      role: "sweeper",
    },
  ];
  groupEnemyTurns(s, sq, r, questById(r.quest), 1000, event);
  assert.equal(consumableStock(s, "salve"), 0);
  const used = r.events.filter((e) => e.kind === "heal");
  assert.equal(used.length, 1);
  assert.equal(used[0].hero, "aria");
  assert.ok(r.health.aria.hp > 40);
  assert.ok(r.health.leon.hp < 40);
});

test("Auto-Next consumes at the next real departure after a completed stage", () => {
  let s = assign(buy(testState(1000, 3, 20, 1000), "travel-biscuit", 10), "aria", "travel-biscuit");
  s.autoNextQuest = true;
  s.story.read.push(TOWER_QUEST + "-departure");
  s.story.departed.push(TOWER_QUEST);
  s = start(s, TOWN_QUEST);
  s = until(s, (s) => s.squads[0].run?.quest === TOWER_QUEST);
  assert.equal(consumableStock(s, "travel-biscuit"), 8);
  assert.equal(s.squads[0].run.consumableEffects.aria, "travel-biscuit");
});
