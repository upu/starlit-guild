import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { storyStageCue as cue } from "../lib/story-stage.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";

const story = "matching-lantern-stone-departure";
const moments = (value) => [value, ...(value.sequence ?? []).map((s) => ({ ...value, ...s }))];
const actor = (value, id) => value.actors.find((a) => a.id === id);
const item = (value, id) => value.items.find((p) => p.id === id);
const carrier = (value) => value.extras.find((e) => e.id === "stone-carrier");

test("the carrier sets down his stone before Mira treats the extended hand and slowly rises", () => {
  const arriving = moments(cue(story, 13));
  assert.equal(item(arriving[0], "wrapping-cloth").actor, undefined);
  assert.equal(item(arriving[1], "carrier-stone").extra, undefined);
  assert.equal(carrier(arriving[1]).care, "sore");
  const treating = cue(story, 14),
    mira = actor(treating, "mira");
  assert.equal(carrier(treating).care, "palm");
  assert.deepEqual(
    [0, 420, 840].map((t) => actorPose(mira, false, t, false).frame),
    [44, 45, 44],
  );
  assert.equal(actorPose(mira, false, 420, true).frame, 44);
  const rising = moments(cue(story, 15));
  assert.equal(carrier(rising[1]).care, "bandaged");
  assert.equal(actorPose(actor(rising[2], "mira"), false, 0, false).frame, 46);
  assert.equal(actorPose(actor(rising[3], "mira"), false, 0, false).frame, 47);
  assert.equal(actor(rising[4], "mira").healing, undefined);
  assert.equal(carrier(cue(story, 17)).care, "rest");
  for (let line = 0; line < 18; line++) {
    for (const value of moments(cue(story, line))) {
      for (const id of ["blue-stone", "violet-stone", "dull-stone", "carrier-stone"])
        assert.equal(
          item(value, id).width,
          item(cue("riverside-manor-return", 1), "tower-stone").width,
        );
    }
  }
});

test("Finn reaches the chair before taking it, retains its contact position and sets it beside Mira", () => {
  const value = stageCameraCue(cue(story, 15));
  const steps = moments(value);
  const approach = steps[4],
    pickup = steps[5],
    walk = steps[6],
    putDown = steps[7];
  assert.ok(actor(approach, "finn").x <= 100, "the chair is inside the visible ground");
  assert.ok(
    pickup.after - approach.after >
      journeyDuration(actor(approach, "finn"), actor(steps[0], "finn")),
  );
  const target = (state, owner) =>
    stageItemTarget(item(state, "mira-chair"), state, new Map([["finn", owner]]));
  assert.deepEqual(
    target(pickup, actor(approach, "finn")),
    target(approach, actor(approach, "finn")),
  );
  assert.ok(
    putDown.after - walk.after > journeyDuration(actor(walk, "finn"), actor(pickup, "finn")),
  );
  assert.deepEqual(target(walk, actor(walk, "finn")), target(putDown, actor(walk, "finn")));
  assert.equal(item(putDown, "mira-chair").actor, undefined);
  assert.equal(item(cue(story, 17), "mira-chair").x, item(putDown, "mira-chair").x);
});

test("care and carrying frames retain head scale, lower kneeling height and padded feet", async () => {
  const atlas = "public/story-stage/mira-poses.webp";
  const bytes = await sharp(atlas)
    .extract({ left: 0, top: 0, width: 512, height: 1408 })
    .ensureAlpha()
    .raw()
    .toBuffer();
  for (let i = 0; i < bytes.length; i += 4) if (!bytes[i + 3]) bytes.fill(0, i, i + 3);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    "771cb1e4254b7adde4588846938de5aed3f73baa66f0f61bf386f1920621ed0f",
  );
  for (const [id, indices, reference] of [
    ["mira", [44, 45, 46, 47], "mira"],
    ["stone-carrier", [0, 1, 2, 3, 4, 5, 6, 7], "worker"],
  ]) {
    const ref = await readFrame(`public/story-stage/${reference}-poses.webp`, {
      left: 0,
      top: 0,
      width: 128,
      height: 128,
    });
    const head = await headBounds(await sharp(ref.cell).extract(ref.box).png().toBuffer(), 0.25);
    for (const index of indices) {
      const frame = await readFrame(`public/story-stage/${id}-poses.webp`, {
        left: (index % 4) * 128,
        top: Math.floor(index / 4) * 128,
        width: 128,
        height: 128,
      });
      const current = await headBounds(
        await sharp(frame.cell).extract(frame.box).png().toBuffer(),
        0.25,
      );
      assert.ok(Math.abs(current.width - head.width) <= 3, `${id}/${index} head size`);
      assert.equal(frame.box.top + frame.box.height, 120, `${id}/${index} feet`);
      assert.ok(
        frame.box.left >= 2 && frame.box.left + frame.box.width <= 126 && frame.box.top >= 2,
        `${id}/${index} padding`,
      );
      if (id === "mira" && index < 46)
        assert.ok(
          frame.box.height <= ref.box.height * 0.84,
          "kneeling must be shorter than standing",
        );
    }
  }
  assert.deepEqual(
    [0, 180, 360, 540].map((t) => stageExtraFrame({ id: "stone-carrier" }, true, t)),
    [0, 1, 2, 3],
  );
});
