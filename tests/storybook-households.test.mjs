import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { stories } from "../lib/stories.ts";
import { storyArtAt } from "../lib/story-art.ts";
import { storyStageCue, sampleStageActor } from "../lib/story-stage.ts";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { stageItemTarget, stageItemVisible } from "../lib/story-stage-props.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";
import { itemMotionSignature } from "../lib/story-stage-cargo.ts";
import { handheldPalm } from "../lib/road-handheld.ts";
import { storyCastImages } from "../lib/storybook/stage-images.ts";

test("household backgrounds cover every dialogue page and retain the existing later stills", () => {
  for (const [id, count] of [
    ["waiting-households-departure", 10],
    ["waiting-households-return", 4],
    ["medicine-road-home-departure", 8],
  ])
    for (let page = 0; page < count; page++) {
      const original = JSON.stringify(storyStageCue(id, page));
      const cue = studyCue(id, page, true);
      assert.ok(storybookPresentation(id, cue.background, page));
      assert.equal(JSON.stringify(storyStageCue(id, page)), original);
    }
  const story = stories.find((s) => s.id === "waiting-households-return");
  for (let page = 4; page < story.lines.length; page++) assert.ok(storyArtAt(story.id, page));
});

test("two helpers settle the box before Aria walks to the kitchen; chair remains visible beside the child", () => {
  const cue = studyCue("waiting-households-departure", 9, true);
  assert.equal(cue.finishBeforeAdvance, true);
  const placed = cue.sequence.find((s) => s.after === 2000),
    kitchen = cue.sequence.find((s) => s.after === 2600);
  assert.ok(cue.actors.filter((a) => ["aria", "leon"].includes(a.id)).every((a) => a.carry));
  const medicine = placed.items.find((i) => i.id === "medicine");
  const helpers = cue.actors.filter((a) => ["aria", "leon"].includes(a.id));
  assert.ok(
    Math.abs(helpers[0].x - helpers[1].x) >= 14,
    "the two helpers must not occupy the same floor space",
  );
  const positions = new Map(helpers.map((a) => [a.id, sampleStageActor(a, a, 10000)]));
  const heldAt = stageItemTarget(
    cue.items.find((i) => i.id === "medicine"),
    cue,
    positions,
  );
  assert.ok(
    Math.hypot(heldAt.x - medicine.x, heldAt.bottom - medicine.bottom) < 1.5,
    "box settles onto the nearby table rather than jumping sideways",
  );
  assert.equal(medicine.actor, undefined);
  assert.equal(medicine.support, "table");
  assert.equal(placed.actors.find((a) => a.id === "aria").x, 35);
  assert.equal(kitchen.actors.find((a) => a.id === "aria").x, 2);
  const end = cue.sequence.at(-1),
    mira = end.actors.find((a) => a.id === "mira"),
    chair = end.items.find((i) => i.id === "chair-mira");
  assert.equal(chair.seatFor, undefined);
  assert.equal(stageItemVisible(chair, new Map([["mira", { ...mira, onChair: true }]])), true);
  assert.ok(mira.x < end.extras.find((e) => e.id === "child").x);
});

test("bucket transfer is registered to nearby hands and follows Aria through the return walk", () => {
  const cue = studyCue("waiting-households-departure", 9, true);
  const before = cue.sequence.find((s) => s.after === 3300),
    after = cue.sequence.find((s) => s.after === 5000);
  const state = { ...cue, ...after };
  const aria = after.actors.find((a) => a.id === "aria"),
    cook = after.extras.find((e) => e.id === "cook");
  const positions = new Map([
    ["aria", sampleStageActor(aria, aria, 10000)],
    ["extra:cook", { ...cook, wrist: stageExtraWrist(cook, false, 0) }],
  ]);
  const from = stageItemTarget(
    before.items.find((i) => i.art === "water-bucket"),
    state,
    positions,
  );
  const to = stageItemTarget(
    after.items.find((i) => i.art === "water-bucket"),
    state,
    positions,
  );
  assert.ok(Math.hypot(from.x - to.x, from.bottom - to.bottom) < 1.5, JSON.stringify({ from, to }));
  assert.equal(cue.sequence.at(-1).items.find((i) => i.art === "water-bucket").wristAnchor, "top");
});

test("morning pickup preserves case size and cart traffic keeps its cargo and wheel height", () => {
  const morning = studyCue("medicine-road-home-departure", 0, true);
  assert.equal(morning.actors.find((a) => a.id === "mira").inspect, true);
  assert.equal(morning.sequence[0].actors.find((a) => a.id === "mira").healing, "rise");
  for (const s of [morning, ...morning.sequence])
    assert.equal(s.items.find((i) => i.id === "medicine").width, 8);
  const road = studyCue("medicine-road-home-departure", 4, true);
  const salute = road.sequence.find((s) => s.after === 4500).extras.find((e) => e.id === "worker");
  const lowering = road.sequence
    .find((s) => s.after === 4900)
    .extras.find((e) => e.id === "worker");
  assert.equal(stageExtraFrame(salute), 12);
  assert.equal(stageExtraFrame(lowering), 24);
  for (const s of [road, ...road.sequence]) {
    const cart = s.items.find((i) => i.art === "empty-cart"),
      worker = s.extras.find((e) => e.id === "worker");
    assert.equal(
      stageItemTarget(cart, { ...road, ...s }, new Map([["extra:worker", worker]])).bottom,
      20,
    );
    assert.equal(s.items.find((i) => i.id === "passing-goods").bottom, 14);
  }
});

test("Mira holds the morning medicine with her registered palms through the lift and walk", () => {
  const id = "medicine-road-home-departure";
  const cue = studyCue(id, 0, true);
  const rising = cue.sequence.find((step) => step.after === 700);
  const standing = cue.sequence.find((step) => step.after === 1500);
  const later = studyCue(id, 1, true);
  const item = (step) => step.items.find((prop) => prop.id === "medicine");
  assert.notEqual(itemMotionSignature(item(rising)), itemMotionSignature(item(standing)));
  assert.equal(itemMotionSignature(item(standing)), itemMotionSignature(item(later)));
  for (const step of [standing, later, studyCue(id, 4, true)]) {
    const mira = step.actors.find((actor) => actor.id === "mira");
    assert.equal(mira.holdingWalk, true);
    for (const [frame, artFrame] of [
      [14, 0],
      [8, 4],
      [9, 5],
      [22, 6],
      [23, 7],
    ]) {
      const [x, y] = handheldPalm("mira", artFrame);
      assert.deepEqual(mira.wristPoints[frame], [Math.round(x / 1.5), Math.round(y / 1.5)]);
    }
  }
  assert.ok(
    storyCastImages(stories.find((story) => story.id === id)).includes(
      "/storybook-study/mira-handheld-v1.webp",
    ),
  );
});

test("the returning carrier uses one row of the two-row painted walking atlas", async () => {
  const metrics = JSON.parse(
    await readFile("public/storybook-study/homeward-worker-v1-metrics.json"),
  );
  const image = await sharp("public/storybook-study/homeward-worker-v1.webp").metadata();
  assert.equal(metrics.length, 8);
  assert.equal(image.width, 512);
  assert.equal(image.height, 256);
  const css = await readFile("app/storybook/households.css", "utf8");
  for (const frame of [20, 21, 22, 23]) {
    const block = css.match(
      new RegExp(
        `\\[data-npc="worker"\\]\\s*\\.story-stage-extra-sprite\\[data-frame="${frame}"\\]\\s*\\{([^}]*)\\}`,
      ),
    )?.[1];
    assert.ok(block?.includes('url("/storybook-study/homeward-worker-v1.webp")'));
    assert.match(block, /background-size:\s*400% 200%/);
    assert.match(block, /background-position:\s*[\d.]+% 0%/);
  }
});

test("household people and bed keep one scale across poses with complete transparent gutters", async () => {
  for (const [name, count, cell] of [
    ["household-parent-v1", 8, 128],
    ["household-cook-v1", 8, 128],
    ["homeward-worker-v1", 8, 128],
    ["household-child-bed-v1", 4, 512],
  ]) {
    const metrics = JSON.parse(await readFile(`public/storybook-study/${name}-metrics.json`));
    assert.equal(metrics.length, count);
    assert.equal(new Set(metrics.map((m) => m.scale)).size, 1);
    const { data, info } = await sharp(`public/storybook-study/${name}.webp`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++)
        if (x % cell < 2 || x % cell >= cell - 2 || y % cell < 2 || y % cell >= cell - 2)
          assert.equal(data[(y * info.width + x) * 4 + 3], 0, `${name} clipped`);
  }
});
