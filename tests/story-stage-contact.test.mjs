import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { storyStageCue, sampleStageActor } from "../lib/story-stage.ts";
import { sampleStageArrow } from "../lib/story-stage-arrow.ts";
import { stageFigure } from "../lib/story-stage-figure.ts";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";

const cue = storyStageCue("sweet-blockade-return", 0);
const moment = (time) => ({ ...cue, ...cue.sequence.findLast((m) => m.after <= time) });

test("the arrow reaches the reaching arm before recoil, pickup or walking away", () => {
  const arrow = cue.arrows[0],
    impact = arrow.after + arrow.duration;
  const aiming = moment(arrow.after - 1).actors.find((a) => a.id === "aria");
  const release = moment(arrow.after).actors.find((a) => a.id === "aria");
  assert.equal(aiming.bow, "aim");
  assert.equal(release.bow, "release");
  const doll = moment(impact).items.find((i) => i.id === "puppet");
  assert.equal(stageFigure(doll, false, 0).frame, 7);
  // Palm of the mirrored idle doll, measured in the 312x416 source body.
  assert.ok(Math.abs(arrow.to.x - (doll.x + doll.width / 2 - (35 * doll.width) / 312)) < 0.2);
  assert.ok(
    Math.abs(arrow.to.bottom - (doll.bottom + ((416 - 229) * doll.width * 1.5) / 312)) < 0.2,
  );
  for (const time of [arrow.after, arrow.after + 100, impact - 1])
    assert.equal(sampleStageArrow(arrow, time, false).visible, true);
  for (const time of [0, arrow.after - 1, impact, impact + 1000])
    assert.equal(sampleStageArrow(arrow, time, false).visible, false);
  assert.equal(sampleStageArrow(arrow, arrow.after + 100, true).visible, false);
  const end = sampleStageArrow(arrow, impact, false);
  assert.equal(end.x, arrow.to.x);
  assert.equal(end.bottom, arrow.to.bottom);
  assert.equal(moment(impact).actors.find((a) => a.id === "aria").x, aiming.x);
  assert.equal(storyStageCue("sweet-blockade-return", 1).arrows, undefined);
});

test("Leon pushes with empty hands, keeps his standing geometry and releases after contact", () => {
  for (const [time, frame] of [
    [0, 44],
    [350, 45],
  ]) {
    const actor = moment(time).actors.find((a) => a.id === "leon");
    const sample = sampleStageActor(actor, actor, 0, false);
    assert.equal(sample.frame, frame);
    assert.equal(sample.atlas, "conversation");
    assert.equal(sample.onChair, false);
    assert.equal(sample.handDrop, 0);
    assert.ok(sample.wrist);
    assert.ok(!actor.sword);
  }
  assert.equal(moment(1000).actors.find((a) => a.id === "leon").push, undefined);
});

test("new push frames preserve the walking head width and do not clip hair or boots", async () => {
  const base = await readFrame("public/home-pixel/leon.webp", {
    left: 0,
    top: 0,
    width: 128,
    height: 128,
  });
  const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
  for (const index of [44, 45]) {
    const f = await readFrame("public/story-stage/leon-poses.webp", {
      left: (index % 4) * 128,
      top: Math.floor(index / 4) * 128,
      width: 128,
      height: 128,
    });
    const h = await headBounds(await sharp(f.cell).extract(f.box).png().toBuffer(), 0.25);
    assert.ok(Math.abs(h.width - head.width) <= 2);
    assert.ok(f.box.left >= 2 && f.box.top >= 2 && f.box.left + f.box.width <= 126);
    assert.equal(f.box.top + f.box.height, 120);
    assert.ok(Math.abs(f.box.height - base.box.height) <= 5);
  }
});

test("the struck puppet clears the front of the table before retreating sideways", () => {
  const step = moment(1100).items.find((i) => i.id === "puppet");
  const clear = moment(1550).items.find((i) => i.id === "puppet");
  const table = cue.items.find((i) => i.id === "table");
  assert.equal(step.x, cue.items.find((i) => i.id === "puppet").x);
  assert.ok(step.bottom < table.bottom - 5);
  assert.equal(clear.bottom, step.bottom);
  assert.ok(clear.x > table.x);
  assert.equal(step.width, clear.width);
});

test("the earlier golem encounter also releases its push before the conversation resumes", () => {
  const opening = storyStageCue("begging-golem-return", 0);
  const phases = [opening, ...opening.sequence];
  assert.deepEqual(
    phases.map((m) => m.actors.find((a) => a.id === "leon").push),
    ["brace", "extend", undefined],
  );
  const sizes = phases.map((m) => m.items.find((i) => i.id === "golem").width);
  assert.deepEqual(sizes, [32, 32, 32]);
  const leon = storyStageCue("begging-golem-return", 1).actors.find((a) => a.id === "leon");
  assert.equal(leon.push, undefined);
  assert.ok(!leon.sword);
});
