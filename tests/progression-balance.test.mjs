import { test } from "node:test";
import assert from "node:assert/strict";
import { trainedChapter } from "../scripts/check-combat-balance.mjs";
import { chapterRoute } from "../scripts/check-chapter-two-balance.mjs";
import { progressionRoute } from "../scripts/check-progression-balance.mjs";

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
