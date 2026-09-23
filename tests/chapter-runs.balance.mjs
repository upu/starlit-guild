// Full chapter runs take about 25 seconds, so they are run by hand when combat,
// growth, rewards or chapters change instead of on every CI run.
import { test } from "node:test";
import assert from "node:assert/strict";
import { testState, level } from "../lib/game.ts";
import { parseBundle } from "../lib/save-format.ts";
import { STONE_RETURN_QUEST } from "../lib/chapter-three.ts";
import { chapterComparisons, trainedChapter } from "../scripts/check-combat-balance.mjs";
import { chapterRoute, measure } from "../scripts/check-chapter-two-balance.mjs";
import { chapterThreeRoute, outfitBerne } from "../scripts/check-chapter-three-balance.mjs";
import { progressionRoute } from "../scripts/check-progression-balance.mjs";

function roundtrip(s) {
  const id = "11111111-1111-4111-8111-111111111111";
  return parseBundle(
    JSON.parse(
      JSON.stringify({
        format: 4,
        deviceId: id,
        active: id,
        profiles: [{ id, name: "chapter run", test: true, state: s }],
        serial: 0,
        sound: false,
        cloudAt: 0,
        legacyImported: true,
      }),
    ),
  ).profiles[0].state;
}

test("first chapter: weapons allow earlier clears, more levels work without new equipment, and actual farming reaches the finale", () => {
  const records = chapterComparisons();
  const result = (quest, lv, equipped) =>
    records.find((r) => r.quest === quest && r.levels[0] === lv && r.equipped === equipped);
  assert.equal(result("tower-restoration", 8, false).cleared, false);
  assert.equal(result("tower-restoration", 8, true).cleared, true);
  assert.equal(result("tower-moss-removal", 10, false).cleared, false);
  assert.equal(result("tower-moss-removal", 10, true).cleared, true);
  assert.equal(result("tower-moss-removal", 15, false).cleared, true);
  const trained = trainedChapter();
  assert.equal(trained.records.length, 9);
  assert.ok(trained.records.every((r) => r.cleared));
  assert.ok(trained.trainingSeconds >= 600 && trained.trainingSeconds <= 3600);
  assert.ok(trained.totalSeconds < 7200);
});

test("second chapter: standard reaches the end through earned growth; strong needs no farming", () => {
  const standard = chapterRoute(),
    strong = chapterRoute("strong");
  assert.equal(standard.records.length, 9);
  assert.ok(standard.records.every((r) => r.cleared));
  assert.ok(standard.trainingSeconds >= 1800 && standard.trainingSeconds <= 3600);
  assert.ok(standard.totalSeconds > standard.trainingSeconds);
  assert.equal(strong.records.length, 9);
  assert.ok(strong.records.every((r) => r.cleared && r.rests === 0));
  assert.equal(strong.trainingSeconds, 0);
});

test("chapter continuity carries earned state without mutation or a reset of elapsed time", () => {
  const first = trainedChapter(true),
    before = structuredClone(first.state);
  const next = chapterRoute("standard", first.state);
  assert.deepEqual(first.state, before);
  assert.equal(next.records.length, 9);
  assert.ok(next.records.every((r) => r.cleared));
  assert.equal(
    next.totalSeconds,
    Math.round((next.state.updatedAt - first.state.updatedAt) / 1000),
  );
  assert.ok(next.trainingSeconds >= 1800 && next.trainingSeconds <= 3600);
  for (const hero of before.owned) {
    assert.ok(next.state.xp[hero] > before.xp[hero]);
    assert.deepEqual(next.state.inventory.equipped[hero], before.inventory.equipped[hero]);
  }
  for (const id of before.story.read) assert.ok(next.state.story.read.includes(id));
  const {
    chapters: [one, two],
  } = progressionRoute();
  assert.deepEqual(two.start, one.end);
  assert.equal(two.cumulativeStartSeconds, one.cumulativeEndSeconds);
  assert.equal(two.cumulativeEndSeconds, one.totalSeconds + two.totalSeconds);
  assert.ok(two.end.members.some((m) => m.id === "mira"));
});

test("third chapter: earned chapter-two state carries through all nine stages with sustainable growth and equipped advantage", () => {
  const first = trainedChapter(true),
    second = chapterRoute("standard", first.state);
  const original = structuredClone(second.state);
  const third = chapterThreeRoute(second.state);
  assert.deepEqual(second.state, original);
  assert.equal(third.records.length, 9);
  assert.ok(third.records.every((r) => r.cleared));
  assert.ok(third.trainingSeconds <= 3600, "implementation guardrail, not an agreed time target");
  assert.ok(third.state.owned.every((id) => level(third.state.xp[id]) >= 20));
  assert.deepEqual(roundtrip(third.state), JSON.parse(JSON.stringify(third.state)));
  const start = testState(1000, 25, 19, 10000);
  const plain = measure(start, STONE_RETURN_QUEST);
  const equipped = measure(outfitBerne(start), STONE_RETURN_QUEST);
  assert.ok(
    equipped.record.cleared || equipped.state.squads[0].run.node > plain.state.squads[0].run.node,
  );
  const strong = measure(outfitBerne(testState(1000, 25, 30, 10000)), STONE_RETURN_QUEST);
  assert.ok(strong.record.cleared);
  assert.equal(strong.record.rests, 0);
});
