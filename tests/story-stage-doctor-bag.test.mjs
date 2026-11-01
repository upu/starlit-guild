import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { storyStageCue } from "../lib/story-stage.ts";
import { stageExtraFrame, stageExtraRows } from "../lib/story-stage-figure.ts";

test("doctor's bag poses preserve earlier frames, head width and foot baseline", async () => {
  const path = "public/story-stage/doctor-poses.webp";
  assert.equal((await sharp(path).metadata()).height, 384);
  const raw = await sharp(path)
    .extract({ left: 0, top: 0, width: 512, height: 256 })
    .ensureAlpha()
    .raw()
    .toBuffer();
  for (let i = 0; i < raw.length; i += 4) if (!raw[i + 3]) raw.fill(0, i, i + 3);
  assert.equal(
    createHash("sha256").update(raw).digest("hex"),
    "89701a729c006c6598e5d46f85f62863b0ddc26cd28f6cff76ca83fb7fec198a",
  );
  const base = await readFrame(path, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
  for (let i = 0; i < 4; i++) {
    const pose = await readFrame(path, { left: i * 128, top: 256, width: 128, height: 128 });
    const h = await headBounds(await sharp(pose.cell).extract(pose.box).png().toBuffer(), 0.25);
    assert.ok(Math.abs(h.width - head.width) <= 2);
    assert.equal(pose.box.height, 96);
    assert.equal(pose.box.top + pose.box.height, 120);
  }
});

test("the doctor nods, grasps and lifts her single bag while Mira looks across", () => {
  const cue = storyStageCue("moss-transplant-return", 22);
  assert.equal(cue.finishBeforeAdvance, true);
  assert.equal(cue.actors.find((a) => a.id === "mira").left, true);
  assert.equal(cue.actors.find((a) => a.id === "mira").mossCare, "hold");
  [cue, ...cue.sequence].forEach((s, i) => {
    const doctor = s.extras.find((e) => e.id === "doctor");
    assert.equal(stageExtraFrame(doctor), 8 + i);
    assert.equal(stageExtraRows(doctor), 3);
    assert.ok(!s.items.some((p) => p.extra === "doctor"));
  });
  const next = storyStageCue("moss-transplant-return", 23);
  assert.equal(next.actors.find((a) => a.id === "mira").mossCare, "hold");
  assert.equal(stageExtraFrame(next.extras.find((e) => e.id === "doctor")), 11);
});
