import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { storyStageCue, storyStageExitCue } from "../lib/story-stage.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
import { extraTravelDuration, sampleExtraTravel } from "../lib/story-stage-extra-travel.ts";
import { stageExtraFrame, stageExtraRows } from "../lib/story-stage-figure.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { spriteBounds, readFrame } from "../scripts/home-pixel-frames.mjs";

const departure = "medicine-road-home-departure",
  returned = "medicine-road-home-return";
const moments = (cue) => [cue, ...(cue.sequence ?? []).map((s) => ({ ...cue, ...s }))];

test("the homeward supplies stay closed, sized consistently and with their owners until unloading", () => {
  for (const id of [departure, returned]) {
    const count = id === departure ? 8 : 11;
    for (let line = 0; line < count; line++)
      for (const cue of moments(storyStageCue(id, line))) {
        for (const actor of cue.actors) assert.equal(actor.dressed, true);
        const box = cue.items.find((i) => i.id === "medicine"),
          bag = cue.items.find((i) => i.id === "bottle-bag");
        assert.equal(box.art, "medicine-closed");
        assert.equal(box.width, 8);
        assert.equal(bag.art, "empty-bottles");
        assert.equal(bag.width, 8);
        if (box.actor) assert.equal(box.actor, "mira");
        if (bag.actor) assert.equal(bag.actor, "leon");
        assert.equal(new Set(cue.items.map((i) => i.id)).size, cue.items.length);
      }
  }
  for (const id of ["medicine", "bottle-bag"]) {
    const exit = storyStageExitCue(departure).items.find((i) => i.id === id);
    const next = storyStageCue(returned, 0).items.find((i) => i.id === id);
    assert.deepEqual(exit, next);
  }
  for (let line = 11; line < 25; line++) assert.equal(storyStageCue(returned, line), null);
  for (const cue of moments(storyStageCue(returned, 1)))
    assert.deepEqual(cue.extras, [], "the road carrier does not follow the party indoors");
});

test("the cart reaches its pause before the hat greeting, then carries its load past the waiting trio", () => {
  const cue = stageCameraCue(storyStageCue(departure, 4));
  const moving = cue.sequence.find((s) => s.after === 900),
    stop = cue.sequence.find((s) => s.after === 4500);
  const worker = moving.extras[0],
    origin = cue.extras[0];
  assert.ok(extraTravelDuration(worker, origin) < stop.after - moving.after);
  const stopped = sampleExtraTravel(worker, origin, stop.after - moving.after, false);
  assert.equal(stopped.moving, false);
  assert.equal(stageExtraFrame(stop.extras[0], false), 12);
  assert.equal(stageExtraRows(worker), 6);
  const cart = cue.items.find((i) => i.art === "empty-cart");
  for (const t of [100, 300, 600, 1200, 2500]) {
    const at = sampleExtraTravel(worker, origin, t, false);
    const p = stageItemTarget(cart, cue, new Map([["extra:worker", at]]));
    assert.equal(p.x - at.x, 8);
    assert.equal(p.bottom - at.bottom, -2);
  }
  const final = cue.sequence.at(-1);
  assert.ok(final.extras[0].x < -50);
  for (const actor of final.actors) assert.ok(actor.bottom >= 46);
  assert.equal(cue.items.find((i) => i.id === "passing-goods").carrier, "empty-cart");
});

test("three individual cups are filled in order and the server remains in front of the desk", () => {
  const cue = storyStageCue(returned, 9),
    table = cue.items.find((i) => i.id === "table");
  const filled = [];
  for (const state of moments(cue)) {
    const cups = state.items.filter((i) => /^tea-/.test(i.id));
    assert.equal(cups.length, 3);
    assert.ok(cups.every((i) => i.width === 2.8 && i.support === "table"));
    filled.push(cups.filter((i) => i.art === "teacup").length);
    const pot = state.items.find((i) => i.id === "teapot");
    if (pot.actor) {
      const aria = state.actors.find((a) => a.id === "aria");
      assert.ok(aria.bottom < table.bottom, "the table must not cover the server");
    }
  }
  assert.deepEqual([...new Set(filled)], [0, 1, 2, 3]);
  const call = storyStageCue(returned, 10);
  assert.equal(call.items.find((i) => i.id === "tea-0").actor, "aria");
  assert.equal(call.sequence.at(-1).actors.find((a) => a.id === "mira").chair, true);
});

test("the raised hat fits its common cell without shrinking the worker's body", async () => {
  const atlas = "public/story-stage/worker-poses.webp";
  const frame = await readFrame(atlas, { left: 0, top: 384, width: 128, height: 128 });
  assert.ok(frame.box.left >= 2 && frame.box.top >= 2);
  assert.equal(frame.box.top + frame.box.height, 120);
  const hair = await sharp(frame.cell)
    .extract({ left: 37, top: 24, width: 53, height: 30 })
    .png()
    .toBuffer();
  const head = await spriteBounds(hair);
  assert.ok(head.width >= 50 && head.width <= 53);
  assert.equal((await sharp(atlas).metadata()).height, stageExtraRows({ id: "worker" }) * 128);
});
