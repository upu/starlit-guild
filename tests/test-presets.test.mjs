import { test } from "node:test";
import assert from "node:assert/strict";
import chapterStates from "../lib/generated/chapter-test-states.json" with { type: "json" };
import { testPresets, testPresetState } from "../lib/test-presets.ts";
import { level } from "../lib/game.ts";
import { storyStages, stageUnlocked } from "../lib/prologue.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { bundleSchema } from "../lib/save-format.ts";

test("chapter snapshots cover every implemented stage and expose each chapter entry plus latest completion", () => {
  assert.deepEqual(
    chapterStates.flatMap((c) => c.quests),
    storyStages.map((s) => s.quest),
    "新章の標準試走を生成スクリプトに追加してください",
  );
  assert.equal(testPresets.length, chapterStates.length + 1);
  assert.deepEqual(
    testPresets.map((p) => p.name),
    ["強くて最初から", "2章・標準", "3章・標準", "3章・クリア状態"],
  );
});

test("presets preserve earned equipment and story gates, and create independent valid idle saves", () => {
  for (const preset of testPresets) {
    const state = testPresetState(preset.id, 2000);
    const id = "11111111-1111-4111-8111-111111111111";
    assert.ok(
      bundleSchema.safeParse({
        format: 4,
        deviceId: id,
        active: id,
        profiles: [{ id, name: preset.name, test: true, state }],
        serial: 0,
        sound: false,
        cloudAt: 0,
      }).success,
    );
    assert.equal(state.updatedAt, 2000);
    assert.ok(state.squads.every((s) => !s.run));
    if (preset.completedChapter) {
      const source = chapterStates.find((c) => c.chapter === preset.completedChapter).state;
      for (const key of ["xp", "owned", "inventory", "techniques", "gold", "story", "done"])
        assert.deepEqual(state[key], source[key]);
    }
    state.xp.aria = 999;
    assert.notEqual(testPresetState(preset.id, 2000).xp.aria, 999);
    if (state.inventory) {
      state.inventory.items["travel-clothes"] = 999;
      assert.notEqual(testPresetState(preset.id, 2000).inventory.items["travel-clothes"], 999);
    }
  }
  const strong = testPresetState("strong-start", 1000);
  assert.deepEqual(strong.story.read, []);
  assert.deepEqual(strong.owned, ["aria", "leon"]);
  assert.equal(level(strong.xp.aria), 50);
  assert.equal(strong.gold, 1000000);
  const two = testPresetState("chapter-2", 1000);
  assert.equal(stageUnlocked(two, "hilltop-picnic"), true);
  assert.deepEqual(two.owned, ["aria", "leon"]);
  const three = testPresetState("chapter-3", 1000);
  assert.equal(pendingInterlude(three).id, "interlude-walnut-lunch");
  assert.equal(three.squads[0].lastQuest, "interlude-walnut-lunch");
  assert.equal(stageUnlocked(three, "berne-road"), false);
  assert.deepEqual(three.owned, ["aria", "leon", "mira"]);
  const clear = testPresetState("latest-clear", 1000);
  assert.equal(pendingInterlude(clear), undefined);
  assert.ok(clear.story.read.includes("berne-restoration-return"));
  assert.equal(clear.owned.length, 4);
});
