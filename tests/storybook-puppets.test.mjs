import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { stageItemDepth, stageItemTarget } from "../lib/story-stage-props.ts";
import { stageExtraFrame, stageFigure } from "../lib/story-stage-figure.ts";
import { storybookStageAttributes } from "../lib/storybook/presentation.ts";
import { storyCastImages } from "../lib/storybook/stage-images.ts";
import { stories } from "../lib/stories.ts";
import { handheldPalm } from "../lib/road-handheld.ts";
import sharp from "sharp";
import { sampleStageActor } from "../lib/story-stage.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";
import { itemMotionSignature } from "../lib/story-stage-cargo.ts";

test("the portable sign follows behind the puppet through its bow and exit", () => {
  const cue = studyCue("spinning-signpost-departure", 4, true);
  assert.equal(cue.finishBeforeAdvance, true);
  for (const step of [cue, ...cue.sequence]) {
    const sign = step.items.find((item) => item.id === "signpost");
    assert.equal(sign.art, "signpost-portable");
    assert.equal(sign.carrier, "puppet");
    const positions = new Map([["item:puppet", { x: 57, bottom: 28, depth: 72 }]]);
    assert.deepEqual(stageItemTarget(sign, cue, positions), { x: 58.8, bottom: 30 });
    assert.equal(stageItemDepth(sign, cue, positions), 71);
  }
  const puppet = cue.sequence[0].items.find((item) => item.art === "puppet");
  assert.equal(stageFigure(puppet, false, 0).frame, 6);
  assert.equal(
    storybookExitCue("spinning-signpost-departure").items.find((item) => item.id === "signpost")
      .width,
    10,
  );
});

test("the opened snack wrappers stay small and Aria inspects them without crossing Leon", () => {
  let previous = studyCue("spinning-signpost-return", 4, true);
  for (let line = 5; line < 8; line++) {
    const cue = studyCue("spinning-signpost-return", line, true);
    for (let time = 0; time <= 1600; time += 40) {
      const sampled = new Map(
        cue.actors.map((a) => [
          a.id,
          sampleStageActor(a, previous.actors.find((b) => a.id === b.id) ?? a, time),
        ]),
      );
      const [aria, leon] = ["aria", "leon"].map((id) => sampled.get(id));
      assert.ok(Math.hypot(aria.x - leon.x, (aria.bottom - leon.bottom) / 1.5) > 12);
    }
    const wrap = cue.items.find((i) => i.id === "snack-wrap");
    assert.equal(wrap.image, "/storybook-study/empty-delivery-wrap-v1.webp");
    assert.ok(wrap.width <= 6 && Math.abs(wrap.x - cue.actors.find((a) => a.id === "aria").x) < 6);
    previous = cue;
  }
  const full = studyCue("spinning-signpost-return", 0, true).items.find(
    (i) => i.id === "snack-wrap",
  );
  const empty = previous.items.find((i) => i.id === "snack-wrap");
  assert.equal(full.width, empty.width);
  assert.equal(full.x, empty.x);
  assert.equal(full.bottom, empty.bottom);
});

test("the fleeing puppet is visible with the candy until it clears the scene", () => {
  const cue = studyCue("spinning-signpost-return", 9, true);
  assert.ok(cue.finishBeforeAdvance);
  const puppet = cue.items.find((i) => i.id === "escaping-puppet");
  const candy = cue.items.find((i) => i.id === "stolen-candy");
  assert.equal(candy.carrier, puppet.id);
  assert.equal(candy.image, "/storybook-study/lunch-cake-parcel-v1.webp");
  const run = cue.sequence[1].items.find((i) => i.id === puppet.id);
  assert.equal(run.width, puppet.width);
  assert.ok(run.x > 120);
  assert.ok(!cue.sequence.at(-1).items.some((i) => i.id === puppet.id || i.id === candy.id));
  assert.ok(cue.sequence.every((step) => step.items.some((i) => i.art === "signpost")));
  const images = storyCastImages(stories.find((s) => s.id === "spinning-signpost-return"));
  for (const name of ["puppet-poses-v1", "lunch-cake-parcel-v1", "empty-delivery-wrap-v1"])
    assert.ok(images.includes(`/storybook-study/${name}.webp`));
});

test("puppet motions preserve one scale and the same boot baseline", async () => {
  const metrics = JSON.parse(await readFile("public/storybook-study/puppet-metrics.json", "utf8"));
  assert.equal(metrics.length, 8);
  for (const pose of metrics) {
    assert.equal(pose.scale, metrics[0].scale);
    assert.equal(pose.top + pose.height, 480);
    assert.ok(pose.left > 0 && pose.left + pose.width < 512);
  }
  assert.ok(metrics[6].height < metrics[0].height);
});

test("golem poses preserve scale and walking does not chase the alternating planted foot", async () => {
  const metrics = JSON.parse(await readFile("public/storybook-study/golem-metrics.json", "utf8"));
  assert.equal(metrics.length, 8);
  for (const pose of metrics) {
    assert.equal(pose.scale, metrics[0].scale);
    assert.equal(pose.top + pose.height, 480);
    assert.ok(pose.left > 0 && pose.left + pose.width < 512);
  }
  const walkRoots = metrics.slice(0, 5).map((pose) => pose.left);
  assert.ok(Math.max(...walkRoots) - Math.min(...walkRoots) < 12);
  assert.ok(metrics[5].height < metrics[0].height * 0.85);
  assert.ok(metrics[6].height < metrics[0].height * 0.9);
});

test("the struck puppet returns to the girl's side and stays there through the apology", () => {
  const id = "sweet-blockade-return";
  const first = studyCue(id, 0, true);
  const previous = first.sequence.at(-1).items.find((item) => item.id === "puppet");
  for (let line = 1; line <= 16; line++) {
    const cue = studyCue(id, line, true);
    const girl = cue.extras.find((extra) => extra.id === "masked-pumpety");
    const puppet = cue.items.find((item) => item.id === "puppet");
    assert.ok(Math.abs(puppet.x - girl.x) <= 5);
    assert.ok(Math.abs(puppet.bottom - girl.bottom) <= 6);
    assert.equal(puppet.travelMs, 850);
    if (line === 1) assert.ok(previous.x - puppet.x >= 10);
    if (line === 5) assert.equal(puppet.figure, "bow");
  }
});

test("workshop supplies follow registered painted palms through the recovery sequence", () => {
  const cue = studyCue("sweet-blockade-return", 0, true);
  assert.equal(cue.finishBeforeAdvance, true);
  assert.equal(storybookStageAttributes("sweet-blockade-return", 0)["data-paper-study"], true);
  for (const step of [cue, ...cue.sequence]) {
    const mira = step.actors.find((actor) => actor.id === "mira");
    const holding = step.items.some(
      (item) => ["honey", "cloth"].includes(item.art) && item.actor === "mira",
    );
    const expected = holding ? (mira.mossStudy === "reach" ? [93, 79] : [73, 84]) : [80, 80];
    assert.deepEqual(mira.wristPoints[14], expected);
    if (step.items.some((item) => item.id === "loot-cloth" && item.actor === "mira"))
      assert.ok(!step.items.some((item) => item.art === "cloth" && item.actor === "mira"));
    for (const item of step.items.filter(
      (item) => item.actor && ["medicine", "honey", "loot-cloth"].includes(item.id),
    )) {
      assert.equal(item.wrist, true);
      assert.equal(item.wristAnchor, "bottom");
    }
  }
});

test("the honey and cloth remain hand-sized and reach Mira's supporting hand before transfer", () => {
  const cue = studyCue("sweet-blockade-return", 0, true);
  const arrival = cue.sequence.find((step) => step.after === 3000);
  const handoff = cue.sequence.find((step) => step.after === 5000);
  const targets = (step, id) =>
    stageItemTarget(
      step.items.find((item) => item.id === id),
      { ...cue, ...step },
      new Map(step.actors.map((actor) => [actor.id, sampleStageActor(actor, actor, 10000, true)])),
    );
  for (const id of ["honey", "loot-cloth"]) {
    assert.deepEqual(targets(arrival, id), targets(handoff, id));
    const width = id === "honey" ? 3 : 4.5;
    assert.equal(arrival.items.find((item) => item.id === id).width, width);
    assert.equal(handoff.items.find((item) => item.id === id).width, width);
  }
  assert.deepEqual(targets(arrival, "cloth"), targets(handoff, "loot-cloth"));
  const before = cue.sequence
    .find((step) => step.after === 2200)
    .actors.find((a) => a.id === "aria");
  const moving = arrival.actors.find((a) => a.id === "aria");
  const mira = arrival.actors.find((a) => a.id === "mira");
  for (let time = 0; time <= journeyDuration(moving, before); time += 25)
    assert.ok(
      sampleJourney(moving, before, time, false).x - mira.x > 8,
      "Aria and Mira keep room between their heads",
    );
  const cradle = cue.sequence.find((step) => step.after === 5900);
  for (const id of ["honey", "loot-cloth"]) {
    const handed = handoff.items.find((item) => item.id === id),
      held = cradle.items.find((item) => item.id === id),
      next = studyCue("sweet-blockade-return", 1, true).items.find((item) => item.id === id);
    assert.notEqual(itemMotionSignature(handed), itemMotionSignature(held));
    assert.equal(itemMotionSignature(held), itemMotionSignature(next));
  }
});

test("Mira's parcel grip matches the actual painted hands at rest and through four steps", async () => {
  const cue = studyCue("sweet-blockade-return", 1, true);
  const mira = cue.actors.find((actor) => actor.id === "mira");
  const image = await sharp("public/storybook-study/mira-handheld-v1.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (const [stageFrame, artFrame] of [
    [14, 0],
    [15, 0],
    [16, 0],
    [8, 4],
    [9, 5],
    [22, 6],
    [23, 7],
  ]) {
    const [x, y] = handheldPalm("mira", artFrame);
    assert.deepEqual(mira.wristPoints[stageFrame], [Math.round(x / 1.5), Math.round(y / 1.5)]);
    const index =
      ((Math.floor(artFrame / 4) * 192 + y) * image.info.width + (artFrame % 4) * 192 + x) * 4 + 3;
    assert.ok(image.data[index] > 128, `frame ${artFrame} has an opaque hand at the grip`);
  }
  const reaching = studyCue("sweet-blockade-return", 0, true).actors.find(
    (actor) => actor.id === "mira",
  );
  assert.deepEqual(reaching.wristPoints[4], [93, 79]);
  const reach = await sharp("public/storybook-study/mira-workshop-reach-v1.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.ok(reach.data[(118 * reach.info.width + 139) * 4 + 3] > 128);
});

test("the workshop carrier consults and writes on the same held record", async () => {
  const id = "sweet-blockade-return";
  const arrival = studyCue(id, 12, true);
  const entered = arrival.sequence.at(-1);
  assert.equal(entered.extras.find((e) => e.id === "worker").showNotebook, true);
  for (let line = 12; line <= 16; line++) {
    const cue = studyCue(id, line, true);
    for (const step of [cue, ...(cue.sequence ?? [])]) {
      assert.ok(!step.items.some((item) => item.id === "carrier-record"));
      const worker = step.extras?.find((extra) => extra.id === "worker");
      if (!worker || worker.x > 100) continue;
      const frame = stageExtraFrame(worker, false, 0);
      assert.equal(frame, line < 15 ? 19 : 8);
      if (line >= 15) assert.equal(stageExtraFrame(worker, false, 320), 9);
    }
  }
  const metrics = JSON.parse(
    await readFile("public/storybook-study/porter-service-v1-metrics.json"),
  );
  for (const frame of [5, 6, 7]) {
    assert.equal(metrics[frame].top + metrics[frame].height, 120);
    assert.ok(Math.abs(metrics[frame].height - metrics[0].height) <= 1);
  }
  const images = storyCastImages(stories.find((story) => story.id === id));
  assert.ok(images.includes("/storybook-study/porter-service-v1.webp"));
  assert.ok(images.includes("/storybook-study/worker-poses-v1.webp"));
});
