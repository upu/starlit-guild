import { test } from "node:test";
import assert from "node:assert/strict";
import * as game from "../lib/game.ts";
import { parseBundle } from "../lib/save-format.ts";
const start = (g = game, s = g.initialState(1000), quest = "herbs") =>
  g.act(s, { type: "start", id: quest }, s.updatedAt);
function bundle(state, format = 4) {
  const id = crypto.randomUUID();
  return {
    format,
    deviceId: crypto.randomUUID(),
    active: id,
    profiles: [{ id, name: "test", test: false, state }],
    serial: 1,
    sound: false,
    cloudAt: 0,
    legacyImported: true,
  };
}
test("checkpoint rewards survive return without marking an unfinished quest complete", () => {
  let s = start();
  while (s.squads[0].run.node < 3) s = game.settle(s, s.squads[0].run.nextAt).state;
  assert.equal(s.clears, 0);
  assert.ok(s.gold > 60);
  const before = s.gold;
  s = game.act(s, { type: "stop" }, s.updatedAt);
  assert.equal(s.gold, before);
  assert.equal(s.clears, 0);
});
test("20 assists trigger one all-party burst and carry the gauge across nodes", () => {
  let s = start();
  for (let i = 0; i < 19; i++) s = game.act(s, { type: "assist", mode: "strike" }, 1000);
  assert.equal(s.squads[0].run.cheer, 95);
  s = game.act(s, { type: "assist", mode: "strike" }, 1000);
  const r = s.squads[0].run;
  assert.equal(r.cheer, 0);
  assert.equal(r.scene.kind, "burst");
  assert.deepEqual(
    new Set(r.events.filter((e) => e.kind === "burst").map((e) => e.hero)),
    new Set(["aria", "leon"]),
  );
  assert.equal(new Set(r.events.map((e) => e.id)).size, r.events.length);
});
test("each character has independent HP and enemy attacks name its target", () => {
  const s = start(game, game.legacyTestState(1000, 4, 1, 200), "slime"),
    before = structuredClone(s.squads[0].run.health),
    at = s.squads[0].run.enemyAt;
  assert.deepEqual(Object.keys(before), ["aria", "leon"]);
  assert.notEqual(before.aria.maxHp, before.leon.maxHp);
  const after = game.settle(s, at).state.squads[0].run,
    hurt = after.events.find((event) => event.kind === "hurt" && event.at === at);
  assert.ok(hurt?.target);
  assert.ok(after.health[hurt.target].hp < before[hurt.target].hp);
  const safe = hurt.target === "aria" ? "leon" : "aria";
  assert.equal(after.health[safe].hp, before[safe].hp);
});
test("healing targets one character, and the party rests only when everyone is down", () => {
  let s = start();
  s.squads[0].run.health.aria.hp = 0;
  s.squads[0].run.health.leon.hp -= 10;
  const leon = s.squads[0].run.health.leon.hp;
  s = game.act(s, { type: "assist", mode: "heal", id: "aria" }, 1000);
  assert.ok(s.squads[0].run.health.aria.hp > 0);
  assert.equal(s.squads[0].run.health.leon.hp, leon);
  assert.equal(s.squads[0].run.events.at(-1).target, "aria");
  s.squads[0].run.health.aria.hp = 0;
  const ariaActor = s.squads[0].run.actors.find((actor) => actor.hero === "aria"),
    actions = ariaActor.actions;
  s = game.settle(s, ariaActor.nextAt).state;
  assert.equal(s.squads[0].run.actors.find((actor) => actor.hero === "aria").actions, actions);
  assert.notEqual(s.squads[0].run.phase, "rest");
  for (const health of Object.values(s.squads[0].run.health)) health.hp = 0;
  s = game.settle(s, s.squads[0].run.nextAt).state;
  assert.equal(s.squads[0].run.phase, "rest");
});
test("shared-HP v4 saves migrate their remaining ratio to every character", () => {
  const current = start(),
    legacy = structuredClone(current),
    total = Object.values(legacy.squads[0].run.health).reduce(
      (sum, health) => sum + health.maxHp,
      0,
    );
  delete legacy.squads[0].run.health;
  legacy.squads[0].run.hp = total * 0.5;
  legacy.squads[0].run.maxHp = total;
  const upgraded = game.migrate(legacy, 1000);
  for (const health of Object.values(upgraded.squads[0].run.health))
    assert.ok(Math.abs(health.hp / health.maxHp - 0.5) < 0.02);
  assert.doesNotThrow(() => parseBundle(bundle(legacy)));
});
test("detours finish automatically or earlier when clicked, without duplicate rewards", () => {
  let s = start();
  const d = s.squads[0].run.detour;
  assert.ok(d);
  s = game.settle(s, d.at).state;
  const clicked = game.act(s, { type: "detour" }, s.updatedAt);
  assert.ok(clicked.squads[0].run.detour.finishAt < d.finishAt);
  const fast = game.settle(clicked, clicked.squads[0].run.detour.finishAt).state;
  assert.equal(fast.discoveries, 1);
  const auto = game.settle(s, d.finishAt).state;
  assert.equal(auto.discoveries, 1);
  assert.equal(auto.wood, fast.wood);
  assert.equal(game.settle(fast, fast.updatedAt).state.discoveries, 1);
});
test("characters use actual special effects, and an automatic combination crosses node boundaries", () => {
  let s = start();
  const kinds = new Set(),
    skills = new Set();
  for (let i = 0; i < 100; i++) {
    s = game.settle(s, s.squads[0].run.nextAt).state;
    for (const e of s.squads[0].run.events) {
      kinds.add(e.kind);
      if (e.kind === "skill") skills.add(e.hero);
    }
  }
  assert.ok(kinds.has("combo"));
  assert.ok(skills.has("aria"));
  assert.ok(skills.has("leon"));
  assert.ok(s.friendship["aria-leon"] > 0);
});
test("higher friendship unlocks stronger linked attacks and new dialogue", () => {
  const s = start();
  const enhanced = structuredClone(s);
  enhanced.friendship["aria-leon"] = 24;
  const a = game.settle(s, 15500).state.squads[0].run,
    b = game.settle(enhanced, 15500).state.squads[0].run;
  assert.notDeepEqual(a.scene.lines, b.scene.lines);
  assert.match(b.scene.title, /Lv.3/);
});
test("building consumes materials once, upgrades real stats, and respects unlocks", () => {
  assert.throws(() => game.act(game.initialState(1000), { type: "build" }, 1000));
  let s = game.legacyTestState(1000, 3, 1, 1000);
  s.town = 0;
  const before = game.stats(s, s.squads[0]);
  s = game.act(s, { type: "build" }, 1000);
  assert.equal(s.town, 1);
  assert.equal(s.gold, 880);
  assert.equal(s.wood, 33);
  s.wood = 100;
  s.herbs = 100;
  s.ore = 100;
  s = game.act(s, { type: "build" }, 1000);
  assert.equal(s.town, 2);
  assert.ok(game.stats(s, s.squads[0])[0] > before[0]);
  assert.throws(() => game.act(s, { type: "build" }, 1000));
});
test("party names follow members by default and can be customized after the prologue", () => {
  let s = game.initialState(1000);
  assert.equal(game.squadName(s.squads[0]), "レオン・アリア");
  assert.throws(() =>
    game.act(game.initialPrologueState(1000), { type: "nameSquad", name: "幼なじみ組" }, 1000),
  );
  s = game.act(s, { type: "party", members: ["aria"] }, 1000);
  assert.equal(game.squadName(s.squads[0]), "アリア");
  s = game.act(s, { type: "nameSquad", name: " 風の道しるべ " }, 1000);
  assert.equal(game.squadName(s.squads[0]), "風の道しるべ");
  s = game.act(s, { type: "party", members: ["leon"] }, 1000);
  assert.equal(game.squadName(s.squads[0]), "風の道しるべ");
  assert.doesNotThrow(() => parseBundle(bundle(s)));
  s = game.act(s, { type: "nameSquad", name: " " }, 1000);
  assert.equal(game.squadName(s.squads[0]), "レオン");
  assert.equal(s.squads[0].customName, undefined);
});
test("offline and small updates produce the same rewards, detours, friendship and timelines", () => {
  const s = start(),
    bulk = game.settle(s, 601000).state;
  let frames = s;
  for (let now = 1100; now <= 601000; now += 100) frames = game.settle(frames, now).state;
  for (const key of [
    "gold",
    "wood",
    "herbs",
    "ore",
    "xp",
    "clears",
    "friendship",
    "discoveries",
    "squads",
  ])
    assert.deepEqual(frames[key], bulk[key], key);
});
test("offline cap and every transition remain exportable, including rest", () => {
  let s = start(game, game.legacyTestState(1000, 60, 1, 20000), "dragon");
  for (let i = 0; i < 500; i++) {
    s = game.settle(s, s.squads[0].run.nextAt).state;
    assert.doesNotThrow(() => parseBundle(bundle(s)));
  }
  const result = game.settle(s, s.updatedAt + 86400000);
  assert.equal(result.rewards.capped, true);
  assert.doesNotThrow(() => parseBundle(bundle(result.state)));
  assert.equal(result.rewards.wood, result.state.wood - s.wood);
});

test("saves keep story records and drop the legacy ones instead of failing to load", () => {
  const story = game.initialPrologueState(1000),
    legacy = game.initialState(1000);
  legacy.clears = 60;
  const id = crypto.randomUUID(),
    storyId = crypto.randomUUID();
  const mixed = {
    ...bundle(legacy),
    active: id,
    profiles: [
      { id, name: "以前の冒険", test: false, state: legacy },
      { id: storyId, name: "物語の冒険", test: false, state: story },
    ],
  };
  const parsed = parseBundle(JSON.parse(JSON.stringify(mixed)));
  assert.deepEqual(
    parsed.profiles.map((p) => p.id),
    [storyId],
    "従来記録だけを落とし、物語モードの記録は残す",
  );
  assert.equal(parsed.active, storyId, "選択中だった従来記録の代わりに残った記録を選ぶ");

  // A file with nothing but legacy records still opens, as a new story record.
  const onlyLegacy = parseBundle(JSON.parse(JSON.stringify(bundle(legacy))));
  assert.equal(onlyLegacy.profiles.length, 1);
  assert.equal(onlyLegacy.profiles[0].state.prologue, true);
  assert.equal(onlyLegacy.profiles[0].state.clears, 0);
  assert.equal(onlyLegacy.active, onlyLegacy.profiles[0].id);
});
