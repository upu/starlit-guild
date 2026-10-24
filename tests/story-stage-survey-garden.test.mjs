import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { storyStageCue as cue } from "../lib/story-stage.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { extraTravelDuration } from "../lib/story-stage-extra-travel.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";

const id = "manor-survey-return";
const moments = (v) => [v, ...(v.sequence ?? []).map((s) => ({ ...v, ...s }))];
const item = (v, name) => v.items.find((p) => p.id === name);
const actor = (v, name) => v.actors.find((a) => a.id === name);
const worker = (v) => v.extras.find((e) => e.id === "worker");
const target = (v, name) =>
  stageItemTarget(
    item(v, name),
    v,
    new Map([...v.actors.map((a) => [a.id, a]), ...v.extras.map((e) => [`extra:${e.id}`, e])]),
  );
const close = (a, b) => assert.ok(Math.hypot(a.x - b.x, a.bottom - b.bottom) < 0.001);

test("the gardener carries a consistently sized plant, reaches its place and lowers it before standing", () => {
  const steps = moments(cue(id, 0));
  assert.equal(steps[0].background, "manor-back-paths");
  assert.ok(!steps[0].items.some((p) => ["table", "cloth"].includes(p.art)));
  assert.equal(item(steps[0], "garden-pot").extra, "worker");
  assert.ok(
    steps[2].after - steps[1].after > extraTravelDuration(worker(steps[1]), worker(steps[0])),
  );
  assert.ok(worker(steps[2]).inspect);
  assert.equal(item(steps[3], "garden-pot").extra, undefined);
  assert.ok(steps[4].after - steps[3].after >= 650);
  for (const v of steps) assert.equal(item(v, "garden-pot").width, 7);
  assert.equal(
    target(steps[0], "garden-pot").bottom - worker(steps[0]).bottom,
    target(steps[1], "garden-pot").bottom - worker(steps[1]).bottom,
  );
  const support = [100, 300, 450, 700].map((t) =>
    stageExtraFrame({ id: "worker", limp: true }, true, t),
  );
  assert.deepEqual(support, [4, 5, 6, 7]);
  assert.equal(stageExtraFrame({ id: "worker", limp: true }, true, 220), 4);
});

test("Finn removes the gloves before displaying the key, which turns once and keeps its original scale", () => {
  assert.ok(item(cue(id, 1), "case-key").stored);
  const steps = moments(cue(id, 2));
  assert.equal(actorPose(actor(steps[0], "finn"), false, 0, false).frame, 46);
  assert.equal(actorPose(actor(steps[1], "finn"), false, 0, false).frame, 47);
  assert.equal(actor(steps[2], "finn").gloves, undefined);
  close(target(steps[2], "case-key"), target(steps[2], "work-gloves"));
  assert.ok(target(steps[3], "case-key").x > target(steps[3], "work-gloves").x);
  const turn = moments(cue(id, 4));
  assert.equal(item(turn[0], "case-key").tilt, 0);
  assert.equal(item(turn[1], "case-key").tilt, 360);
  for (let i = 5; i < 18; i++)
    for (const v of moments(cue(id, i))) assert.equal(item(v, "case-key").tilt, 360);
  const prior = item(cue("riverside-manor-return", 0), "case-key");
  for (let i = 0; i < 18; i++)
    for (const v of moments(cue(id, i))) assert.equal(item(v, "case-key").width, prior.width);
});

test("both borrowed items reach the gardener only after Finn arrives, leaving both hands empty", () => {
  const steps = moments(cue(id, 10));
  assert.ok(steps[1].after > journeyDuration(actor(steps[0], "finn"), actor(cue(id, 9), "finn")));
  close(target(steps[1], "work-gloves"), target(steps[2], "work-gloves"));
  close(target(steps[3], "case-key"), target(steps[4], "case-key"));
  assert.equal(item(steps.at(-1), "case-key").extra, "worker");
  assert.ok(Math.abs(actor(steps[0], "finn").x - worker(steps[0]).x) >= 9);
  for (let i = 14; i < 18; i++) {
    assert.ok(!cue(id, i).items.some((p) => p.actor === "finn"));
    assert.equal(actor(cue(id, i), "finn").gloves, undefined);
  }
});

test("the path search avoids Mira and the return route clears her approach to the gardener's foot", () => {
  const search = cue(id, 10),
    start = cue(id, 9);
  const care = cue(id, 13),
    before = cue(id, 12);
  const separation = (a, b) => Math.hypot(a.x - b.x, ((a.bottom - b.bottom) * 2) / 3);
  for (let t = 0; t <= 2000; t += 40) {
    const aria = sampleJourney(actor(search, "aria"), actor(start, "aria"), t, false);
    assert.ok(separation(aria, actor(start, "mira")) >= 9, `Aria passes Mira at ${t}`);
    const mira = sampleJourney(actor(care, "mira"), actor(before, "mira"), t, false);
    const finn = sampleJourney(actor(care, "finn"), actor(before, "finn"), t, false);
    assert.ok(separation(mira, finn) >= 9, `Mira meets Finn at ${t}`);
  }
  assert.equal(actor(care, "mira").inspect, false);
  assert.ok(care.sequence[0].after > journeyDuration(actor(care, "mira"), actor(before, "mira")));
  assert.equal(actor(care.sequence[0], "mira").inspect, true);
  assert.ok(separation(actor(care.sequence[0], "mira"), worker(care)) < 9);
});

test("the glove poses preserve Finn's other established cells and standing scale without clipping", async () => {
  const atlas = "public/story-stage/finn-poses.webp";
  const previous = Buffer.concat(
    await Promise.all(
      [
        { left: 0, top: 0, width: 512, height: 1408 },
        { left: 0, top: 1408, width: 256, height: 128 },
      ].map((box) => sharp(atlas).extract(box).ensureAlpha().raw().toBuffer()),
    ),
  );
  // Injury and parcel-pat scenes replace idle placeholders and test those poses separately.
  for (const cell of [17, 18, 19, 20, 32, 33])
    for (let y = 0; y < 128; y++) {
      const offset = ((Math.floor(cell / 4) * 128 + y) * 512 + (cell % 4) * 128) * 4;
      previous.fill(0, offset, offset + 128 * 4);
    }
  for (let i = 0; i < previous.length; i += 4) if (!previous[i + 3]) previous.fill(0, i, i + 3);
  assert.equal(
    createHash("sha256").update(previous).digest("hex"),
    "a7e6d31cf87b2acd5fbbf978ed89765af06fe7668169ad062c97d57a72c40269",
  );
  const ref = await readFrame(atlas, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(await sharp(ref.cell).extract(ref.box).png().toBuffer(), 0.25);
  for (const index of [46, 47]) {
    const f = await readFrame(atlas, {
      left: (index % 4) * 128,
      top: 1408,
      width: 128,
      height: 128,
    });
    const current = await headBounds(await sharp(f.cell).extract(f.box).png().toBuffer(), 0.25);
    assert.ok(Math.abs(current.width - head.width) <= 3);
    assert.equal(f.box.height, ref.box.height);
    assert.equal(f.box.top + f.box.height, 120);
    assert.ok(f.box.left >= 2 && f.box.left + f.box.width <= 126 && f.box.top >= 2);
  }
});
