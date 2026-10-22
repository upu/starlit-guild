import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { spriteBounds } from "../scripts/home-pixel-frames.mjs";
import { storyStageCue as cue, sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";

test("medicine lid and teapot variants retain footprint registration and transparent canvases", async () => {
  for (const [a, b] of [
    ["medicine", "medicine-closed"],
    ["teapot", "teapot-open"],
  ]) {
    const path = (name) => `public/story-stage/prop-${name}.webp`;
    const left = await sharp(path(a)).metadata(),
      right = await sharp(path(b)).metadata();
    assert.deepEqual([left.width, left.height], [right.width, right.height]);
    assert.ok(left.hasAlpha && right.hasAlpha);
    const ba = await spriteBounds(await sharp(path(a)).png().toBuffer());
    const bb = await spriteBounds(await sharp(path(b)).png().toBuffer());
    assert.ok(Math.abs(ba.width - bb.width) <= 2);
    assert.ok(Math.abs(ba.top + ba.height - bb.top - bb.height) <= 1, "bottom contact stays fixed");
    assert.ok(bb.height < ba.height, "closing chest or removing pot lid changes height, not scale");
  }
});

test("Mira closes the box and approaches before taking the cup, then returns to her own seat", () => {
  const opening = cue("mountain-entrance-return", 0);
  assert.equal(opening.items.find((i) => i.id === "medicine").art, "medicine-closed");
  assert.equal(opening.sequence[0].items.find((i) => i.id === "medicine").art, "medicine");
  const rest = cue("mountain-entrance-return", 4);
  assert.equal(rest.items.find((i) => i.id === "medicine").art, "medicine-closed");
  const take = rest.sequence.find(
    (s) => s.items.find((i) => i.id === "mira-cup")?.actor === "mira",
  );
  const origin = cue("mountain-entrance-return", 3).actors.find((a) => a.id === "mira");
  assert.ok(
    take.after >=
      journeyDuration(
        rest.actors.find((a) => a.id === "mira"),
        origin,
      ),
  );
  const positions = new Map(take.actors.map((a) => [a.id, sampleStageActor(a, a, 5000)]));
  const from = stageItemTarget(
    rest.items.find((i) => i.id === "mira-cup"),
    rest,
    positions,
  );
  const to = stageItemTarget(
    take.items.find((i) => i.id === "mira-cup"),
    rest,
    positions,
  );
  assert.deepEqual(from, to, "the cup changes owner at the meeting hands");
  const settled = rest.sequence.at(-1),
    mira = settled.actors.find((a) => a.id === "mira");
  const leon = settled.actors.find((a) => a.id === "leon");
  assert.ok(mira.seated && leon.seated && mira.x - leon.x >= 14);
  const seat = settled.items.find((i) => i.id === "seat-mira");
  assert.ok(Math.abs(seat.x - mira.x) < 2);
});

test("tea is prepared in order: three empty cups, tilted kettle, water, then steaming wait", () => {
  const rest = cue("mountain-entrance-return", 4);
  for (const step of [rest, ...rest.sequence]) {
    assert.equal(step.items.filter((i) => i.art === "empty-cup").length, 3);
    assert.ok(
      !step.items.some((i) => ["tea", "tea-four", "teacup"].includes(i.art)),
      "no already brewed cups",
    );
    assert.equal(step.items.find((i) => i.id === "teapot").support, "tea-stone");
  }
  const pouring = rest.sequence.findIndex((s) => s.items.some((i) => i.pouring));
  const before = rest.sequence[pouring - 1];
  assert.ok(
    rest.sequence[pouring].after - before.after >= 650,
    "the kettle settles before water appears",
  );
  assert.ok(!before.items.some((i) => i.steaming));
  const waiting = cue("mountain-entrance-return", 5);
  assert.ok(!waiting.items.some((i) => i.pouring));
  assert.ok(waiting.items.find((i) => i.id === "teapot").steaming);
  assert.equal(waiting.items.find((i) => i.id === "mira-cup").actor, "mira");
  assert.ok(
    waiting.actors.every((a) => a.seated),
    "advancing skips to the completed preparation",
  );
  assert.equal(
    cue("mountain-entrance-return", 10).actors.find((a) => a.id === "aria").pose,
    "idle",
  );
});
