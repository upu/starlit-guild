import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { storyStageCue as cue } from "../lib/story-stage.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageWrist } from "../lib/story-stage-wrists.ts";
import { stageItemTarget, stageItemDepth } from "../lib/story-stage-props.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";
import { storyArtAt } from "../lib/story-art.ts";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";

const scene = "keystone-night-road-departure";
const moments = (v) => [v, ...(v.sequence ?? []).map((s) => ({ ...v, ...s }))];
const actor = (v, id) => v.actors.find((a) => a.id === id);
const item = (v, id) => v.items.find((p) => p.id === id);
const positions = (v) =>
  new Map(
    v.actors.map((a) => {
      const pose = actorPose(a, false, 0, false);
      return [a.id, { ...a, wrist: stageWrist(a.id, pose.atlas, pose.frame) }];
    }),
  );
const target = (v, id) => stageItemTarget(item(v, id), v, positions(v));

test("the same display and cargo retain their scale through the injury scene", () => {
  const prior = cue("garden-reception-return", 18);
  for (let line = 0; line < 13; line++)
    for (const v of moments(cue(scene, line))) {
      for (const id of [
        "reception-cart",
        "replacement-parcel",
        "cart-pot-0",
        "cart-pot-1",
        "display-table",
        "case",
        "tower-stone",
        "display-pot",
      ])
        assert.equal(item(v, id).width, item(prior, id).width, id);
      assert.equal(v.background, prior.background);
      assert.ok(
        stageItemDepth(item(v, "case"), v, positions(v)) >
          stageItemDepth(item(v, "display-table"), v, positions(v)),
      );
    }
  const opening = moments(cue(scene, 0));
  assert.ok(item(opening[0], "cover-cloth").stored);
  assert.equal(item(opening[1], "cover-cloth").art, "cart-drape");
  assert.equal(item(opening[1], "tower-stone").stored, false);
});

test("the fitting falls toward Finn's hand, is caught above the floor, and is put down before wiping", () => {
  const fall = moments(cue(scene, 0)).at(-1),
    catchSteps = moments(cue(scene, 2));
  const caught = catchSteps.at(-1),
    placed = moments(cue(scene, 3))[1];
  assert.equal(actor(caught, "finn").handAction, "catch");
  assert.equal(item(caught, "broken-clip").actor, "finn");
  assert.ok(target(fall, "broken-clip").bottom > target(caught, "broken-clip").bottom);
  assert.ok(target(caught, "broken-clip").bottom > actor(caught, "finn").bottom + 4);
  assert.ok(Math.abs(target(fall, "broken-clip").x - target(caught, "broken-clip").x) < 4);
  assert.equal(item(placed, "broken-clip").actor, undefined);
  const wiping = moments(cue(scene, 3)).find((v) => actor(v, "finn").handAction === "wipe");
  assert.ok(wiping.after - placed.after >= item(placed, "broken-clip").travelMs);
  assert.equal(actor(cue(scene, 4), "finn").handAction, "guard");
});

test("Mira arrives before offering the cloth; the handoff stays between their actual hands", () => {
  const approach = cue(scene, 7),
    offered = moments(approach).at(-1);
  assert.ok(
    offered.after >= journeyDuration(actor(approach, "mira"), actor(cue(scene, 6), "mira")),
  );
  const taking = moments(cue(scene, 9));
  const from = target(taking[0], "palm-cloth"),
    to = target(taking[1], "palm-cloth");
  assert.ok(Math.hypot(from.x - to.x, ((from.bottom - to.bottom) * 2) / 3) < 3);
  assert.equal(item(taking[1], "palm-cloth").art, "cloth");
  assert.equal(item(taking[2], "palm-cloth").art, "stained-cloth");
  assert.ok(taking[2].after - taking[1].after >= 650);
  assert.equal(item(taking[2], "palm-cloth").width, item(taking[0], "palm-cloth").width);
});

test("Leon and Aria walk around companions, the cart and the display instead of through them", () => {
  const pot = moments(cue(scene, 12));
  assert.ok(pot[1].after >= journeyDuration(actor(pot[0], "aria"), actor(cue(scene, 11), "aria")));
  assert.equal(item(pot[1], "display-pot").actor, "aria");
  assert.ok(pot[2].after - pot[1].after >= 650);
  for (const [v, previous, id] of [
    [cue(scene, 11), cue(scene, 10), "leon"],
    [pot[2], pot[1], "aria"],
  ]) {
    const to = actor(v, id),
      from = actor(previous, id);
    for (let ms = 0; ms <= journeyDuration(to, from); ms += 25) {
      const p = sampleJourney(to, from, ms, false);
      for (const other of v.actors.filter((a) => a.id !== id))
        assert.ok(
          Math.hypot(p.x - other.x, ((p.bottom - other.bottom) * 2) / 3) >= 6.5,
          `${id}/${other.id} at ${ms}`,
        );
      const cart = target(v, "reception-cart");
      assert.ok(
        Math.abs(p.x - cart.x) > 17 || Math.abs(p.bottom - cart.bottom) > 15,
        `${id} crosses cart`,
      );
      assert.ok(p.x < 53 || p.x > 79 || p.bottom < 41 || p.bottom > 64, `${id} crosses table`);
    }
  }
});

test("Finn's hand poses preserve head scale, padded feet and established atlas frames", async () => {
  const atlas = "public/story-stage/finn-poses.webp",
    hash = createHash("sha256");
  const home = await readFrame("public/home-pixel/finn.webp", {
    left: 0,
    top: 0,
    width: 128,
    height: 128,
  });
  const normalHead = await headBounds(
    await sharp(home.cell).extract(home.box).png().toBuffer(),
    0.25,
  );
  for (let i = 0; i < 48; i++) {
    const bounds = { left: (i % 4) * 128, top: Math.floor(i / 4) * 128, width: 128, height: 128 };
    const frame = await readFrame(atlas, bounds);
    if (i >= 17 && i <= 20) {
      const head = await headBounds(
        await sharp(frame.cell).extract(frame.box).png().toBuffer(),
        0.25,
      );
      assert.ok(Math.abs(head.width - normalHead.width) <= 3, `head ${i}`);
      assert.equal(frame.box.top + frame.box.height, 120);
      assert.ok(frame.box.left > 0 && frame.box.left + frame.box.width < 128);
      assert.ok(
        i === 17 ? frame.box.height < 80 : frame.box.height >= 94 && frame.box.height <= 98,
      );
      const wrist = stageWrist("finn", "conversation", i);
      const pixels = await sharp(frame.cell).ensureAlpha().raw().toBuffer();
      assert.ok(pixels[(wrist.y * 128 + wrist.x) * 4 + 3] > 200, `visible hand ${i}`);
    } else if (i !== 32 && i !== 33) {
      const pixels = await sharp(atlas).extract(bounds).ensureAlpha().raw().toBuffer();
      for (let j = 0; j < pixels.length; j += 4) if (!pixels[j + 3]) pixels.fill(0, j, j + 3);
      hash.update(pixels);
    }
  }
  assert.equal(
    hash.digest("hex"),
    "2149bfaf24bce274fafdbc3b88691ca245e260ac3007af635b50058ea0b5fec4",
  );
});

test("the existing treatment illustration keeps its original interval", () => {
  for (let line = 0; line < 13; line++) assert.equal(storyArtAt(scene, line), undefined);
  for (let line = 13; line < 36; line++)
    assert.equal(storyArtAt(scene, line).src, "/stories/mira-tends-finn.webp");
});
