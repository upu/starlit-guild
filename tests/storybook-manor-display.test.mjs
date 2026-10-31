import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";

test("gardener actions retain standing scale, full boots and the common ground baseline", async () => {
  const poses = JSON.parse(
    await readFile("public/storybook-study/gardener-motion-metrics.json", "utf8"),
  );
  assert.equal(poses.length, 8);
  for (const pose of poses) {
    assert.equal(pose.scale, poses[0].scale);
    assert.equal(pose.top + pose.height, 120);
    assert.ok(pose.left > 0 && pose.left + pose.width < 128);
    assert.ok(Math.abs(pose.height - poses[0].height) <= 3);
  }
});

test("the three display states retain the same scale and base height", async () => {
  const props = JSON.parse(
    await readFile("public/storybook-study/manor-display-props-metrics.json", "utf8"),
  );
  for (const state of props.slice(0, 3)) {
    assert.equal(state.scale, props[1].scale);
    assert.equal(state.top + state.height, 308);
  }
  assert.ok(Math.abs(props[2].width - props[1].width) <= 3);
  assert.equal(props[4].scale, props[5].scale);
});

test("the gardener supports the stone and cover, and completes transfers before dialogue advances", () => {
  const reveal = studyCue("riverside-manor-return", 0, true);
  assert.equal(reveal.finishBeforeAdvance, true);
  const cloth = reveal.sequence[0].items.find((item) => item.id === "cover-cloth");
  assert.equal(cloth.wrist, true);
  assert.equal(cloth.wristAnchor, "top");
  const stone = reveal.sequence.at(-1).items.find((item) => item.id === "tower-stone");
  assert.equal(stone.wrist, true);
  assert.equal(stone.wristAnchor, "bottom");
  assert.equal(stone.extra, "worker");
  assert.equal(
    studyCue("riverside-manor-return", 7, true).extras.find((extra) => extra.id === "merchant")
      .bottom,
    -70,
  );
  const width = stone.width;
  const widths = { basket: 5.5, "medicine-closed": 5.2, "delivery-bag": 7 };
  for (let line = 0; line < 22; line++) {
    const cue = studyCue("riverside-manor-return", line, true);
    for (const step of [cue, ...(cue.sequence ?? [])]) {
      for (const item of step.items) {
        if (item.id === "tower-stone") assert.equal(item.width, width);
        if (widths[item.art]) assert.equal(item.width, widths[item.art]);
      }
    }
  }
});

test("light comparison keeps the cloth in Aria's palm and restores Leon's written notes", () => {
  const cue = studyCue("riverside-manor-return", 21, true);
  assert.equal(cue.finishBeforeAdvance, true);
  for (const step of cue.sequence) {
    const cloth = step.items.find((item) => item.id === "light-sample");
    assert.equal(cloth.actor, "aria");
    assert.equal(cloth.wrist, true);
    assert.equal(cloth.width, 2.8);
    const aria = step.actors.find((actor) => actor.id === "aria");
    assert.equal(aria.x, cloth.glow ? 47 : 37);
  }
  const last = cue.sequence.at(-1);
  assert.equal(last.actors.find((actor) => actor.id === "leon").writing, false);
  assert.equal(last.items.find((item) => item.id === "shipping-copy").wrist, true);
});
