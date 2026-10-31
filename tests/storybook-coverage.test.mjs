import { test } from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { storyStages } from "../lib/prologue.ts";
import { nightBridgeAssets } from "../lib/road-night-bridge.ts";
import { restorationAssets } from "../lib/road-berne-restoration.ts";
import { adventureCoverageInput } from "../scripts/storybook-adventure-coverage.mjs";

test("every adventure selects an existing background through the normal visual handoff", async () => {
  for (const stage of storyStages) {
    const input = adventureCoverageInput(stage.quest);
    assert.equal(input.storybookHeroes, true, stage.quest);
    assert.ok(input.backgroundOverride, stage.quest);
    await access(`public${input.backgroundOverride}`);
  }
  assert.equal(
    adventureCoverageInput("keystone-night-road").backgroundOverride,
    nightBridgeAssets.bank,
  );
  assert.equal(
    adventureCoverageInput("berne-restoration").backgroundOverride,
    restorationAssets.bank,
  );
});
