import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";

const id = "manor-survey-departure";
test("the cook's carrying steps and lid action retain full feet and a common standing scale", async () => {
  const poses = JSON.parse(
    await readFile("public/storybook-study/cook-survey-v1-metrics.json", "utf8"),
  );
  assert.equal(poses.length, 8);
  assert.equal(poses[0].height, 94);
  for (const pose of poses) {
    assert.equal(pose.scale, poses[0].scale);
    assert.equal(pose.top + pose.height, 120);
    assert.ok(pose.left > 0 && pose.left + pose.width < 128);
    assert.ok(Math.abs(pose.height - poses[0].height) <= 3);
  }
});

test("the road, gate and open kitchen retain separate locations and every pot/lid retains its dimensions", () => {
  for (let line = 0; line < 16; line++) {
    const cue = studyCue(id, line, true);
    assert.equal(
      storybookPresentation(id, cue.background).art,
      line < 9 ? "berne-paving-v1" : line < 12 ? "manor-gate-v1" : "manor-kitchen-open-v1",
    );
    for (const step of [cue, ...(cue.sequence ?? [])]) {
      for (const item of step.items) {
        if (item.art === "survey-pot") {
          assert.equal(item.width, 6.5);
          assert.equal(item.wrist, true);
        }
        if (item.art === "pot-lid") assert.equal(item.width, 5.8);
      }
    }
    if (cue.sequence?.length) assert.equal(cue.finishBeforeAdvance, true);
  }
});

test("Finn clears the raised lid and the cook's pot follows his hands on all four walk phases", () => {
  const cue = studyCue(id, 12, true);
  const lift = cue.sequence.find((step) =>
    step.items.some((item) => item.art === "pot-lid" && item.extra),
  );
  assert.equal(lift.actors.find((actor) => actor.id === "finn").x, 61);
  const extra = lift.extras.find((extra) => extra.id === "cook");
  const pot = lift.items.find((item) => item.art === "survey-pot");
  const positions = new Map([
    ["extra:cook", { ...extra, left: true, wrist: stageExtraWrist(extra, false, 0) }],
  ]);
  const lid = stageItemTarget(
    lift.items.find((item) => item.art === "pot-lid"),
    cue,
    positions,
  );
  assert.ok(lid.x - 5.8 / 2 > 61 + 3, "lid must clear Finn's head");
  const bases = [0, 180, 360, 540].map((elapsed) =>
    stageItemTarget(
      pot,
      cue,
      new Map([
        [
          "extra:cook",
          {
            ...extra,
            x: 80,
            bottom: 45,
            left: false,
            wrist: stageExtraWrist(extra, true, elapsed),
          },
        ],
      ]),
    ),
  );
  assert.ok(bases.every((at) => at.bottom === bases[0].bottom && at.x === bases[0].x));
  assert.ok(bases[0].bottom > 40 && bases[0].bottom < 50);
});

test("the rag remains with Finn while the pot and lid return to the kitchen", () => {
  const cue = studyCue(id, 15, true),
    final = cue.sequence.at(-1);
  assert.equal(final.extras.length, 0);
  assert.equal(
    final.items.some((item) => item.id === "borrowed-pot" || item.id === "pot-lid"),
    false,
  );
  const rag = final.items.find((item) => item.art === "scrubbing-rag");
  assert.equal(rag.actor, "finn");
  assert.equal(rag.wrist, true);
  const offered = cue.sequence.find((step) =>
    step.items.some((item) => item.art === "scrubbing-rag" && item.extra),
  );
  const received = cue.sequence.find((step) =>
    step.items.some((item) => item.art === "scrubbing-rag" && item.actor),
  );
  assert.ok(offered.after < received.after);
  const leaving = cue.sequence.find((step) => step.extras?.[0]?.bottom === 70);
  assert.equal(leaving.extras[0].x, 76, "return through the doorway rather than the herb pots");
  assert.equal(leaving.extras[0].via[0].x, 79);
});
