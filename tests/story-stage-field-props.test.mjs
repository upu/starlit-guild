import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { spriteBounds } from "../scripts/home-pixel-frames.mjs";
import { storyStageCue as cue } from "../lib/story-stage.ts";

test("the lantern stays unlit through cleaning and lights with the evening narration", () => {
  const scene = "lantern-detour-return";
  const start = cue(scene, 0);
  assert.equal(start.items.find((p) => p.id === "stone-lantern").art, "stone-lantern-closed-sooty");
  assert.ok(start.items.find((p) => p.art === "oil-dish").stored);
  const cleaning = cue(scene, 2);
  const returningDish = cleaning.items.find((p) => p.art === "oil-dish");
  assert.equal(returningDish.actor, "leon");
  const finished = cleaning.sequence.at(-1).items;
  assert.equal(finished.find((p) => p.id === "stone-lantern").art, "stone-lantern-empty");
  assert.equal(finished.find((p) => p.art === "oil-dish").actor, "leon");
  for (let line = 3; line < 7; line++) {
    const lamp = cue(scene, line).items.find((p) => p.id === "stone-lantern");
    assert.equal(lamp.art, "stone-lantern-empty");
    assert.equal(lamp.glow, undefined);
  }
  const evening = cue(scene, 7)
    .sequence.at(-1)
    .items.find((p) => p.id === "stone-lantern");
  assert.equal(evening.art, "stone-lantern-closed-lit");
  const original = start.items.find((p) => p.id === "stone-lantern");
  assert.deepEqual(
    [evening.x, evening.bottom, evening.width],
    [original.x, original.bottom, original.width],
  );
});

test("all lantern states share the same canvas, roof height and foot contact", async () => {
  for (const name of [
    "stone-lantern-sooty",
    "stone-lantern-unlit",
    "stone-lantern",
    "stone-lantern-closed-sooty",
    "stone-lantern-empty",
    "stone-lantern-closed-lit",
  ]) {
    const path = `public/story-stage/prop-${name}.webp`;
    const metadata = await sharp(path).metadata();
    assert.deepEqual([metadata.width, metadata.height], [320, 400]);
    const bounds = await spriteBounds(path);
    assert.equal(bounds.top, 16);
    assert.equal(bounds.height, 376);
    assert.ok(bounds.left >= 8 && bounds.left + bounds.width <= 312);
  }
});

test("moss markers stay on the planted bed through the gardener and records scenes", () => {
  for (const [id, line] of [
    ["lico-records-departure", 32],
    ["lico-records-return", 0],
  ]) {
    const stage = cue(id, line);
    const marker = stage.items.find((p) => p.art === "plant-label");
    const moss = stage.items.find((p) => p.art === "colony");
    assert.ok(marker && moss);
    assert.ok(Math.abs(marker.bottom - moss.bottom) <= 2);
    assert.ok(Math.abs(marker.x - moss.x) < moss.width);
    assert.equal(marker.actor, undefined);
    assert.ok(marker.width < 4);
    assert.ok(stage.actors.every((a) => Math.abs(a.x - moss.x) > moss.width / 2));
  }
  assert.ok(!cue("brekka-moss-beds-departure", 0).items.some((p) => p.art === "ledger"));
});
