import { test } from "node:test";
import assert from "node:assert/strict";
import { boxPainter } from "../app/story-stage-box-motion.ts";
import { storyStageCue } from "../lib/story-stage.ts";
import { merchantPlacement } from "../lib/storybook/merchant-placement.ts";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";

test("a same-mode offset change moves from the displayed box instead of teleporting", () => {
  const box = { style: {} };
  const stage = { querySelector: () => box };
  const state = {};
  const positions = new Map();
  const held = { box: "table", boxOffset: { x: -5.5, bottom: 9 } };
  boxPainter(stage, held, state)(positions, 0, false);
  assert.equal(box.style.bottom, "36%");
  const lowered = { ...held, boxOffset: { x: -5.5, bottom: 0 } };
  const paint = boxPainter(stage, lowered, state);
  paint(positions, 0, false);
  assert.equal(box.style.bottom, "36%");
  paint(positions, 325, false);
  assert.equal(box.style.bottom, "31.5%");
  paint(positions, 650, false);
  assert.equal(box.style.bottom, "27%");
  boxPainter(stage, held, state)(positions, 0, true);
  assert.equal(box.style.bottom, "36%", "reduced motion settles directly");
});

test("the merchant releases only after the parcel lands and retains planted feet", () => {
  const original = storyStageCue("town-deliveries-departure", 0);
  const before = JSON.stringify(original);
  const cue = merchantPlacement(original, 0);
  const [lower, release, rest] = cue.sequence;
  assert.ok(release.after - lower.after >= 650);
  assert.equal(cue.finishBeforeAdvance, true);
  for (const step of [cue, lower, release]) {
    assert.equal(step.extras[0].x, 41);
    assert.equal(step.extras[0].bottom, 21);
  }
  assert.equal(lower.extras[0].handOver.item, "delivery-table");
  assert.equal(rest.extras[0].handOver, undefined);
  assert.equal(rest.extras[0].x, 52, "clear the pair's working space after releasing");
  assert.equal(rest.extras[0].bottom, 27);
  assert.equal(JSON.stringify(original), before);
});

test("the merchant stays through each departure page and its box-lowering sequence", () => {
  for (let page = 0; page < 15; page++) {
    const cue = studyCue("town-deliveries-departure", page, true);
    for (const moment of [cue, ...(cue.sequence ?? [])]) {
      assert.equal(
        moment.extras?.filter((extra) => extra.id === "merchant").length,
        1,
        `the merchant remains present on page ${page + 1}`,
      );
    }
  }
});

test("the warehouse return keeps the merchant and placed props through every page and exit", () => {
  const id = "town-deliveries-return";
  for (let page = 0; page < 25; page++) {
    const original = storyStageCue(id, page);
    const before = JSON.stringify(original);
    const cue = studyCue(id, page, true);
    assert.equal(storybookPresentation(id, cue.background, page).art, "warehouse-v1");
    assert.equal(cue.extras.find((e) => e.id === "merchant").pose, original.merchant.pose);
    assert.equal(cue.box, undefined, "finished deliveries must not reappear");
    assert.ok(cue.items.some((i) => i.id === "empty-wrap"));
    assert.ok(cue.items.some((i) => i.id === "delivery-receipts"));
    assert.equal(JSON.stringify(original), before);
  }
  const opening = studyCue(id, 0, true);
  assert.equal(opening.finishBeforeAdvance, true);
  assert.equal(opening.items.find((i) => i.id === "empty-wrap").actor, "aria");
  const landed = opening.sequence[0];
  assert.equal(landed.items.find((i) => i.id === "empty-wrap").support, "delivery-table");
  assert.equal(
    landed.actors.find((a) => a.id === "aria").carry,
    true,
    "hand stays until the 650ms transfer settles",
  );
  assert.ok(opening.sequence.at(-1).after - landed.after >= 650);
  const exit = storybookExitCue(id);
  assert.equal(exit.extras[0].pose, "wave");
  assert.ok(exit.actors.every((a) => a.x > 100));
  assert.ok(
    exit.items.every((i) => !i.actor),
    "placed props stay at the warehouse",
  );
});
