import { test } from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState, allQuests } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { parseBundle } from "../lib/save-format.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";

function start(index = 15) {
  return act(
    testState(1000, index, 30, 1000),
    {
      type: "start",
      id: storyStages[index].quest,
      value: false,
      readDeparture: true,
    },
    1000,
  );
}
function until(s, condition) {
  for (let i = 0; i < 10000 && s.squads[0].run; i++) {
    if (condition(s.squads[0].run)) return s;
    s = settle(s, s.squads[0].run.nextAt).state;
  }
  throw Error("Expected scene was not reached");
}
function roundtrip(state) {
  const id = "11111111-1111-4111-8111-111111111111";
  return parseBundle(
    JSON.parse(
      JSON.stringify({
        format: 4,
        deviceId: id,
        active: id,
        profiles: [{ id, name: "演出確認", test: true, state }],
        serial: 0,
        sound: false,
        cloudAt: 0,
        legacyImported: true,
      }),
    ),
  ).profiles[0].state;
}
const view = (s, now = s.updatedAt) =>
  chapterRoadFrame({
    squad: s.squads[0],
    startQuest: s.squads[0].lastQuest,
    now,
    ready: true,
    paused: false,
  });

test("pushed-forward dolls withdraw before the final formation enters, with saved combat held", () => {
  let s = until(start(), (r) => r.node === 1);
  const road = s.squads[0].run.road;
  // Reproduce a long battle that has pushed everyone far past the fixed next waypoint.
  for (const p of [...Object.values(road.members), ...Object.values(road.opponents)]) {
    p.x += 1800;
    p.previousX += 1800;
  }
  road.camera += 1800;
  road.previousCamera += 1800;
  s = until(s, (r) => r.road.scene?.kind === "withdraw");
  assert.equal(s.squads[0].run.node, 1);
  const saved = roundtrip(s),
    before = view(saved).battle;
  const retreat = view(saved, saved.updatedAt + 1200).battle;
  assert.equal(before.scene, "withdraw");
  assert.equal(before.enemies.length, 2);
  assert.ok(retreat.enemies.every((e, i) => e.x > before.enemies[i].x));
  assert.ok(retreat.heroes.every((h) => !h.walking));
  assert.deepEqual(retreat.effects, []);
  const tapped = act(saved, { type: "assist" }, saved.updatedAt + 500);
  assert.deepEqual(tapped.squads[0].run, saved.squads[0].run);
  const entry = settle(saved, saved.squads[0].run.nextAt).state;
  const r = entry.squads[0].run;
  assert.equal(r.node, 2);
  assert.equal(r.road.scene.kind, "enter");
  assert.equal(r.enemies.length, 3);
  const front = Math.max(...Object.values(r.road.members).map((p) => p.x));
  assert.ok(Object.values(r.road.opponents).every((p) => p.x >= front + 240));
  const entering = view(entry).battle;
  const ready = view(entry, r.nextAt - 1).battle;
  assert.ok(entering.enemies.every((e, i) => e.x > ready.enemies[i].x + 1300));
  assert.deepEqual(roundtrip(entry), JSON.parse(JSON.stringify(entry)));
  const resumed = settle(entry, r.nextAt).state;
  assert.equal(resumed.squads[0].run.road.scene, undefined);
  assert.equal(resumed.squads[0].run.target, r.target);
  assert.deepEqual(resumed.squads[0].run.health, r.health);
  for (const mutation of [
    (r) => r.road.scene.at++,
    (r) => (r.road.scene.kind = "escape"),
    (r) => (r.quest = "begging-golem"),
  ]) {
    const invalid = structuredClone(entry);
    mutation(invalid.squads[0].run);
    assert.throws(() => roundtrip(invalid));
  }
});

test("stopped dolls remain visible and are dragged out before completion, exactly once after reload/offline", () => {
  let s = until(start(), (r) => r.node === 2 && !r.road.scene && r.enemies.some((e) => e.hp === 0));
  const defeated = view(s).battle.enemies.filter((e) => e.hp <= 0);
  assert.ok(defeated.length > 0);
  assert.ok(defeated.every((e) => e.pose === "fallen"));
  s = until(s, (r) => r.road.scene?.kind === "escape");
  s = roundtrip(s);
  const r = s.squads[0].run,
    quest = allQuests.find((q) => q.id === r.quest);
  assert.equal(s.done[r.quest], undefined);
  const escaping = view(s, s.updatedAt + 1300).battle;
  assert.equal(escaping.enemies.filter((e) => e.pose === "drag").length, 2);
  const master = escaping.enemies.find((e) => e.kind === "pumpety");
  assert.ok(escaping.enemies.filter((e) => e.pose === "drag").every((e) => e.x < master.x));
  assert.deepEqual(view(s, s.updatedAt + 2500).battle.heroes, view(s).battle.heroes);
  const final = settle(s, r.nextAt).state;
  assert.equal(final.squads[0].run, null);
  assert.equal(final.done[quest.id], 1);
  assert.equal(final.gold - s.gold, quest.gold);
  assert.equal(settle(final, r.nextAt + 10000).state.gold, final.gold);
  const offline = settle(s, s.updatedAt + 13 * 3600000).state;
  for (const key of ["gold", "xp", "done", "story"]) assert.deepEqual(offline[key], final[key]);
  assert.deepEqual(roundtrip(final), JSON.parse(JSON.stringify(final)));
});
