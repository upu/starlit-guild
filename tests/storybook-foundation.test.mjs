import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { foundationGear } from "../lib/road-foundation-return.ts";
import { foundationAssets } from "../lib/road-berne-foundation.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import sharp from "sharp";

test("mason walking and inspection retain standing scale and the common ground contact", async () => {
  const metrics = JSON.parse(
    await readFile("public/storybook-study/mason-motion-metrics.json", "utf8"),
  );
  assert.equal(metrics.length, 8);
  assert.equal(metrics[0].height, 94);
  for (const pose of metrics) {
    assert.equal(pose.scale, metrics[0].scale);
    assert.equal(pose.top + pose.height, 120);
    assert.ok(pose.left > 0 && pose.left + pose.width < 128);
  }
  assert.ok(metrics[5].height < metrics[0].height * 0.8);
  const walking = metrics.slice(0, 5).map((pose) => pose.height);
  assert.ok(Math.max(...walking) - Math.min(...walking) <= 4);
});

test("foundation luggage retains the same dimensions on the floor, in palms, and through departure", () => {
  const expected = { basket: 5.5, "medicine-closed": 5.2, "delivery-bag": 7 };
  for (let line = 0; line < 18; line++) {
    const cue = studyCue("missing-keystone-return", line, true);
    for (const step of [cue, ...(cue.sequence ?? [])]) {
      for (const item of step.items.filter((item) => expected[item.art]))
        assert.equal(item.width, expected[item.art]);
    }
    if (cue.sequence?.length) assert.equal(cue.finishBeforeAdvance, true);
  }
  for (const item of storybookExitCue("missing-keystone-return").items.filter(
    (item) => expected[item.art],
  )) {
    assert.equal(item.width, expected[item.art]);
    assert.equal(item.wrist, true);
  }
});

test("survey papers lie on their table and remain attached while held", () => {
  const plans = studyCue("missing-keystone-departure", 2, true);
  assert.deepEqual(plans.extras.find((extra) => extra.id === "keeper").wristPoints[1], [92, 68]);
  for (const step of [plans, ...plans.sequence]) {
    for (const item of step.items.filter((item) => item.support === "inspection-table"))
      assert.equal(item.pitch, 55);
    const district = step.items.find((item) => item.id === "district-plan");
    assert.equal(district.width, 4.5);
    if (district.extra) assert.equal(district.wrist, true);
  }
  const receipt = studyCue("missing-keystone-departure", 6, true).sequence[0].items.find(
    (item) => item.id === "shipping-copy",
  );
  assert.equal(receipt.wrist, true);
  assert.equal(receipt.actor, "finn");
});

test("the tools remain in the same place when the return conversation opens", () => {
  const cue = studyCue("missing-keystone-return", 0, true);
  const tools = cue.items.find((item) => item.art === "tools");
  const source = foundationGear.find(([id]) => id === "foundation-tools");
  // This outdoor stage uses a 72% world inside the full background.
  const storyX = 0.14 + (0.72 * tools.x) / 100;
  const storyY = 0.09 + 0.72 * (1 - tools.bottom / 100);
  assert.ok(Math.abs(storyX - source[2] / 1536) < 0.01);
  assert.ok(Math.abs(storyY - source[3] / 1024) < 0.01);
});

test("departure and investigation use the same windowed tower background", async () => {
  const source = await readFile("assets/source/storybook/berne-foundation-grass-v2.png");
  const delivery = await readFile("public/storybook-study/berne-foundation-grass-v2.png");
  assert.ok(source.equals(delivery));
  const { width, height } = await sharp(delivery).metadata();
  assert.deepEqual([width, height], [1536, 1024]);
  assert.equal(
    storybookPresentation("missing-keystone-departure").art,
    "berne-foundation-grass-v2",
  );
  assert.equal(foundationAssets.bank, "/storybook-study/berne-foundation-grass-v2.png");
});
