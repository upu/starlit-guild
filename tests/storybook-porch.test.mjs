import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";

test("ground sitting keeps standing scale, lowers the silhouette, and preserves complete cells", async () => {
  const metrics = JSON.parse(
    await readFile("public/storybook-study/ground-rest-metrics.json", "utf8"),
  );
  for (const poses of Object.values(metrics)) {
    assert.equal(poses.length, 3);
    for (const pose of poses) {
      assert.equal(pose.scale, poses[0].scale);
      assert.equal(pose.top + pose.height, 176);
      assert.ok(pose.left > 0 && pose.left + pose.width < 192);
    }
    assert.ok(poses[1].height < poses[0].height * 0.85);
    assert.ok(poses[2].height < poses[0].height * 0.85);
  }
});

test("porch medicine retains size through ownership changes and lunch uses ground poses", () => {
  for (let line = 0; line < 24; line++) {
    const cue = studyCue("berne-house-calls-return", line, true);
    for (const step of [cue, ...(cue.sequence ?? [])]) {
      const medicine = step.items.find((item) => item.id === "medicine");
      assert.equal(medicine.width, 5.2);
      if (medicine.actor) assert.equal(medicine.wrist, true);
      for (const actor of step.actors.filter((actor) => actor.seated))
        assert.equal(actor.perch, true);
      assert.ok(step.extras.some((extra) => extra.name === "家の人"));
    }
    if (cue.sequence?.length) assert.equal(cue.finishBeforeAdvance, true);
  }
});

test("Finn receives bread on his left-facing palm and carries one stable tray", async () => {
  const sharing = studyCue("berne-house-calls-return", 17, true).sequence.at(-1);
  const finn = sharing.actors.find((actor) => actor.id === "finn");
  const bread = sharing.items.find((item) => item.id === "finn-roll");
  assert.deepEqual(finn.wristPoints[41], [92, 93]);
  const target = stageItemTarget(
    bread,
    sharing,
    new Map([
      [
        "finn",
        {
          x: finn.x,
          bottom: finn.bottom,
          left: true,
          wrist: { x: 92, y: 93 },
        },
      ],
    ]),
  );
  assert.ok(target.x < finn.x);
  const tea = studyCue("berne-house-calls-return", 18, true);
  for (const step of [tea, ...tea.sequence]) {
    const tray = step.items.find((item) => item.id === "tea-tray");
    assert.equal(tray.width, 8);
    if (tray.actor) assert.equal(tray.wrist, true);
  }
  const metrics = JSON.parse(
    await readFile("public/storybook-study/finn-tray-metrics.json", "utf8"),
  );
  for (const pose of metrics) {
    assert.equal(pose.scale, metrics[0].scale);
    assert.equal(pose.top + pose.height, 176);
    assert.ok(pose.left > 0 && pose.left + pose.width < 192);
  }
  const walking = metrics.slice(0, 5);
  assert.ok(
    Math.max(...walking.map((pose) => pose.height)) -
      Math.min(...walking.map((pose) => pose.height)) <=
      2,
  );
});
