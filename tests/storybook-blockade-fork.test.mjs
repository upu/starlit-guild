import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { storyStageCue, sampleStageActor } from "../lib/story-stage.ts";
import { dressingItem } from "../lib/story-stage-dressings.ts";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { orderStageItems } from "../lib/story-stage-cargo.ts";

test("the fork keeps one portable pole, registered grip and a clear cart lane across all15 pages", () => {
  const id = "sweet-blockade-return";
  for (let page = 17; page < 32; page++) {
    const before = JSON.stringify(storyStageCue(id, page));
    const cue = studyCue(id, page, true);
    assert.equal(storybookPresentation(id, cue.background, page).art, "mountain-fork-v1");
    for (const state of [cue, ...(cue.sequence ?? [])]) {
      assert.equal(state.items.filter((i) => i.art === "signpost-portable").length, 1);
      if (page < 22) assert.equal(state.actors.find((a) => a.id === "mira").bottom, 32);
      for (const jar of state.items.filter((i) => i.art === "honey")) assert.equal(jar.width, 3);
      for (const cloth of state.items.filter((i) => i.id === "loot-cloth"))
        assert.equal(cloth.width, 5);
    }
    assert.equal(JSON.stringify(storyStageCue(id, page)), before);
  }
  const transfer = studyCue(id, 17, true);
  assert.equal(transfer.finishBeforeAdvance, true);
  const held = transfer.sequence.find((s) =>
    s.items.some((i) => i.art === "signpost-portable" && i.actor === "leon"),
  );
  assert.equal(held.items.find((i) => i.art === "signpost-portable").wrist, true);
  assert.equal(
    transfer.items.find((i) => i.art === "signpost-portable").tilt,
    held.items.find((i) => i.art === "signpost-portable").tilt,
  );
  const planting = transfer.sequence.find((s) => s.after === 4000);
  const released = transfer.sequence.find((s) => s.after === 4700);
  assert.equal(planting.actors.find((a) => a.id === "leon").carry, true);
  assert.equal(released.actors.find((a) => a.id === "leon").carry, false);
  assert.ok(released.after - planting.after >= 650);
  assert.ok(held.extras.find((e) => e.id === "worker").x <= 20);
  const exit = storybookExitCue(id);
  assert.equal(exit.items.find((i) => i.art === "honey-bag").wristAnchor, "top");
});

test("the sign-carrying puppet remains visible beside Leon during the handoff", () => {
  const cue = studyCue("sweet-blockade-return", 17, true);
  const arriving = cue.sequence.find((step) => step.after === 600);
  const pickup = cue.sequence.find((step) => step.after === 2400);
  const target = (step) => {
    const stage = { ...cue, ...step };
    const positions = new Map(
      stage.actors.map((actor) => [actor.id, sampleStageActor(actor, actor, 10000, true)]),
    );
    for (const item of orderStageItems(stage.items)) {
      const at = stageItemTarget(item, stage, positions);
      positions.set(`item:${item.id}`, { ...at, mirrored: !!item.left });
    }
    return positions;
  };
  const before = target(arriving),
    after = target(pickup);
  assert.ok(before.get("leon").x - before.get("item:puppet").x >= 9);
  const first = before.get("item:signpost-portable"),
    second = after.get("item:signpost-portable");
  assert.ok(Math.hypot(first.x - second.x, first.bottom - second.bottom) < 3.1);
  assert.equal(arriving.items.find((item) => item.id === "signpost-portable").tilt, -75);
  assert.equal(pickup.items.find((item) => item.id === "signpost-portable").tilt, -75);
});

test("Aria's registered bandage hand meets Mira's seated wrist without changing either body scale", () => {
  const cue = studyCue("sweet-blockade-return", 30, true);
  const step = cue.sequence.find((s) => s.after === 1500);
  const positions = new Map(
    step.actors.map((actor) => [actor.id, sampleStageActor(actor, actor, 10000)]),
  );
  const state = { ...cue, ...step };
  const from = stageItemTarget(
    step.items.find((i) => i.id === "bandage" && i.actor === "aria"),
    state,
    positions,
  );
  const to = stageItemTarget(dressingItem("mira"), state, positions);
  assert.ok(Math.hypot(from.x - to.x, from.bottom - to.bottom) < 1.1);
});

test("Mira's packing crouch uses her painted carrying sheet at the same body scale", async () => {
  const cue = studyCue("sweet-blockade-return", 22, true);
  const step = cue.sequence.find((entry) => entry.after === 1400);
  const mira = step.actors.find((actor) => actor.id === "mira");
  assert.equal(sampleStageActor(mira, mira, 10000, true).frame, 13);
  const metrics = JSON.parse(
    await readFile("public/storybook-study/mira-handheld-v1-metrics.json"),
  );
  assert.equal(metrics[1].scale, metrics[0].scale);
  assert.equal(metrics[1].baseline, metrics[0].baseline);
  assert.ok(metrics[1].height < metrics[0].height * 0.85);
  const css = await readFile("app/storybook/blockade-fork.css", "utf8");
  assert.match(
    css,
    /\[data-frame="13"\]\s*\{\s*background-image: url\("\/storybook-study\/mira-handheld-v1\.webp"\)/,
  );
});

test("cart ownership changes preserve both wheel height and load position at the handle grip", () => {
  const cue = studyCue("sweet-blockade-return", 20, true);
  const parked = cue.items.find((i) => i.art === "empty-cart");
  const moving = cue.sequence.find((s) => s.items.some((i) => i.art === "empty-cart" && i.extra));
  const extra = moving.extras.find((e) => e.id === "worker");
  assert.equal(extra.pullCart, true);
  const positions = new Map([["extra:worker", { x: 16.9, bottom: 11.5 }]]);
  const item = moving.items.find((i) => i.art === "empty-cart");
  const at = stageItemTarget(item, { ...cue, ...moving }, positions);
  assert.deepEqual(at, { x: parked.x, bottom: parked.bottom });
  positions.set("item:empty-cart", at);
  const cargo = moving.items.find((i) => i.id === "other-goods");
  assert.equal(stageItemTarget(cargo, { ...cue, ...moving }, positions).bottom, at.bottom + 14);
  assert.ok(
    cue.sequence.some((s) =>
      s.extras.some((e) => e.id === "worker" && e.pose === "wave" && e.bottom === 11.5),
    ),
  );
});

test("masked child and pushing worker retain one body scale, safe margins and grounded boots", async () => {
  for (const [name, count, cell, height] of [
    ["masked-pumpety-v1", 12, 128, 78],
    ["worker-push-road-v1", 4, 128, 94],
  ]) {
    const metrics = JSON.parse(await readFile(`public/storybook-study/${name}-metrics.json`));
    assert.equal(metrics.length, count);
    assert.equal(new Set(metrics.map((m) => m.scale)).size, 1);
    assert.equal(metrics[0].height, height);
    assert.ok(metrics.every((m) => Math.abs(m.baseline - 120) <= 1));
    const { data, info } = await sharp(`public/storybook-study/${name}.webp`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++)
        if (x % cell === 0 || x % cell === cell - 1 || y % cell === 0 || y % cell === cell - 1)
          assert.ok(data[(y * info.width + x) * 4 + 3] <= 16, `${name} clipped`);
    if (name.startsWith("masked")) assert.ok(metrics[9].height < metrics[0].height * 0.9);
    else assert.ok(metrics.every((m) => m.head.x === metrics[0].head.x));
  }
});
