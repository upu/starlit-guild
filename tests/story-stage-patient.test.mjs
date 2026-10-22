import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { storyStageCue, sampleStageActor, stageEntrance } from "../lib/story-stage.ts";

test("the child keeps the NPC head scale in every bed pose with transparent gutters", async () => {
  const atlas = "public/story-stage/child-poses.webp";
  const base = await readFrame(atlas, { left: 0, top: 0, width: 128, height: 128 });
  // Include the entire head below the source row's isolated pixels above the hair.
  const reference = await headBounds(
    await sharp(base.cell).extract(base.box).png().toBuffer(),
    0.5,
  );
  assert.ok(reference.width >= 32 && reference.width <= 38);
  for (let i = 0; i < 4; i++) {
    const frame = await readFrame(atlas, { left: i * 128, top: 128, width: 128, height: 128 });
    const head = await headBounds(
      await sharp(frame.cell).extract(frame.box).png().toBuffer(),
      0.25,
    );
    assert.ok(Math.abs(head.width - reference.width) <= 2);
    assert.ok(frame.box.height < base.box.height);
    assert.ok(frame.box.left >= 2 && frame.box.left + frame.box.width <= 126);
    assert.equal(frame.box.top + frame.box.height, 120);
  }
});

test("the patient rests in bed while Mira is seated beside it until the treatment still", () => {
  for (let line = 0; line < 4; line++) {
    const cue = storyStageCue("waiting-households-return", line);
    const child = cue.extras.find((e) => e.id === "child");
    const parent = cue.extras.find((e) => e.id === "parent");
    const mira = cue.actors.find((a) => a.id === "mira");
    assert.equal(child.bed, ["rest", "listen", "ask", "nod"][line]);
    assert.ok(child.bottom > mira.bottom && child.bottom > parent.bottom);
    const sample = sampleStageActor(mira, stageEntrance("mira", cue), 0, false);
    assert.equal(sample.onChair, true);
    assert.ok(cue.items.some((p) => p.seatFor === "mira"));
    assert.equal(cue.items.find((p) => p.art === "honey").support, "medicine");
  }
  assert.equal(storyStageCue("waiting-households-return", 4), null);
});
