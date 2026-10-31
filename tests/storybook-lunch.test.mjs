import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { storyStageCue, sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";

const cueAt = (line) => studyCue("interlude-walnut-lunch", line, true);
const target = (cue, state, id) =>
  stageItemTarget(
    state.items.find((i) => i.id === id),
    { ...cue, ...state },
    new Map(state.actors.map((a) => [a.id, sampleStageActor(a, a, 10000)])),
  );
function near(a, b, tolerance = 0.001) {
  assert.ok(Math.hypot(a.x - b.x, a.bottom - b.bottom) < tolerance, JSON.stringify({ a, b }));
}
test("all32 lunch displays preserve source cues and keep seated bodies planted in the painted hill", () => {
  for (let line = 0; line < 32; line++) {
    const source = JSON.stringify(storyStageCue("interlude-walnut-lunch", line)),
      cue = cueAt(line);
    assert.equal(
      storybookPresentation("interlude-walnut-lunch", cue.background, line).art,
      "picnic-hill-v1",
    );
    for (const state of [cue, ...(cue.sequence ?? [])])
      for (const a of state.actors) {
        assert.equal(a.bottom, 24);
        assert.equal(a.x, a.id === "aria" ? 43 : 52);
        assert.ok(a.seated);
        assert.ok(a.snackAction);
      }
    assert.equal(JSON.stringify(storyStageCue("interlude-walnut-lunch", line)), source);
  }
});
test("cake pickup meets the cloth and both palms meet at the handover", () => {
  const c = cueAt(11),
    [grasp, offer, receive] = c.sequence;
  near(target(c, c, "shared-cake"), target(c, grasp, "shared-cake"));
  near(target(c, offer, "shared-cake"), target(c, receive, "shared-cake"), 0.3);
  assert.equal(receive.items.find((i) => i.id === "shared-cake").actor, "leon");
});
test("the flask is placed without a drink pose or a release jump", () => {
  const c = cueAt(6),
    [reach, release] = c.sequence;
  near(target(c, reach, "travel-flask"), target(c, release, "travel-flask"));
  for (const s of [c, ...c.sequence]) assert.ok(s.actors.every((a) => a.snackAction !== "drink"));
});
test("own cake is picked up before biting and both cakes are eaten before wrapping", () => {
  const c = cueAt(15);
  near(target(c, c, "aria-cake"), target(c, c.sequence[0], "aria-cake"));
  assert.ok(c.sequence[3].items.filter((i) => i.art === "honey-cake-bitten").length === 2);
  assert.ok(!c.sequence.at(-1).items.some((i) => i.id.endsWith("-cake") && i.actor));
  assert.ok(cueAt(29).items.some((i) => i.art === "cake-parcel"));
  const lid = c.sequence.find((s) => s.after === 1900);
  assert.equal(lid.actors.find((a) => a.id === "leon").snackAction, "reach");
  assert.ok(target(c, lid, "shared-cake").bottom > target(c, lid, "travel-flask").bottom + 5);
  assert.equal(
    c.sequence.find((s) => s.after === 2200).actors.find((a) => a.id === "leon").snackAction,
    "lap",
  );
});
test("lunch atlases retain standing calibration and common foot baseline across seated actions", async () => {
  for (const id of ["aria", "leon"]) {
    const poses = JSON.parse(
      await readFile(`public/storybook-study/${id}-lunch-v1-metrics.json`, "utf8"),
    );
    assert.equal(poses.length, 8);
    assert.equal(new Set(poses.map((p) => p.scale)).size, 1);
    assert.ok(poses.every((p) => p.baseline === 176 && p.left >= 3 && p.left + p.width <= 189));
    assert.ok(poses.slice(1).every((p) => p.height < poses[0].height));
  }
});
