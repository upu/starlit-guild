import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";

const id = "matching-lantern-stone-departure";
const finn = (step) => step.actors.find((actor) => actor.id === "finn");

test("yard action strips use a common scale and complete feet, with a genuinely lower treatment pose", async () => {
  for (const [name, cell, sole, standing] of [
    ["stone-carrier-motion-v2", 128, 120, 94],
    ["mira-healing-v1", 192, 176, 126],
    ["finn-chair-balanced-v3", 192, 176, 148],
  ]) {
    const poses = JSON.parse(await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"));
    assert.equal(poses.length, 8);
    assert.equal(poses[0].height, standing);
    for (const pose of poses) {
      assert.equal(pose.scale, poses[0].scale);
      assert.equal(pose.top + pose.height, sole);
      assert.ok(pose.left > 0 && pose.left + pose.width < cell);
    }
    if (name === "mira-healing-v1") {
      assert.ok(poses[1].height <= standing * 0.84);
      assert.ok(poses[2].height <= standing * 0.84);
    }
  }
});

test("stones, wrapping cloth, luggage and chair keep their dimensions between owners and the ground", () => {
  const widths = { basket: 5.5, "medicine-closed": 5.2, "delivery-bag": 7, chair: 8.5 };
  for (let line = 0; line < 18; line++) {
    const cue = studyCue(id, line, true);
    for (const step of [cue, ...(cue.sequence ?? [])]) {
      for (const item of step.items) {
        if (widths[item.art]) assert.equal(item.width, widths[item.art]);
        if (item.id === "wrapping-cloth") {
          assert.equal(item.width, 6);
          if (item.actor) assert.equal(item.wristAnchor, "bottom");
        }
        if (item.id.endsWith("stone")) assert.equal(item.width, 6.2);
        if (item.id === "carrier-stone" && item.extra) assert.equal(item.wrist, true);
      }
    }
  }
});

test("the stone stays on the same side of both supporting palms during leftward travel and after stopping", () => {
  const cue = studyCue(id, 0, true).sequence[0];
  const extra = cue.extras.find((value) => value.id === "stone-carrier");
  const stone = cue.items.find((item) => item.id === "carrier-stone");
  const target = (moving) =>
    stageItemTarget(
      stone,
      cue,
      new Map([
        [
          "extra:stone-carrier",
          {
            x: 83,
            bottom: 48,
            left: moving,
            wrist: stageExtraWrist(extra, moving, 0),
          },
        ],
      ]),
    );
  assert.deepEqual(target(true), target(false));
  assert.ok(target(true).x < 83);
});

test("Finn arrives before reaching, carries a supported chair, then lowers it before releasing and walking away", () => {
  const cue = studyCue(id, 15, true);
  assert.equal(cue.finishBeforeAdvance, true);
  const steps = cue.sequence;
  const approach = steps.find((step) => step.after === 2400);
  const reach = steps.find((step) => step.after === 3300);
  const pickup = steps.find((step) => step.after === 3500);
  const walk = steps.find((step) => step.after === 4200);
  const lower = steps.find((step) => step.after === 5700);
  const release = steps.find((step) => step.after === 6200);
  assert.ok(reach.after - approach.after > journeyDuration(finn(approach), finn(steps[2])));
  assert.equal(finn(reach).inspect, true);
  assert.equal(reach.items.find((item) => item.id === "mira-chair").actor, undefined);
  assert.equal(pickup.items.find((item) => item.id === "mira-chair").wrist, true);
  assert.equal(pickup.items.find((item) => item.id === "mira-chair").wristAnchor, "top");
  assert.ok(lower.after - walk.after > journeyDuration(finn(walk), finn(pickup)));
  assert.equal(finn(lower).inspect, true);
  assert.equal(finn(release).inspect, false);
  assert.equal(lower.items.find((item) => item.id === "mira-chair").actor, undefined);
});
