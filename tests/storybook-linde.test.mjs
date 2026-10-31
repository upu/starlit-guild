import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";
const depart = "linde-requests-departure",
  ret = "linde-requests-return";
const actor = (s, id) => s.actors.find((a) => a.id === id);
const item = (s, id) => s.items.find((i) => i.id === id);

test("the used plate retains the lunch plate's physical size and every prop has sole padding", async () => {
  const metrics = JSON.parse(
    await readFile("public/storybook-study/linde-lunch-props-v1-metrics.json", "utf8"),
  );
  assert.ok(Math.abs(metrics[0].width - metrics[1].width) < 6);
  assert.equal(metrics[0].height, metrics[1].height);
  for (const p of metrics) {
    assert.equal(p.top + p.height, 248);
    assert.ok(p.left > 0 && p.left + p.width < 256);
  }
});

test("the chair and seated positions remain fixed while papers are shown and read", () => {
  for (const [id, count] of [
    [depart, 26],
    [ret, 17],
  ]) {
    const initial = studyCue(id, 0, true);
    for (let n = 0; n < count; n++) {
      const c = studyCue(id, n, true);
      for (const s of [c, ...(c.sequence ?? [])]) {
        for (const who of ["aria", "leon", "mira", "finn"]) {
          assert.equal(actor(s, who).bottom, actor(initial, who).bottom);
          assert.equal(item(s, `chair-${who}`).bottom, item(initial, `chair-${who}`).bottom);
          assert.ok(actor(s, who).seated);
        }
      }
    }
  }
});

test("Mira clears the table before reaching the bag, then rises without retracing her approach", () => {
  const c = studyCue(depart, 26, true);
  const approach = c.sequence.find((s) => actor(s, "mira").healing === "treat");
  const rise = c.sequence.find((s) => actor(s, "mira").healing === "rise");
  const m = actor(approach, "mira");
  assert.ok(m.x < 26, "the route stays outside the left table edge");
  assert.ok(approach.after + journeyDuration(m, actor(c, "mira")) < rise.after);
  assert.ok(item(approach, "mira-request").stored);
  const envelope = c.sequence.find((s) => item(s, "mira-request").actor === "mira");
  assert.ok(envelope.after > rise.after);
  assert.equal(actor(envelope, "mira").via, undefined);
  assert.deepEqual(actor(envelope, "mira").carryWalkFrames, [8, 9, 22, 23]);
  assert.ok(c.finishBeforeAdvance);
});

test("the plate pickup stays to Finn's right and paper placement follows the owner's arrival", () => {
  const delivery = studyCue(depart, 6, true);
  assert.ok(delivery.sequence.find((s) => !item(s, "town-request").extra).after >= 2000);
  const pickup = studyCue(depart, 19, true);
  for (const s of [pickup, ...pickup.sequence]) {
    const owner = s.extras.find((e) => e.id === "merchant");
    assert.ok(owner.x - actor(s, "finn").x > 12);
  }
  const paper = item(studyCue(ret, 5, true), "mira-request");
  assert.equal(paper.actor, "mira");
  assert.equal(paper.wristAnchor, "bottom");
  assert.ok(paper.width <= 5);
  assert.equal(storybookPresentation(depart).art, "linde-dining-v1");
  assert.equal(storybookPresentation(ret).art, "linde-dining-dusk-v1");
});
