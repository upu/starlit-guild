import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  testState,
  act,
  settle,
  memberStats,
  level,
  levelProgress,
} from "../lib/game.ts";
import { shopItems, inventoryOf, availableCopies, equipmentById } from "../lib/equipment.ts";
import { storyItems } from "../lib/story-items.ts";
import {
  prologueStages,
  TRADE_QUEST,
  RETURN_QUEST,
  TOWN_QUEST,
  TOWER_QUEST,
  NIGHT_QUEST,
  WETLAND_QUEST,
} from "../lib/prologue.ts";
import { parseBundle } from "../lib/save-format.ts";

function progress(count) {
  const s = initialState(1000);
  s.gold = 2000;
  for (const stage of prologueStages.slice(0, count)) {
    s.done[stage.quest] = 1;
    s.story.departed.push(stage.quest);
    s.story.completed.push(stage.quest);
    s.story.read.push(stage.quest + "-return");
  }
  return s;
}
function bundle(state) {
  const id = crypto.randomUUID();
  return {
    format: 4,
    deviceId: crypto.randomUUID(),
    active: id,
    profiles: [{ id, name: "test", test: false, state }],
    serial: 1,
    sound: false,
    cloudAt: 0,
  };
}
function action(s, a) {
  return act(s, a, s.updatedAt);
}
test("starter gear improves stats and shop gear remains an upgrade", () => {
  for (const [hero, weapon] of [
    ["aria", "ash-bow"],
    ["leon", "steel-sword"],
  ]) {
    const s = progress(3),
      starter = memberStats(s, hero);
    const bare = action(action(s, { type: "equip", hero, slot: "weapon" }), {
      type: "equip",
      hero,
      slot: "armor",
    });
    assert.deepEqual(
      starter,
      memberStats(bare, hero).map((v, i) => v + Number(i > 0)),
    );
    const bought = action(s, { type: "buy", id: weapon });
    const upgraded = action(bought, { type: "equip", hero, slot: "weapon", id: weapon });
    assert.ok(memberStats(upgraded, hero)[2] > starter[2]);
  }
});

test("joined old saves receive Mira gear once without replacing worn gear or expedition progress", () => {
  const old = testState(1000, 12, 14, 2000);
  delete old.inventory;
  const before = structuredClone(old);
  const loaded = parseBundle(bundle(old)).profiles[0].state;
  assert.deepEqual(old, before);
  assert.equal(loaded.inventory.items["travel-clothes"], 3);
  assert.equal(loaded.inventory.equipped.mira.weapon, "familiar-staff");
  const removed = action(action(loaded, { type: "equip", hero: "mira", slot: "weapon" }), {
    type: "equip",
    hero: "mira",
    slot: "armor",
  });
  assert.deepEqual(parseBundle(bundle(removed)).profiles[0].state, removed);
  const worn = action(action(old, { type: "buy", id: "leather-vest" }), {
    type: "equip",
    hero: "mira",
    slot: "armor",
    id: "leather-vest",
  });
  const away = action(worn, { type: "start", id: TOWER_QUEST, readDeparture: true });
  const migrated = parseBundle(bundle(away)).profiles[0].state;
  assert.equal(migrated.inventory.equipped.mira.armor, "leather-vest");
  assert.deepEqual(migrated.squads, away.squads);
  assert.deepEqual(parseBundle(bundle(migrated)).profiles[0].state, migrated);
});
test("shop unlocks after 1-3 and keeps its assortment through the whole first chapter", () => {
  const s = progress(0);
  s.clears = 500;
  s.done[TRADE_QUEST] = 500;
  assert.equal(shopItems(s).length, 0);
  assert.equal(shopItems(progress(2)).length, 0);
  assert.equal(shopItems(progress(3)).length, 4);
  for (const count of [4, 5, 6, 7, 8, 9])
    assert.deepEqual(shopItems(progress(count)), shopItems(progress(3)));
  const pending = progress(3);
  pending.story.read = pending.story.read.filter((id) => id !== TOWN_QUEST + "-return");
  assert.equal(shopItems(pending).length, 0);
});
test("purchases work during any expedition, consume exact gold and stay unequipped in the shared bag", () => {
  const s = action(progress(3), { type: "start", id: TOWER_QUEST, readDeparture: true }),
    before = structuredClone(s);
  const next = action(s, { type: "buy", id: "ash-bow" });
  assert.equal(next.gold, s.gold - 100);
  assert.equal(next.inventory.items["ash-bow"], 1);
  assert.equal(next.inventory.equipped.aria.weapon, "familiar-bow");
  assert.deepEqual(next.squads, s.squads);
  assert.deepEqual(s, before);
  assert.equal(action(next, { type: "buy", id: "ash-bow" }).inventory.items["ash-bow"], 2);
});
test("locked, unknown, invalid and unaffordable transactions leave original state untouched", () => {
  for (const [s, id] of [
    [progress(0), "ash-bow"],
    [progress(3), "future-bow"],
    [progress(3), "unknown"],
    [{ ...progress(3), gold: 0 }, "ash-bow"],
  ]) {
    const before = structuredClone(s);
    assert.throws(() => action(s, { type: "buy", id }));
    assert.deepEqual(s, before);
  }
  const s = progress(3);
  assert.throws(() => action(s, { type: "equip", hero: "aria", slot: "weapon", id: "ash-bow" }));
  assert.throws(() =>
    action(s, { type: "equip", hero: "leon", slot: "weapon", id: "familiar-bow" }),
  );
  assert.throws(() =>
    action(s, { type: "equip", hero: "mira", slot: "armor", id: "travel-clothes" }),
  );
});
test("one shared copy cannot be worn twice, unequipping returns it and stats change only for its wearer", () => {
  let s = action(progress(3), { type: "buy", id: "leather-vest" });
  const aria = memberStats(s, "aria"),
    leon = memberStats(s, "leon");
  s = action(s, { type: "equip", hero: "aria", slot: "armor", id: "leather-vest" });
  assert.equal(availableCopies(s, "leather-vest"), 0);
  assert.deepEqual(memberStats(s, "aria"), [aria[0], aria[1] + 1, aria[2]]);
  assert.deepEqual(memberStats(s, "leon"), leon);
  assert.throws(() =>
    action(s, { type: "equip", hero: "leon", slot: "armor", id: "leather-vest" }),
  );
  s = action(s, { type: "equip", hero: "aria", slot: "armor" });
  assert.equal(availableCopies(s, "leather-vest"), 1);
  assert.deepEqual(memberStats(s, "aria"), [aria[0], aria[1] - 1, aria[2]]);
  s = action(s, { type: "equip", hero: "leon", slot: "armor", id: "leather-vest" });
  assert.equal(memberStats(s, "leon")[1], leon[1] + 1);
});
test("equipment changes affect combat and preserve HP ratio without healing or reviving", () => {
  let s = action(progress(6), { type: "buy", id: "leather-vest" });
  s = action(s, { type: "buy", id: "ash-bow" });
  s = action(s, { type: "start", id: TOWER_QUEST, readDeparture: true });
  s.squads[0].run.health.aria.hp *= 0.4;
  const hp = s.squads[0].run.health.aria;
  const next = action(s, { type: "equip", hero: "aria", slot: "armor", id: "leather-vest" }),
    newHp = next.squads[0].run.health.aria;
  assert.ok(newHp.maxHp > hp.maxHp);
  assert.ok(Math.abs(newHp.hp / newHp.maxHp - 0.4) < 1e-12);
  const back = action(next, { type: "equip", hero: "aria", slot: "armor", id: "travel-clothes" });
  assert.ok(Math.abs(back.squads[0].run.health.aria.hp - hp.hp) < 1e-10);
  next.squads[0].run.health.aria.hp = 0;
  assert.equal(
    action(next, { type: "equip", hero: "aria", slot: "armor" }).squads[0].run.health.aria.hp,
    0,
  );
  while (s.squads[0].run.node === 0) s = settle(s, s.squads[0].run.nextAt).state;
  s.squads[0].run.actors.find((actor) => actor.hero === "aria").actions = 2;
  const equipped = action(s, { type: "equip", hero: "aria", slot: "weapon", id: "ash-bow" }),
    at = s.squads[0].run.actors.find((actor) => actor.hero === "aria").nextAt;
  assert.ok(
    settle(equipped, at).state.squads[0].run.target < settle(s, at).state.squads[0].run.target,
  );
});
test("save roundtrips preserve purchases and equipment while old saves retain their exact power and progress", () => {
  const old = progress(3),
    copy = structuredClone(old),
    parsed = parseBundle(bundle(old)).profiles[0].state;
  assert.deepEqual(old, copy);
  assert.equal(parsed.inventory, undefined);
  assert.deepEqual(memberStats(parsed, "aria"), memberStats(old, "aria"));
  assert.equal(inventoryOf(parsed).equipped.aria.weapon, "familiar-bow");
  const bought = action(old, { type: "buy", id: "ash-bow" }),
    equipped = action(bought, { type: "equip", hero: "aria", slot: "weapon", id: "ash-bow" });
  assert.deepEqual(parseBundle(bundle(equipped)).profiles[0].state, equipped);
});
test("save validation rejects phantom, duplicate, incompatible and unowned equipment", () => {
  const duplicate = action(progress(3), { type: "buy", id: "leather-vest" });
  duplicate.inventory.equipped.aria.armor = "leather-vest";
  duplicate.inventory.equipped.leon.armor = "leather-vest";
  assert.throws(() => parseBundle(bundle(duplicate)));
  for (const mutate of [
    (s) => (s.inventory.items["ash-bow"] = -1),
    (s) => (s.inventory.items["ash-bow"] = 0.5),
    (s) => (s.inventory.items.fake = 1),
    (s) => (s.inventory.items["ash-bow"] = 10000),
    (s) => (s.inventory.equipped.leon.weapon = "ash-bow"),
    (s) => (s.inventory.equipped.mira = { armor: "travel-clothes" }),
    (s) => (s.inventory.equipped.aria.armor = "ash-bow"),
    (s) => (s.inventory.equipped.aria.weapon = "future-bow"),
    (s) => (s.inventory.equipped.aria.ring = "ash-bow"),
  ]) {
    const s = action(progress(3), { type: "buy", id: "ash-bow" });
    mutate(s);
    assert.throws(() => parseBundle(bundle(s)));
  }
});
test("equipped saves settle identically in one offline step and repeated live steps", () => {
  let s = action(progress(3), { type: "buy", id: "leather-vest" });
  s = action(s, { type: "equip", hero: "aria", slot: "armor", id: "leather-vest" });
  s = action(s, { type: "start", id: TOWER_QUEST, readDeparture: true });
  const bulk = settle(s, 61000).state;
  let frames = s;
  for (let now = 2000; now <= 61000; now += 1000) frames = settle(frames, now).state;
  // Completion log timestamps record when each settlement was observed; gameplay must match.
  const { log: liveLog, ...liveState } = frames,
    { log: offlineLog, ...offlineState } = bulk;
  assert.deepEqual(liveState, offlineState);
  assert.deepEqual(
    liveLog.map((entry) => entry.text),
    offlineLog.map((entry) => entry.text),
  );
  assert.deepEqual(parseBundle(bundle(bulk)).profiles[0].state, bulk);
});
test("story inventory follows handovers and discoveries without spoilers or duplicate replay rewards", () => {
  assert.deepEqual(
    storyItems(progress(0)).map((item) => item.id),
    ["aria-trade", "leon-trade"],
  );
  assert.deepEqual(
    storyItems(progress(1)).map((item) => item.id),
    ["shopping-list"],
  );
  assert.deepEqual(
    storyItems(action(progress(1), { type: "start", id: RETURN_QUEST, readDeparture: true })).map(
      (item) => item.id,
    ),
    ["village-purchases"],
  );
  assert.deepEqual(storyItems(progress(2)), []);
  const pending = progress(4);
  pending.story.read = pending.story.read.filter((id) => id !== TOWER_QUEST + "-return");
  assert.equal(storyItems(pending).length, 0);
  const first = progress(4);
  assert.equal(storyItems(first)[0].id, "moss-lamp");
  assert.doesNotMatch(storyItems(first)[0].description, /弱ま|魔力|吸/);
  assert.match(storyItems(progress(5))[0].description, /弱まり/);
  assert.equal(storyItems(progress(6)).length, 2);
  const s = progress(6),
    before = storyItems(s);
  for (const quest of [TRADE_QUEST, TOWER_QUEST, NIGHT_QUEST, WETLAND_QUEST]) s.done[quest] = 200;
  assert.deepEqual(storyItems(s), before);
  assert.deepEqual(
    storyItems(action(s, { type: "readStory", id: TOWER_QUEST + "-return" })),
    before,
  );
});
test("armour bought once is worn by one companion and stays in the save", () => {
  let s = testState(1000, 12, 1, 1000);
  s = action(s, { type: "buy", id: "leather-vest" });
  s = action(s, { type: "equip", hero: "mira", slot: "armor", id: "leather-vest" });
  assert.equal(availableCopies(s, "leather-vest"), 0);
  assert.doesNotThrow(() => parseBundle(bundle(s)));
  assert.ok(equipmentById("leather-vest"));
});

test("level progress matches the level formula and stops at the cap", () => {
  assert.deepEqual(levelProgress(0), {
    level: 1,
    xp: 0,
    start: 0,
    next: 30,
    remaining: 30,
    ratio: 0,
  });
  for (const xp of [29, 30, 119, 120, 3850, 30 * 48 ** 2, 30 * 49 ** 2 - 1]) {
    const progress = levelProgress(xp);
    assert.equal(progress.level, level(xp));
    assert.equal(level(progress.start), progress.level);
    assert.equal(level(progress.next), progress.level + 1);
    assert.equal(level(progress.next - 1), progress.level);
    assert.equal(progress.remaining, progress.next - xp);
    assert.ok(progress.ratio >= 0 && progress.ratio < 1);
  }
  for (const xp of [30 * 49 ** 2, 72030, 200000]) {
    const progress = levelProgress(xp);
    assert.equal(progress.level, 50);
    assert.equal(progress.xp, xp);
    assert.equal(progress.next, null);
    assert.equal(progress.remaining, 0);
    assert.equal(progress.ratio, 1);
  }
});
