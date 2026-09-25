import { test } from "node:test";
import assert from "node:assert/strict";
import * as game from "../lib/game.ts";
import { nextStage } from "../lib/prologue.ts";
import { parseBundle } from "../lib/save-format.ts";
const start = (s = game.initialState(1000), quest = nextStage(s).quest) =>
  game.act(s, { type: "start", id: quest }, s.updatedAt);
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
test("each character has independent HP and enemy attacks name its target", () => {
  let s = start(game.testState(1000, 3, 1, 200));
  const before = structuredClone(s.squads[0].run.health);
  assert.deepEqual(Object.keys(before), ["aria", "leon"]);
  assert.notEqual(before.aria.maxHp, before.leon.maxHp);
  let after = s.squads[0].run,
    hurt;
  for (let i = 0; !hurt && i < 200; i++) {
    after = game.settle(s, s.squads[0].run.enemyAt).state.squads[0].run;
    hurt = after.events.find((event) => event.kind === "hurt");
    if (!hurt) s = game.settle(s, s.squads[0].run.nextAt).state;
  }
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
test("characters use actual special effects, and an automatic combination crosses node boundaries", () => {
  let s = start(game.testState(1000, 3, 1, 1000));
  const kinds = new Set(),
    skills = new Set();
  for (let i = 0; s.updatedAt < 61000 && s.squads[0].run; i++) {
    s = game.settle(s, s.squads[0].run.nextAt).state;
    for (const e of s.squads[0].run?.events || []) {
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
  const s = start(game.testState(1000, 3, 1, 1000));
  const enhanced = structuredClone(s);
  enhanced.friendship["aria-leon"] = 24;
  const a = game.settle(s, 15500).state.squads[0].run,
    b = game.settle(enhanced, 15500).state.squads[0].run;
  assert.notDeepEqual(a.scene.lines, b.scene.lines);
  assert.match(b.scene.title, /Lv.3/);
});
test("party names follow their members", () => {
  const s = game.initialState(1000);
  assert.equal(game.squadName(s.squads[0]), "レオン・アリア");
  assert.throws(() => game.act(s, { type: "nameSquad", name: "幼なじみ組" }, 1000));
  assert.doesNotThrow(() => parseBundle(bundle(s)));
});
test("offline and small updates produce the same rewards, friendship and timelines", () => {
  const s = start(),
    bulk = game.settle(s, 601000).state;
  let frames = s;
  for (let now = 1100; now <= 601000; now += 100) frames = game.settle(frames, now).state;
  for (const key of ["gold", "herbs", "ore", "xp", "clears", "friendship", "squads"])
    assert.deepEqual(frames[key], bulk[key], key);
});
test("offline cap and every transition remain exportable, including rest", () => {
  let s = start(game.testState(1000, 15, 1, 20000));
  for (let i = 0; i < 500; i++) {
    s = game.settle(s, s.squads[0].run.nextAt).state;
    assert.doesNotThrow(() => parseBundle(bundle(s)));
  }
  const result = game.settle(s, s.updatedAt + 86400000);
  assert.equal(result.rewards.capped, true);
  assert.doesNotThrow(() => parseBundle(bundle(result.state)));
  assert.equal(result.rewards.gold, result.state.gold - s.gold);
});
