import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { storyStageCue as cue } from "../lib/story-stage.ts";
import { stageItemTarget, stageItemDepth } from "../lib/story-stage-props.ts";
import { extraTravelDuration } from "../lib/story-stage-extra-travel.ts";
import { stageExtraFrame, stageExtraRows } from "../lib/story-stage-figure.ts";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";

const id = "manor-survey-departure";
const moments = (v) => [v, ...(v.sequence ?? []).map((s) => ({ ...v, ...s }))];
const item = (v, name) => v.items.find((p) => p.id === name);
const cook = (v) => v.extras.find((e) => e.id === "cook");
const positions = (v) =>
  new Map([
    ...v.actors.map((a) => [a.id, a]),
    ...(v.extras ?? []).map((e) => [`extra:${e.id}`, e]),
  ]);
const target = (v, name) => stageItemTarget(item(v, name), v, positions(v));

test("survey uses a back-worn bag, a gate, and the same kitchen door as the earlier visit", () => {
  const road = cue(id, 0),
    bag = item(road, "tool-rucksack");
  assert.equal(bag.actor, "leon");
  assert.ok(
    stageItemDepth(bag, road, positions(road)) <
      100 - road.actors.find((a) => a.id === "leon").bottom,
  );
  assert.equal(cue(id, 9).background, "manor-gate");
  assert.equal(cue(id, 12).background, cue("riverside-manor-departure", 3).background);
  assert.equal(cue(id, 12).cut, true);
});

test("the cook arrives before taking the pot, then lifts its separate lid before inspecting", () => {
  const steps = moments(cue(id, 12));
  const arrival = steps.find((s) => s.after === 1800),
    pickup = steps.find((s) => s.after === 2200);
  assert.ok(arrival.after - steps[1].after >= extraTravelDuration(cook(steps[1]), cook(steps[0])));
  assert.deepEqual(target(arrival, "borrowed-pot"), target(pickup, "borrowed-pot"));
  assert.equal(item(pickup, "pot-lid").carrier, "borrowed-pot");
  const lifted = steps.find((s) => s.after === 2900),
    inspecting = steps.at(-1);
  assert.equal(item(lifted, "pot-lid").extra, "cook");
  assert.equal(cook(inspecting).kitchen, "inspect");
  assert.ok(inspecting.after - lifted.after >= 650);
  for (let line = 0; line < 16; line++)
    for (const step of moments(cue(id, line))) {
      const p = item(step, "borrowed-pot");
      if (p) {
        assert.equal(p.width, 5.8);
        assert.equal(p.art, "survey-pot");
      }
    }
});

test("the cloth changes hands at contact and the cook takes the closed pot through the doorway", () => {
  const steps = moments(cue(id, 15)),
    giving = steps[1],
    received = steps[2],
    leaving = steps[3];
  assert.deepEqual(target(giving, "scrubbing-rag"), target(received, "scrubbing-rag"));
  const carried = item(leaving, "borrowed-pot");
  assert.equal(carried.extra, "cook");
  assert.equal(
    target(received, "borrowed-pot").bottom - cook(received).bottom,
    target(leaving, "borrowed-pot").bottom - cook(leaving).bottom,
  );
  assert.equal(item(leaving, "pot-lid").carrier, "borrowed-pot");
  assert.ok(steps[4].after - leaving.after > extraTravelDuration(cook(leaving), cook(received)));
  assert.equal(steps[4].extras.length, 0);
  assert.equal(item(steps[4], "borrowed-pot"), undefined);
  assert.equal(item(steps[4], "scrubbing-rag").actor, "finn");
});

test("cook inspection and cloth poses retain standing head width, height and safe cell margins", async () => {
  const atlas = "public/story-stage/cook-poses.webp";
  const prior = await sharp(atlas)
    .extract({ left: 0, top: 0, width: 512, height: 384 })
    .ensureAlpha()
    .raw()
    .toBuffer();
  for (let i = 0; i < prior.length; i += 4) if (!prior[i + 3]) prior.fill(0, i, i + 3);
  assert.equal(
    createHash("sha256").update(prior).digest("hex"),
    "e77eafb41fdb6f2e307d08279f3937f9f8f693310615931754ae1cce8065dd22",
  );
  const ref = await readFrame(atlas, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(await sharp(ref.cell).extract(ref.box).png().toBuffer(), 0.25);
  for (const [i, kitchen] of ["pot", "lid", "inspect", "cloth"].entries()) {
    const extra = { id: "cook", kitchen };
    assert.equal(stageExtraFrame(extra), 12 + i);
    assert.equal(stageExtraRows(extra), 4);
    const frame = await readFrame(atlas, { left: i * 128, top: 384, width: 128, height: 128 });
    const current = await headBounds(
      await sharp(frame.cell).extract(frame.box).png().toBuffer(),
      0.25,
    );
    assert.ok(Math.abs(current.width - head.width) <= 2);
    assert.equal(frame.box.height, ref.box.height);
    assert.equal(frame.box.top + frame.box.height, 120);
    assert.ok(frame.box.left >= 2 && frame.box.left + frame.box.width <= 126 && frame.box.top >= 2);
  }
});
