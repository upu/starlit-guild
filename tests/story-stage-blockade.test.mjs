import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { storyStageCue as cue, sampleStageActor } from "../lib/story-stage.ts";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { journeyDuration } from "../lib/story-stage-travel.ts";
import { transferBox } from "../lib/story-stage-props.ts";

const scene = "sweet-blockade-departure";
test("Aria arrives before aiming, retreats from the approaching dolls, and they respond differently", () => {
  const start = cue(scene, 10),
    approach = cue(scene, 11);
  const aria = approach.actors.find((a) => a.id === "aria");
  const origin = start.actors.find((a) => a.id === "aria");
  assert.ok(approach.sequence[0].after > journeyDuration(aria, origin));
  assert.equal(sampleStageActor(aria, origin, 100).atlas, "home");
  const aim = sampleStageActor(aria, aria, 5000);
  assert.deepEqual([aim.atlas, aim.frame], ["adventure", 11]);
  const retreat = approach.sequence.at(-1).actors.find((a) => a.id === "aria");
  assert.ok(retreat.x < aria.x && !retreat.bow);
  assert.equal(sampleStageActor(retreat, retreat, 5000).atlas, "conversation");
  const incoming = approach.sequence[0].items.find((p) => p.art === "puppet");
  const turned = cue(scene, 13).items.find((p) => p.art === "puppet");
  assert.ok(turned.x > incoming.x + 15, "small puppet returns to the goods");
  assert.equal(
    cue(scene, 13).items.find((p) => p.art === "golem").x,
    approach.sequence.at(-1).items.find((p) => p.art === "golem").x,
  );
});

test("the lure separates the golem from the guarded parcel without changing their scale", () => {
  const last = cue(scene, 21),
    final = last.sequence.at(-1);
  const first = cue(scene, 0);
  for (const art of ["golem", "puppet", "honey"])
    assert.equal(
      first.items.find((p) => p.art === art).width,
      final.items.find((p) => p.art === art).width,
    );
  const golem = final.items.find((p) => p.art === "golem"),
    puppet = final.items.find((p) => p.art === "puppet");
  assert.ok(puppet.x - golem.x > 35);
  assert.ok(final.actors.find((a) => a.id === "aria").bow === "aim");
  assert.ok(final.actors.find((a) => a.id === "mira").inspect);
  assert.ok(final.items.some((p) => p.art === "medicine"));
  assert.equal(final.items.find((p) => p.art === "honey").support, "table");
  const from = last.items.find((p) => p.art === "golem");
  const moving = last.sequence[0].items.find((p) => p.art === "golem");
  assert.ok(final.after - last.sequence[0].after >= moving.travelMs);
  const half = transferBox(from, moving, moving.travelMs / 2, false, moving.travelMs);
  assert.equal(half.x, (from.x + moving.x) / 2);
  assert.equal(transferBox(from, moving, 0, true, moving.travelMs).x, moving.x);
});

test("the reused bow frames preserve head size and foot contact while bent knees lower the crown", async () => {
  const walk = await readFrame("public/home-pixel/aria.webp", {
    left: 0,
    top: 0,
    width: 128,
    height: 128,
  });
  const head = await headBounds(await sharp(walk.cell).extract(walk.box).png().toBuffer(), 0.25);
  for (const frame of [11, 13]) {
    const bow = await readFrame("public/adventure-pixel/aria.webp", {
      left: (frame % 4) * 192,
      top: Math.floor(frame / 4) * 192,
      width: 192,
      height: 192,
    });
    const actual = await headBounds(await sharp(bow.cell).extract(bow.box).png().toBuffer(), 0.25);
    assert.ok(Math.abs(actual.width - head.width) <= 3);
    assert.ok(bow.box.height >= walk.box.height * 0.8 && bow.box.height <= walk.box.height);
    // The 192px atlas is displayed at 1.5 times the 128px actor cell, translated up 56px.
    assert.equal(bow.box.top + bow.box.height - 56, walk.box.top + walk.box.height);
  }
});
