import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";

const id = "interlude-promised-walnuts";
const actor = (s, id) => s.actors.find((a) => a.id === id);
const item = (s, id) => s.items.find((i) => i.id === id);
const target = (c, s, id) =>
  stageItemTarget(
    item(s, id),
    c,
    new Map(s.actors.map((a) => [a.id, sampleStageActor(a, a, 0, true)])),
  );
const near = (a, b) =>
  assert.ok(
    Math.hypot(a.x - b.x, a.bottom - b.bottom) < 0.001,
    `${JSON.stringify(a)} != ${JSON.stringify(b)}`,
  );

test("all55 lines retain the same painted camera/body scale and gate staged actions", () => {
  for (let n = 0; n < 55; n++) {
    const c = studyCue(id, n, true);
    assert.equal(c.cell, 19);
    assert.equal(c.cameraScale, 0.72);
    assert.equal(storybookPresentation(id, c.background).art, "walnut-rest-v1");
    if (c.sequence?.length) assert.equal(c.finishBeforeAdvance, true);
  }
});
test("the half cookies and final walnut kernel pass between coincident supporting hands", () => {
  for (const [line, prop] of [
    [8, "leon-cake"],
    [20, "leon-cake"],
    [41, "leon-cake"],
    [49, "leon-nut"],
  ]) {
    const c = studyCue(id, line, true);
    let before;
    for (const s of [c, ...c.sequence]) {
      const i = item(s, prop);
      if (!i?.actor) continue;
      if (before && item(before, prop).actor !== i.actor)
        near(target(c, before, prop), target(c, s, prop));
      before = s;
    }
  }
});
test("Aria reaches the cloth's actual kernel before lifting it", () => {
  const c = studyCue(id, 20, true);
  const ground = c.sequence.find((s) => item(s, "aria-nut") && !item(s, "aria-nut").actor);
  const picked = c.sequence.find((s) => item(s, "aria-nut")?.actor === "aria");
  near(item(ground, "aria-nut"), target(c, picked, "aria-nut"));
  assert.equal(actor(picked, "aria").snackAction, "reach");
});
test("the pale remainder stays in Aria's hand while she examines it after a bite", () => {
  const c = studyCue(id, 14, true);
  assert.equal(item(c.sequence.at(-1), "aria-cake").art, "walnut-light-half");
  assert.equal(item(studyCue(id, 19, true), "aria-cake").actor, "aria");
  assert.equal(item(studyCue(id, 20, true), "held-cake").art, "walnut-medium");
});
test("the flask is grasped at its grounded neck and then reaches the drinking hand", () => {
  const c = studyCue(id, 42, true);
  const lifted = c.sequence.find((s) => item(s, "travel-flask")?.actor === "aria");
  near(item(c, "travel-flask"), target(c, lifted, "travel-flask"));
  assert.equal(actor(c.sequence.at(-1), "aria").snackAction, "drink");
});
test("food and the flat cloth sit in front of the bench and boots", () => {
  const c = studyCue(id, 0, true),
    s = c.sequence.at(-1);
  const cloth = s.items.find((i) => i.art === "picnic-cloth");
  const bench = s.items.find((i) => i.art === "low-bench");
  assert.ok(cloth.bottom + (23 / 4) * 1.5 < bench.bottom);
  for (const i of s.items.filter((i) => i.art.startsWith("walnut-"))) assert.ok(i.bottom < 24);
});
test("the two village routes separate after packing, while the basket stays with Leon", () => {
  const c = storybookExitCue(id);
  assert.ok(actor(c, "aria").x < 0);
  assert.ok(actor(c, "leon").x > 100);
  assert.equal(item(c, "basket").actor, "leon");
  assert.equal(item(c, "basket").wrist, true);
  assert.equal(item(c, "packed-cloth").carrier, "basket");
  assert.equal(item(c, "packed-flask").carrier, "basket");
});
test("seated poses share one calibration and remain shorter, with uncut boots", async () => {
  for (const id of ["aria", "leon"]) {
    const m = JSON.parse(await readFile(`public/storybook-study/${id}-snack-v1-metrics.json`));
    assert.equal(m.length, 8);
    for (const p of m) {
      assert.equal(p.scale, m[0].scale);
      assert.equal(p.top + p.height, 176);
      assert.ok(p.left > 2 && p.left + p.width < 190);
    }
    for (const p of m.slice(1)) assert.ok(p.height < m[0].height * 0.88);
  }
});
