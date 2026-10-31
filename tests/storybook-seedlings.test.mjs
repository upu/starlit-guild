import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { extraTravelDuration, sampleExtraTravel } from "../lib/story-stage-extra-travel.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { storyArtAt } from "../lib/story-art.ts";
const id = "merrill-seedlings-return";

test("Merrill leaves with the pot during the final narration and stays outside on close", () => {
  const previous = studyCue(id, 39, true).extras.find((extra) => extra.id === "merrill");
  const last = studyCue(id, 40, true);
  const leaving = last.extras.find((extra) => extra.id === "merrill");
  const end = sampleExtraTravel(leaving, previous, extraTravelDuration(leaving, previous), false);
  assert.ok(last.finishBeforeAdvance, "an early close waits for the departure");
  assert.ok(end.bottom < -50, "the visitor leaves the stage while the narration is shown");
  assert.equal(end.moving, false);
  assert.equal(last.items.find((item) => item.id === "merrill-pot").extra, "merrill");
  const closing = storybookExitCue(id).extras.find((extra) => extra.id === "merrill");
  assert.deepEqual([closing.x, closing.bottom], [leaving.x, leaving.bottom]);
  assert.ok(sampleExtraTravel(closing, end, 500, false).bottom < -50);
});
test("both loading-yard conversations retain the same cast and basket scale", () => {
  const before = studyCue(id, 0, true);
  const after = studyCue("moss-transplant-departure", 0, true);
  assert.equal(before.cell, 19);
  assert.equal(after.cell, before.cell);
  for (const name of ["covered-seedlings", "open-seedlings", "loading-reflector"]) {
    const first = before.items.find((item) => item.id === name);
    const second = after.items.find((item) => item.id === name);
    assert.deepEqual([second.x, second.bottom, second.width], [first.x, first.bottom, first.width]);
  }
});
test("the existing seedling illustration takes over at line14 and remains through departure", () => {
  assert.equal(storyArtAt("merrill-seedlings-departure", 13), undefined);
  for (const line of [14, 22, 29, 34]) {
    assert.equal(
      storyArtAt("merrill-seedlings-departure", line)?.src,
      "/stories/lico-protects-seedlings.webp",
    );
    assert.equal(studyCue("merrill-seedlings-departure", line, true), null);
  }
});
test("the visible paper actions retain body scale and store the received slip after the handoff", async () => {
  const m = JSON.parse(
    await readFile("public/storybook-study/lico-seedling-paper-v1-metrics.json", "utf8"),
  );
  assert.equal(new Set(m.map((f) => f.scale)).size, 1);
  assert.ok(m.every((f) => Math.abs(f.height - 128) <= 1 && f.baseline === 176));
  const cue = studyCue(id, 29, true),
    actions = cue.sequence.filter((s) => s.after === 1200 || s.after === 1800);
  assert.deepEqual(
    actions.map(
      (s) =>
        actorPose(
          s.actors.find((a) => a.id === "lico"),
          false,
          0,
          true,
        ).frame,
    ),
    [82, 83],
  );
  const stow = cue.sequence.find((s) => s.after === 3700),
    final = cue.sequence.at(-1);
  assert.equal(stageExtraFrame(stow.extras.find((e) => e.id === "merrill")), 9);
  assert.deepEqual(stow.items.find((i) => i.id === "route-slip").embeddedFrames, [9]);
  assert.ok(!final.items.some((i) => i.id === "route-slip"));
});
test("Merrill keeps one standing body scale and a lower squat with complete cell margins", async () => {
  const { frames } = JSON.parse(
    await readFile("public/storybook-study/merrill-seedlings-v1-metrics.json", "utf8"),
  );
  assert.equal(frames.length, 16);
  assert.equal(new Set(frames.slice(0, 12).map((f) => f.scale)).size, 1);
  assert.equal(new Set(frames.slice(12).map((f) => f.scale)).size, 1);
  assert.equal(frames[0].height, 84);
  assert.ok(frames[10].height < frames[0].height * 0.8);
  assert.ok(frames.slice(12).every((f) => Math.abs(f.height - frames[0].height) <= 3));
  assert.ok(
    frames.slice(12).every((f) => Math.abs(f.headCenter - frames[0].headCenter) < 1),
    "the torso must not jump sideways between gait phases",
  );
  const { data, info } = await sharp("public/storybook-study/merrill-seedlings-v1.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (x % 128 === 0 || x % 128 === 127 || y % 128 === 0 || y % 128 === 127)
        assert.ok(data[(y * info.width + x) * 4 + 3] <= 16, "no opaque cell edge");
});
test("the comparison seedling enters the recipient's real registered palm at constant size", () => {
  const cue = studyCue(id, 16, true),
    before = cue.items.find((i) => i.id === "comparison-sprig"),
    after = cue.sequence.find((s) => s.after === 1500).items.find((i) => i.id === before.id),
    l = cue.actors.find((a) => a.id === "lico"),
    m = cue.extras.find((e) => e.id === "merrill");
  const target = (item, owner, frame, key) =>
    stageItemTarget(
      item,
      cue,
      new Map([
        [
          key,
          { ...owner, wrist: { x: owner.wristPoints[frame][0], y: owner.wristPoints[frame][1] } },
        ],
      ]),
    );
  const a = target(before, l, 73, "lico"),
    b = target(after, m, 8, "extra:merrill");
  assert.ok(Math.abs(a.x - b.x) < 0.001);
  assert.ok(Math.abs(a.bottom - b.bottom) < 0.001);
  assert.equal(before.width, after.width);
});
test("the route slip changes hands at the same registered contact", () => {
  const cue = studyCue(id, 29, true);
  const before = cue.sequence.find((step) => step.after === 2400);
  const after = cue.sequence.find((step) => step.after === 3100);
  const lico = before.actors.find((actor) => actor.id === "lico");
  const merrill = after.extras.find((extra) => extra.id === "merrill");
  const from = before.items.find((item) => item.id === "route-slip");
  const to = after.items.find((item) => item.id === "route-slip");
  const point = (item, owner, key, frame) =>
    stageItemTarget(
      item,
      cue,
      new Map([
        [
          key,
          {
            ...owner,
            wrist: { x: owner.wristPoints[frame][0], y: owner.wristPoints[frame][1] },
          },
        ],
      ]),
    );
  const a = point(from, lico, "lico", 73),
    b = point(to, merrill, "extra:merrill", 8);
  assert.ok(Math.abs(a.x - b.x) < 0.001);
  assert.ok(Math.abs(a.bottom - b.bottom) < 0.001);
  assert.equal(from.width, to.width);
});
test("registered gait also survives the pot-carrying exit without changing legacy NPCs", () => {
  const cue = storybookExitCue(id),
    m = cue.extras.find((e) => e.id === "merrill");
  assert.deepEqual(
    [0, 180, 360, 540].map((t) => stageExtraFrame(m, true, t)),
    [12, 13, 14, 15],
  );
  assert.equal(stageExtraFrame(m, false, 0), 11);
  assert.equal(stageExtraFrame({ id: "merrill", x: 50, pose: "wave" }, true, 0), 3);
  assert.equal(storybookPresentation(id, "moss-beds").art, "tower-loading-yard-v1");
});
test("each mushroom pickup meets the low hand before entering the same-sized pot", () => {
  const cue = studyCue(id, 34, true);
  for (let index = 0; index < 4; index++) {
    const start = 2000 + index * 2600;
    const approach = cue.sequence
      .find((s) => s.after === start)
      .extras.find((e) => e.id === "merrill");
    const prior = cue.sequence
      .find((s) => s.after === (index ? start - 700 : 800))
      .extras.find((e) => e.id === "merrill");
    const held = cue.sequence.find((s) => s.after === start + 900),
      m = held.extras.find((e) => e.id === "merrill"),
      item = held.items.find((i) => i.id === `korotake-${index}`);
    const target = stageItemTarget(
      item,
      cue,
      new Map([["extra:merrill", { ...m, wrist: { x: 79, y: 113 } }]]),
    );
    assert.ok(Math.abs(target.x - (73.5 + index * 4.8)) < 0.001);
    assert.ok(Math.abs(target.bottom - 6) < 0.001);
    assert.ok(extraTravelDuration(approach, prior) <= 900, "Merrill arrives before picking it up");
    const toPot = cue.sequence.find((s) => s.after === start + 1200);
    const carrier = toPot.extras.find((e) => e.id === "merrill");
    const itemInHand = toPot.items.find((i) => i.id === item.id);
    const deposited = cue.sequence.find((s) => s.after === start + 1900);
    const itemInPot = deposited.items.find((i) => i.id === item.id);
    const pot = deposited.items.find((i) => i.id === "merrill-pot");
    const handAtPot = stageItemTarget(
      itemInHand,
      cue,
      new Map([["extra:merrill", { ...carrier, wrist: { x: 79, y: 113 } }]]),
    );
    const potTarget = stageItemTarget(itemInPot, cue, new Map([["item:merrill-pot", pot]]));
    assert.equal(itemInHand.extra, "merrill", "the hand carries it during the return");
    assert.ok(
      extraTravelDuration(carrier, m) <= 700,
      "Merrill reaches the pot before releasing it",
    );
    assert.ok(Math.abs(handAtPot.x - potTarget.x) < 0.001, "release is aligned with the pot");
  }
  assert.ok(
    cue.sequence
      .flatMap((s) => s.items)
      .filter((i) => i.id === "merrill-pot")
      .every((i) => i.width === 9.4 * (19 / 24)),
  );
  assert.equal(
    cue.sequence.at(-1).items.find((i) => i.id === "merrill-pot").art,
    "merrill-pot-full",
  );
});
test("collected mushrooms stay in the pot while the others are picked up", () => {
  const cue = studyCue(id, 34, true);
  const ids = Array.from({ length: 4 }, (_, index) => `korotake-${index}`);
  for (const step of cue.sequence.filter((value) => value.after >= 800 && value.after < 12400)) {
    const mushrooms = step.items.filter((item) => ids.includes(item.id));
    assert.deepEqual(mushrooms.map((item) => item.id).sort(), ids, `${step.after}: none disappear`);
    const deposited = Math.min(4, Math.max(0, Math.floor((step.after - 3900) / 2600) + 1));
    for (let index = 0; index < deposited; index++) {
      const item = mushrooms.find((value) => value.id === ids[index]);
      assert.equal(item.carrier, "merrill-pot", `${step.after}: ${item.id} remains in the pot`);
      const pot = step.items.find((value) => value.id === "merrill-pot");
      assert.ok(Math.abs(item.x) + (item.width * 220) / 512 < pot.width / 2);
    }
  }
  assert.equal(
    cue.sequence.at(-1).items.find((item) => item.id === "merrill-pot").art,
    "merrill-pot-full",
  );
});
test("Merrill picks up the full pot at its ground position before carrying it away", () => {
  const cue = studyCue(id, 34, true);
  const floor = cue.sequence.find((step) => step.after === 12400);
  const pickup = cue.sequence.find((step) => step.after === 13200);
  const standing = cue.sequence.find((step) => step.after === 14000);
  const destination = cue.sequence.at(-1);
  const visitor = pickup.extras.find((extra) => extra.id === "merrill");
  const pot = floor.items.find((item) => item.id === "merrill-pot");
  const held = pickup.items.find((item) => item.id === "merrill-pot");
  const target = stageItemTarget(
    held,
    cue,
    new Map([["extra:merrill", { ...visitor, wrist: { x: 79, y: 113 } }]]),
  );
  assert.ok(Math.abs(target.x - pot.x) < 0.001);
  assert.ok(Math.abs(target.bottom - pot.bottom) < 0.001);
  assert.equal(held.width, pot.width);
  assert.equal(floor.items.filter((item) => item.carrier === "merrill-pot").length, 4);
  const previous = cue.sequence.find((step) => step.after === 11700);
  assert.ok(extraTravelDuration(floor.extras[0], previous.extras[0]) <= 800);
  assert.equal(standing.extras[0].seedlingAction, "pot");
  assert.ok(extraTravelDuration(destination.extras[0], standing.extras[0]) <= 1000);
});
test("the four fallen mushrooms remain distinct and proportionate to Merrill", async () => {
  const cue = studyCue(id, 0, true);
  const mushrooms = cue.items.filter((item) => item.id.startsWith("korotake-"));
  const { info } = await sharp("public/storybook-study/korotake-rest-v1.webp")
    .trim({ threshold: 30 })
    .toBuffer({ resolveWithObject: true });
  const visibleWidth = (mushrooms[0].width * info.width) / 256;
  assert.equal(mushrooms.length, 4);
  for (let i = 1; i < mushrooms.length; i++)
    assert.ok(mushrooms[i].x - mushrooms[i - 1].x >= visibleWidth, "fallen figures do not overlap");
  const metrics = JSON.parse(
    await readFile("public/storybook-study/merrill-seedlings-v1-metrics.json", "utf8"),
  );
  const figureHeight = (cue.cell * metrics.frames[0].height) / 128;
  const ratio = visibleWidth / figureHeight;
  assert.ok(ratio > 0.28 && ratio < 0.33, `mushroom width / Merrill height: ${ratio}`);
  const collection = studyCue(id, 34, true).sequence.find((step) => step.after === 800);
  const pot = collection.items.find((item) => item.id === "merrill-pot");
  const top = pot.bottom + pot.width * 1.5 * (1 - 73 / 256);
  assert.ok(top < mushrooms[0].bottom, "the pot does not hide the fallen figures");
});
test("the wet cloth becomes a draped basket state rather than floating as a separate sheet", () => {
  const cue = studyCue("merrill-seedlings-departure", 0, true),
    covered = cue.sequence.find((s) => s.after === 900);
  assert.equal(cue.items.find((i) => i.id === "covered-seedlings").art, "basket");
  assert.equal(covered.items.find((i) => i.id === "covered-seedlings").art, "seedlings");
  assert.equal(covered.items.find((i) => i.id === "damp-cloth").stored, true);
});
