import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { storyStageCue, storyStageExitCue, sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget, stageItemVisible } from "../lib/story-stage-props.ts";
import { stageExtraFrame, stageExtraRows } from "../lib/story-stage-figure.ts";
import { sampleExtraTravel, extraTravelDuration } from "../lib/story-stage-extra-travel.ts";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";

const departed = "waiting-households-departure",
  returned = "waiting-households-return";
const moments = (id, line) => {
  const cue = storyStageCue(id, line);
  return [cue, ...(cue.sequence ?? []).map((m) => ({ ...cue, ...m }))];
};

test("the three dressings, closed medicine and packed honey continue from 2-7", () => {
  const before = storyStageExitCue("sweet-blockade-return"),
    arrival = storyStageCue(departed, 0);
  for (const id of ["medicine", "honey-bag", "honey", "loot-cloth"]) {
    const a = before.items.find((i) => i.id === id),
      b = arrival.items.find((i) => i.id === id);
    for (const key of ["art", "width", "actor", "carrier", "stored"])
      assert.equal(a[key], b[key], `${id}/${key}`);
  }
  for (let line = 0; line < 10; line++)
    for (const cue of moments(departed, line))
      for (const actor of cue.actors) {
        assert.equal(actor.dressed, true);
        assert.ok(cue.items.some((i) => i.wrist && i.actor === actor.id));
      }
  for (let line = 0; line < 4; line++) {
    const cue = storyStageCue(returned, line);
    for (const actor of cue.actors) {
      const sample = sampleStageActor(actor, actor, 0, true);
      assert.ok(sample.wrist, `${line}/${actor.id}`);
      const item = cue.items.find((i) => i.wrist && i.actor === actor.id);
      assert.equal(stageItemVisible(item, new Map([[actor.id, sample]])), true);
    }
    assert.equal(cue.items.find((i) => i.id === "medicine").width, 8);
    assert.equal(cue.items.find((i) => i.id === "honey").width, 6);
  }
  for (let line = 4; line < 19; line++)
    assert.equal(storyStageCue(returned, line), null, "keep authored stills");
});

test("Mira grips the bag while carrying and puts it down before sitting", () => {
  for (const cue of [storyStageCue(departed, 0), ...moments(departed, 9)]) {
    const actor = cue.actors.find((a) => a.id === "mira"),
      bag = cue.items.find((i) => i.id === "honey-bag");
    if (!bag.actor) {
      assert.ok(actor.seated);
      continue;
    }
    assert.equal(actor.carry, true);
    for (const elapsed of [0, 140, 280]) {
      const at = sampleStageActor(actor, { ...actor, x: actor.x - 6 }, elapsed);
      const item = stageItemTarget(bag, cue, new Map([[actor.id, at]]));
      const handX = at.x + (((at.wrist.x - 64) * cue.cell) / 128) * (at.left ? -1 : 1);
      const handY = at.bottom + (((128 - at.wrist.y) * cue.cell) / 128) * 1.5;
      assert.ok(Math.abs(handX - item.x) < 1);
      assert.ok(Math.abs(handY - (item.bottom + (217 / 256) * bag.width * 1.5)) < 1);
    }
  }
});

test("the medicine is placed indoors and the water bucket transfers only at joined hands", () => {
  const cue = storyStageCue(departed, 9);
  assert.equal(cue.background, "patient-room");
  const placement = cue.sequence.find((m) => m.after === 2000);
  assert.equal(placement.items.find((i) => i.id === "medicine").support, "table");
  const before = cue.sequence.find((m) => m.after === 3300),
    transfer = cue.sequence.find((m) => m.after === 3800);
  const a = before.items.find((i) => i.art === "water-bucket"),
    b = transfer.items.find((i) => i.art === "water-bucket");
  const cook = before.extras.find((e) => e.id === "cook"),
    aria = transfer.actors.find((a) => a.id === "aria");
  const from = stageItemTarget(a, { ...cue, ...before }, new Map([["extra:cook", cook]]));
  const to = stageItemTarget(
    b,
    { ...cue, ...transfer },
    new Map([["aria", sampleStageActor(aria, aria, 0, true)]]),
  );
  assert.ok(
    Math.hypot(from.x - to.x, (from.bottom - to.bottom) / 1.5) < 1,
    "hands meet without a flying bucket",
  );
  assert.equal(a.width, b.width);
  assert.equal(aria.carry, true);
  const exit = storyStageExitCue(departed);
  for (const id of ["aria", "leon"]) assert.ok(exit.actors.find((a) => a.id === id).x < 0);
  assert.equal(exit.items.find((i) => i.art === "water-bucket").actor, "aria");
});

test("the parent has an asymmetric gait and reaches the bed around its front", () => {
  const outside = storyStageCue(departed, 1).extras.find((e) => e.id === "parent");
  assert.deepEqual(
    [100, 300, 450, 650].map((t) => stageExtraFrame(outside, true, t)),
    [4, 5, 6, 7],
  );
  assert.equal(stageExtraRows(outside), 2);
  assert.equal(stageExtraFrame(outside, false, 300), 0);
  const origin = storyStageCue(departed, 9).extras.find((e) => e.id === "parent");
  const target = storyStageCue(departed, 9).sequence[0].extras.find((e) => e.id === "parent");
  for (let time = 0; time <= extraTravelDuration(target, origin); time += 50) {
    const at = sampleExtraTravel(target, origin, time, false);
    if (at.x > 65 && at.x < 93)
      assert.ok(at.bottom <= 40.01, "clear the mattress and Mira's chair");
  }
  assert.deepEqual(
    sampleExtraTravel(target, origin, extraTravelDuration(target, origin) + 1, false),
    { x: 97, bottom: 52, left: true, moving: false },
  );
});

test("the parent's wave and walking frames preserve the original head, height and padded feet", async () => {
  const source = "public/story-stage/parent-poses.webp";
  const base = await readFrame(source, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
  const walking = [];
  for (let i = 1; i < 8; i++) {
    const f = await readFrame(source, {
      left: (i % 4) * 128,
      top: Math.floor(i / 4) * 128,
      width: 128,
      height: 128,
    });
    const actual = await headBounds(await sharp(f.cell).extract(f.box).png().toBuffer(), 0.25);
    assert.ok(Math.abs(actual.width - head.width) <= 2);
    assert.ok(Math.abs(f.box.height - base.box.height) <= 3);
    assert.equal(f.box.top + f.box.height, 120);
    assert.ok(f.box.left >= 2 && f.box.left + f.box.width <= 126 && f.box.top >= 2);
    if (i >= 4) walking.push(f.cell.toString("base64"));
  }
  assert.equal(new Set(walking).size, 4);
});
