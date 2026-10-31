import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { extraTravelDuration } from "../lib/story-stage-extra-travel.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
const ret = "lantern-detour-return";
const item = (s, id) => s.items.find((i) => i.id === id);
const worker = (s) => s.extras.find((e) => e.id === "worker");

test("cleaning and opening the door preserve the lantern's physical dimensions", async () => {
  const metrics = JSON.parse(
    await readFile("public/storybook-study/roadside-lantern-v1-metrics.json", "utf8"),
  );
  assert.equal(metrics.length, 5);
  for (const m of metrics) {
    assert.equal(m.scale, metrics[0].scale);
    assert.equal(m.top + m.height, 376);
    assert.ok(Math.abs(m.height - metrics[0].height) < 5);
    assert.ok(m.left > 0 && m.left + m.width < 256);
  }
  for (let n = 0; n < 22; n++) {
    const c = studyCue(ret, n, true);
    for (const s of [c, ...(c.sequence ?? [])]) assert.equal(item(s, "stone-lantern").width, 13);
  }
});

test("work and walking poses retain their standing calibration with clear knee-height changes", async () => {
  for (const [name, count, sole] of [
    ["lantern-heroes-v1", 8, 176],
    ["porter-service-v1", 12, 120],
    ["porter-pickup-v1", 4, 120],
    ["aria-weed-v1", 3, 176],
  ]) {
    const m = JSON.parse(await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"));
    assert.equal(m.length, count);
    for (let i = 0; i < m.length; i++) {
      assert.equal(m[i].scale, m[name === "lantern-heroes-v1" && i >= 4 ? 4 : 0].scale);
      assert.equal(m[i].top + m[i].height, sole);
    }
    if (name === "lantern-heroes-v1") {
      assert.equal(m[0].height, 134);
      assert.equal(m[4].height, 144);
      assert.ok(m[3].height < m[0].height * 0.8);
    }
    if (name === "porter-pickup-v1") assert.ok(m[1].height < m[0].height * 0.8);
  }
});

test("a held wiping cloth does not override the two cleaning poses", () => {
  const c = studyCue(ret, 2, true),
    s = c.sequence.at(-1),
    a = s.actors.find((a) => a.id === "aria");
  assert.equal(a.carry, false);
  assert.equal(actorPose(a, false, 0, false).frame, 52);
  assert.equal(actorPose(a, false, 440, false).frame, 53);
  assert.equal(item(s, "wiping-cloth").actor, "aria");
});

test("the porter arrives and kneels before lifting, then pours above the supported dish", () => {
  const c = studyCue(ret, 7, true),
    inspect = c.sequence.find((s) => s.after === 4900),
    lift = c.sequence.find((s) => s.after === 6400);
  const previous = c.sequence[c.sequence.indexOf(inspect) - 1];
  assert.ok(inspect.after + extraTravelDuration(worker(inspect), worker(previous)) < lift.after);
  assert.equal(stageExtraFrame(worker(inspect), false, 0), 10);
  assert.equal(stageExtraFrame(worker(lift), false, 0), 12);
  const pouring = c.sequence.find((s) => item(s, "lamp-oil").pouring),
    e = worker(pouring),
    leon = pouring.actors.find((a) => a.id === "leon");
  assert.equal(stageExtraFrame(e, false, 0), 15);
  const at = new Map([
    ["extra:worker", { ...e, wrist: stageExtraWrist(e, false, 0) }],
    ["leon", { ...leon, wrist: { x: 83, y: 72 } }],
  ]);
  const oil = stageItemTarget(item(pouring, "lamp-oil"), c, at),
    dish = stageItemTarget(item(pouring, "oil-pan"), c, at);
  assert.ok(Math.abs(oil.x - dish.x) < 1);
  assert.ok(oil.bottom - dish.bottom > 0 && oil.bottom - dish.bottom < 1.5);
  assert.equal(c.finishBeforeAdvance, true);
});

test("dusk accompanies the work and the notebook stays distinct from the request copy", () => {
  assert.equal(
    studyCue("lantern-detour-departure", 0, true).cameraScale,
    studyCue(ret, 0, true).cameraScale,
  );
  assert.equal(storybookPresentation(ret, undefined, 6).art, "hill-path-v1");
  assert.equal(storybookPresentation(ret, undefined, 7).art, "hill-path-dusk-v1");
  const c = studyCue(ret, 21, true),
    final = c.sequence.at(-1);
  assert.equal(stageExtraFrame(worker(final), false, 0), 19);
  const copy = item(final, "request-copy");
  assert.equal(copy.actor, "aria");
  assert.equal(copy.art, "folded-paper");
  assert.equal(copy.wristAnchor, "bottom");
});
