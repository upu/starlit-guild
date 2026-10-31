import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { storyStageCue as cue, storyStageExitCue } from "../lib/story-stage.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
import { stageItemTarget, stageItemDepth, stageItemVisible } from "../lib/story-stage-props.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { extraTravelDuration } from "../lib/story-stage-extra-travel.ts";
import { sampleJourney, journeyDuration } from "../lib/story-stage-travel.ts";
import { spriteBounds } from "../scripts/home-pixel-frames.mjs";

const departure = "garden-reception-departure",
  returned = "garden-reception-return";
const moments = (v) => [v, ...(v.sequence ?? []).map((s) => ({ ...v, ...s }))];
const item = (v, id) => v.items.find((p) => p.id === id);
const actor = (v, id) => v.actors.find((a) => a.id === id);
const positions = (v) =>
  new Map([...v.actors.map((a) => [a.id, a]), ...v.extras.map((e) => [`extra:${e.id}`, e])]);
const target = (v, id) => stageItemTarget(item(v, id), v, positions(v));

test("reception keeps one cart, two pots and the same wrapped replacement through both scenes", () => {
  const priorPot = item(cue("manor-survey-return", 1), "garden-pot");
  for (const [id, count] of [
    [departure, 18],
    [returned, 19],
  ])
    for (let line = 0; line < count; line++)
      for (const v of moments(cue(id, line))) {
        assert.equal(item(v, "reception-cart").width, 26);
        assert.equal(item(v, "replacement-parcel").width, 6.2);
        assert.equal(item(v, "replacement-parcel").carrier, "reception-cart");
        for (const key of ["cart-pot-0", "cart-pot-1"]) {
          assert.equal(item(v, key).width, priorPot.width);
          assert.equal(item(v, key).carrier, "reception-cart");
        }
      }
  const parked = cue(departure, 16),
    pushing = cue(departure, 17);
  assert.deepEqual(target(parked, "reception-cart"), target(pushing, "reception-cart"));
  assert.ok(actor(pushing, "finn").carry);
});

test("the snag and dropped fitting precede pickup, and the bag reaches the kitchen before transfer", () => {
  const drop = moments(cue(departure, 6));
  assert.equal(item(drop[0], "tool-rucksack").actor, "leon");
  assert.equal(item(drop[1], "tool-rucksack").actor, undefined);
  assert.equal(item(drop[2], "loose-fastener").carrier, undefined);
  assert.ok(
    Math.abs(target(drop[2], "loose-fastener").x - target(drop[2], "tool-rucksack").x) >
      (2 + 6.5) / 2,
  );
  const pickup = moments(cue(departure, 10));
  const receive = pickup.find((v) => item(v, "tool-rucksack").extra === "cook");
  const walk = pickup.find((v) => actor(v, "leon").bottom === 76);
  const origin = pickup[pickup.indexOf(walk) - 1];
  assert.ok(
    receive.after - walk.after >= journeyDuration(actor(walk, "leon"), actor(origin, "leon")),
  );
  const from = target(walk, "tool-rucksack"),
    to = target(receive, "tool-rucksack");
  assert.ok(Math.hypot(from.x - to.x, from.bottom - to.bottom) < 0.01);
  for (const v of pickup) assert.equal(item(v, "tool-rucksack").width, 6.5);
  assert.ok(item(cue(departure, 11), "tool-rucksack").stored);
  assert.equal(item(cue(departure, 11), "spare-rope").carrier, "reception-cart");
  const entering = pickup.find((v) => v.extras.some((e) => e.id === "cook" && e.bottom > 76));
  const inside = pickup.find((v) => item(v, "tool-rucksack").stored);
  const cook = entering.extras.find((e) => e.id === "cook");
  assert.ok(
    inside.after - entering.after >=
      extraTravelDuration(
        cook,
        receive.extras.find((e) => e.id === "cook"),
      ),
  );
  assert.ok(cook.via?.length);
});

test("the mistaken path returns to the well and the exit keeps the party separated on screen", () => {
  const wrong = actor(cue(departure, 2), "aria");
  assert.ok(wrong.via.length >= 3);
  assert.ok(wrong.via[0].x > actor(cue(departure, 1), "aria").x);
  assert.ok(wrong.x < wrong.via.at(-2).x);
  const start = stageCameraCue(cue(departure, 17)),
    exit = stageCameraCue(storyStageExitCue(departure));
  for (let t = 0; t < 6000; t += 40) {
    const people = exit.actors.map((a) => ({
      ...sampleJourney(a, actor(start, a.id), t, false),
      id: a.id,
    }));
    const finn = people.find((a) => a.id === "finn"),
      mira = people.find((a) => a.id === "mira");
    if (mira.x >= -20)
      assert.ok(
        Math.hypot(mira.x - (finn.x - 16), ((mira.bottom - finn.bottom - 2) * 2) / 3) > 24,
        `Mira enters the cart silhouette at ${t}`,
      );
    for (let i = 0; i < people.length; i++)
      for (let j = i + 1; j < people.length; j++) {
        const a = people[i],
          b = people[j];
        if (a.x < -20 || b.x < -20) continue;
        assert.ok(
          Math.hypot(a.x - b.x, ((a.bottom - b.bottom) * 2) / 3) >= 9,
          `${a.id}/${b.id} at ${t}`,
        );
      }
  }
});

test("the kitchen bag hangs from the cook's visible hand through every walking frame", async () => {
  const v = moments(cue(departure, 10)).find((s) => item(s, "tool-rucksack").wrist);
  const bag = item(v, "tool-rucksack"),
    cook = v.extras.find((e) => e.id === "cook");
  const pixels = await sharp("public/story-stage/cook-poses.webp").ensureAlpha().raw().toBuffer();
  for (const elapsed of [0, 180, 360, 540]) {
    const wrist = stageExtraWrist(cook, true, elapsed),
      frame = 4 + elapsed / 180;
    const x = (frame % 4) * 128 + wrist.x,
      y = Math.floor(frame / 4) * 128 + wrist.y;
    assert.ok(pixels[(y * 512 + x) * 4 + 3] > 200, `hand must be on the actual sprite: ${frame}`);
    for (const left of [true, false]) {
      const people = new Map([["extra:cook", { x: 50, bottom: 60, left, wrist }]]);
      const at = stageItemTarget(bag, v, people),
        pixel = v.cell / 128;
      assert.ok(stageItemVisible(bag, people));
      assert.ok(Math.abs(at.x - (50 + (wrist.x - 64) * pixel * (left ? -1 : 1))) < 0.01);
      assert.ok(
        Math.abs(at.bottom + bag.width * 1.5 - (60 + (128 - wrist.y) * pixel * 1.5)) < 0.01,
      );
    }
  }
});

test("the kitchen return and the approach to the display do not pass through companions or the cart", () => {
  const steps = moments(cue(departure, 10));
  const back = steps.find((s) => actor(s, "leon").x === 12);
  const before = steps[steps.indexOf(back) - 1];
  for (const [v, origin, id] of [
    [back, before, "leon"],
    [cue(returned, 7), cue(returned, 6), "aria"],
    [cue(departure, 16), cue(departure, 15), "leon"],
  ]) {
    const duration = Math.max(...v.actors.map((a) => journeyDuration(a, actor(origin, a.id))));
    for (let time = 0; time <= duration; time += 30) {
      const at = sampleJourney(actor(v, id), actor(origin, id), time, false);
      for (const other of v.actors.filter((a) => a.id !== id)) {
        const to = sampleJourney(other, actor(origin, other.id), time, false);
        assert.ok(
          Math.hypot(at.x - to.x, ((at.bottom - to.bottom) * 2) / 3) >= 9,
          `${id}/${other.id} at ${time}`,
        );
      }
      const cart = target(v, "reception-cart");
      assert.ok(
        Math.abs(at.x - cart.x) > 17 || Math.abs(at.bottom - cart.bottom) > 15,
        `${id} enters the cart at ${time}`,
      );
    }
  }
});

test("the return uses the original display size and only hides the parcel after the cloth settles", () => {
  const v = cue(returned, 0),
    prior = cue("riverside-manor-return", 0);
  for (const name of ["display-table", "case", "tower-stone"])
    assert.equal(item(v, name).width, item(prior, name).width);
  assert.notEqual(v.extras[0].id, cue("manor-survey-return", 17).extras[0].id);
  const steps = moments(cue(returned, 18)),
    drape = steps.find((s) => item(s, "spare-cloth").carrier),
    cover = steps.find((s) => item(s, "replacement-parcel").stored);
  assert.ok(cover.after - drape.after >= 650);
  assert.equal(item(cover, "spare-cloth").art, "cart-drape");
  assert.ok(!item(drape, "replacement-parcel").stored);
  assert.ok(
    stageItemDepth(item(v, "case"), v, positions(v)) >
      stageItemDepth(item(v, "display-table"), v, positions(v)),
  );
});

test("reception props use complete alpha silhouettes and registered backgrounds", async () => {
  for (const name of ["snag-rope", "iron-fastener", "cart-drape"]) {
    const file = `public/story-stage/prop-${name}.webp`,
      meta = await sharp(file).metadata(),
      box = await spriteBounds(file);
    assert.equal(meta.width, 256);
    assert.equal(meta.height, 256);
    assert.ok(meta.hasAlpha);
    assert.ok(box.width > 80 && box.height > 80);
  }
  for (const name of ["manor-well", "manor-display-back"]) {
    const meta = await sharp(`public/story-stage/${name}.webp`).metadata();
    assert.equal(meta.width, 960);
    assert.equal(meta.height, 640);
  }
});
