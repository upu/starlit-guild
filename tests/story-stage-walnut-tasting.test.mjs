import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { storyStageCue, storyStageExitCue } from "../lib/story-stage.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageItemTarget, stageItemDepth } from "../lib/story-stage-props.ts";
import { sampleJourney, journeyDuration } from "../lib/story-stage-travel.ts";

const id = "interlude-promised-walnuts";
const cue = (line) => storyStageCue(id, line);
const moments = (value) => [value, ...(value.sequence ?? []).map((s) => ({ ...value, ...s }))];
const item = (value, name) => value.items.find((p) => p.id === name);
const positions = (value) =>
  new Map(value.actors.map((a) => [a.id, { ...a, ...actorPose(a, false, 0, true) }]));

test("three cakes have visibly distinct baked colors and are shared in the narrated order", async () => {
  const brightness = [];
  for (const shade of ["light", "medium", "dark"]) {
    const { data } = await sharp(`public/story-stage/prop-walnut-${shade}.webp`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let sum = 0,
      count = 0;
    for (let i = 0; i < data.length; i += 4)
      if (data[i + 3] > 200) {
        sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
        count++;
      }
    brightness.push(sum / count);
  }
  assert.ok(brightness[0] > brightness[1] + 8 && brightness[1] > brightness[2] + 8);
  assert.deepEqual(
    moments(cue(0))
      .at(-1)
      .items.filter((p) => ["light", "medium", "dark"].includes(p.id))
      .map((p) => p.id),
    ["light", "medium", "dark"],
  );
  for (const [line, shade] of [
    [8, "light"],
    [20, "medium"],
    [41, "dark"],
  ]) {
    const states = moments(cue(line)),
      from = states.find((s) => item(s, "leon-cake")?.actor === "aria"),
      to = states.find((s) => item(s, "leon-cake")?.actor === "leon");
    assert.ok(from && to);
    const a = item(from, "leon-cake"),
      b = item(to, "leon-cake");
    assert.equal(a.art, `walnut-${shade}-half`);
    assert.equal(a.width, 2.6);
    assert.equal(b.width, a.width);
    assert.deepEqual(
      stageItemTarget(a, from, positions(from)),
      stageItemTarget(b, to, positions(to)),
    );
  }
  assert.equal(item(cue(37), "held-cake").art, "walnut-dark");
  assert.equal(item(moments(cue(38)).at(-1), "held-cake").art, "walnut-underside");
});

test("a seated adjustment retains the same body and the bench stays behind both sitters", () => {
  const value = cue(7),
    aria = value.actors[0];
  assert.equal(aria.scoot, true);
  assert.deepEqual(actorPose(aria, true, 100, false), actorPose(aria, false, 100, false));
  for (let line = 0; line < 55; line++)
    for (const state of moments(cue(line))) {
      assert.equal(state.cell, 24);
      const bench = item(state, "low-bench");
      assert.ok(bench);
      for (const a of state.actors)
        assert.ok(stageItemDepth(bench, state, positions(state)) < 100 - a.bottom);
      assert.equal(new Set(state.items.map((p) => p.id)).size, state.items.length);
      assert.equal(
        state.items.some((p) => p.art === "bread" || p.art === "tea"),
        false,
      );
    }
});

test("the flask is reached after the bitter bite and the walnut transfer keeps one owner", () => {
  const states = moments(cue(42));
  assert.equal(item(states[0], "aria-cake").art, "walnut-dark-half");
  assert.equal(item(states[0], "travel-flask").actor, undefined);
  const picked = states.find((s) => item(s, "travel-flask").actor === "aria");
  assert.ok(picked.after >= 2500);
  assert.equal(item(cue(44), "travel-flask").actor, undefined);
  const handoff = moments(cue(49)),
    from = handoff[1],
    to = handoff[2];
  assert.equal(item(from, "leon-nut").actor, "aria");
  assert.equal(item(to, "leon-nut").actor, "leon");
  assert.deepEqual(
    stageItemTarget(item(from, "leon-nut"), from, positions(from)),
    stageItemTarget(item(to, "leon-nut"), to, positions(to)),
  );
});

test("departure waits at the bench and follows the visible downhill road before leaving", () => {
  const last = moments(cue(54)).at(-1),
    exit = stageCameraCue(storyStageExitCue(id));
  assert.deepEqual(
    last.actors.map((a) => a.x),
    [56, 65],
  );
  assert.equal(last.items.filter((p) => p.actor).length, 1);
  assert.equal(last.items.find((p) => p.actor).art, "basket");
  for (const actor of exit.actors) {
    const origin = last.actors.find((a) => a.id === actor.id),
      duration = journeyDuration(actor, origin);
    for (let t = 0; t < duration; t += 40) {
      const at = sampleJourney(actor, origin, t, false),
        x = 50 + (at.x - 50) * exit.cameraScale,
        y = 63 + (25 - at.bottom) * exit.cameraScale;
      if (y >= 84 && y <= 96)
        assert.ok(x >= 7 && x <= 20, `${actor.id}: ${x},${y} stays on the lower path`);
      if (at.x >= 50 && at.x <= 72) assert.ok(at.bottom <= 24, "walk in front of the bench");
    }
  }
});
