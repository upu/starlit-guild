import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageItemTarget, stageItemDepth } from "../lib/story-stage-props.ts";

const id = "garden-reception-return";
const item = (step, name) => step.items.find((item) => item.id === name);
function positions(step) {
  const cue = { ...studyCue(id, 0, true), ...step };
  const at = new Map([
    ...cue.actors.map((actor) => [actor.id, sampleStageActor(actor, actor, 0, false)]),
    ...(cue.extras ?? []).map((extra) => [
      `extra:${extra.id}`,
      { ...extra, wrist: stageExtraWrist(extra, false, 0) },
    ]),
  ]);
  for (const part of cue.items) at.set(`item:${part.id}`, stageItemTarget(part, cue, at));
  return at;
}
const target = (step, name) => positions(step).get(`item:${name}`);
const gap = (a, b) => Math.hypot(a.x - b.x, a.bottom - b.bottom);

test("the servant and cloth movements retain their standing scale and padded boots", async () => {
  for (const [name, count, sole, height] of [
    ["finn-cloth-balanced-v2", 8, 176, 148],
    ["servant-display-v2", 4, 120, 94],
  ]) {
    const poses = JSON.parse(await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"));
    assert.equal(poses.length, count);
    assert.equal(poses[0].height, height);
    for (const pose of poses) {
      assert.equal(pose.scale, poses[0].scale);
      assert.equal(pose.top + pose.height, sole);
      assert.ok(pose.left > 0 && pose.left + pose.width < (sole === 176 ? 192 : 128));
    }
    if (sole === 176) assert.ok(poses[7].height < poses[0].height);
  }
});

test("the tied marker stays near Aria's hands and the covered case rests on the tabletop", () => {
  const cue = studyCue(id, 0, true),
    tied = cue.sequence[0];
  assert.ok(gap(target(cue, "return-marker"), target(tied, "return-marker")) < 0.7);
  assert.equal(item(cue, "case").bottom - item(cue, "display-table").bottom, 14);
  assert.equal(item(cue, "case-key").wrist, true);
  assert.equal(item(cue, "case-key").width, 1.5);
});

test("the folded cloth rests above the palms, transfers nearby, then unfolds before touching the cart", () => {
  const cue = studyCue(id, 18, true),
    sequence = cue.sequence;
  const received = sequence[0];
  assert.equal(item(cue, "spare-cloth").wristAnchor, "bottom");
  assert.equal(received.actors.find((actor) => actor.id === "finn").nameAbove, true);
  assert.ok(gap(target(cue, "spare-cloth"), target(received, "spare-cloth")) < 1.5);
  const spread = sequence.find((step) => item(step, "spare-cloth").art === "light-cloth");
  const lower = sequence.find(
    (step) => item(step, "spare-cloth").art === "cart-drape" && item(step, "spare-cloth").actor,
  );
  const placed = sequence.find((step) => item(step, "spare-cloth").carrier);
  assert.ok(
    received.after < spread.after && spread.after < lower.after && lower.after < placed.after,
  );
  assert.ok(gap(target(lower, "spare-cloth"), target(placed, "spare-cloth")) < 0.05);
  assert.equal(cue.finishBeforeAdvance, true);
});

test("the two pots retain their exact cart positions and draw in front of the drape", () => {
  const cue = studyCue(id, 18, true),
    final = cue.sequence.at(-1);
  for (const name of ["cart-pot-0", "cart-pot-1"]) {
    assert.equal(item(final, name).width, 6);
    assert.ok(gap(target(cue, name), target(final, name)) < 0.001);
    assert.ok(
      stageItemDepth(item(final, name), final, positions(final)) >
        stageItemDepth(item(final, "spare-cloth"), final, positions(final)),
    );
  }
  assert.equal(item(final, "replacement-parcel").stored, true);
  assert.equal(item(final, "spare-cloth").width, 11);
});
