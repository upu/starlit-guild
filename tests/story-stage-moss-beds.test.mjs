import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageItemVisible } from "../lib/story-stage-props.ts";
import { storyStageCue, storyStageExitCue, sampleStageActor } from "../lib/story-stage.ts";

const oldHashes = {
  aria: "e10daa1fe40d8fc4df6d60596e16f2be1318ecbae4fae9f3ede3ecd82b6a90b6",
  leon: "f0c960ff7518483e8914c724ae2fa5d56990b2646a6b4ef1c308c29e64aff0a1",
  mira: "6db477259d4c5b6a199fe4a15dacf1292fb03b4494b79cf7dbedbfc135129023",
  finn: "bc7426522a3b71ed72a457200380ef27e2c790d09e2f9ee0611f73fc01ec7f58",
  lico: "93c20c6af05f505a96fcada06d6478df99a63c5f26580ceced67e16265ba88c6",
};
test("moss study poses retain old pixels, head width, soles and transparent gutters", async () => {
  for (const [id, hash] of Object.entries(oldHashes)) {
    const file = `public/story-stage/${id}-poses.webp`;
    const old = await sharp(file)
      .extract({ left: 0, top: 0, width: 512, height: 2176 })
      .ensureAlpha()
      .raw()
      .toBuffer();
    assert.equal(createHash("sha256").update(old).digest("hex"), hash, id);
    if (!["lico", "mira"].includes(id)) continue;
    const base = await readFrame(file, { left: 0, top: 0, width: 128, height: 128 });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    for (let i = 68; i < (id === "lico" ? 76 : 72); i++) {
      const f = await readFrame(file, {
        left: (i % 4) * 128,
        top: Math.floor(i / 4) * 128,
        width: 128,
        height: 128,
      });
      const h = await headBounds(await sharp(f.cell).extract(f.box).png().toBuffer(), 0.25);
      assert.ok(Math.abs(h.width - head.width) <= 2, `${id}/${i} head`);
      assert.equal(f.box.top + f.box.height, 120);
      assert.ok(f.box.left >= 2 && f.box.left + f.box.width <= 126);
      if (i === 75) assert.ok(f.box.height < 80);
      else assert.equal(f.box.height, 96);
    }
  }
});

test("embedded notebook and bag replace loose props only in their actual stationary frames", () => {
  const c = storyStageCue("brekka-moss-beds-return", 7);
  for (const id of ["lico", "mira"]) {
    const a = c.actors.find((a) => a.id === id),
      item = c.items.find((p) => p.actor === id);
    const stopped = sampleStageActor(a, a, 1000),
      walking = sampleStageActor(a, { x: a.x - 20, bottom: a.bottom }, 50);
    assert.equal(stageItemVisible(item, new Map([[id, stopped]])), false);
    assert.equal(walking.atlas, "home");
    assert.equal(stageItemVisible(item, new Map([[id, walking]])), true);
  }
  const writer = c.actors.find((a) => a.id === "lico");
  assert.notEqual(
    actorPose(writer, false, 0, false).frame,
    actorPose(writer, false, 500, false).frame,
  );
  assert.equal(actorPose(writer, false, 0, true).frame, actorPose(writer, false, 500, true).frame);
});

test("Lico arrives beyond the low fence, and Leon leaves only after the final line", () => {
  const id = "brekka-moss-beds-return";
  assert.equal(storyStageCue(id, 1).actors.find((a) => a.id === "lico").visible, false);
  const arrival = storyStageCue(id, 2),
    lico = arrival.actors.find((a) => a.id === "lico");
  const rail = arrival.items.find((p) => p.id === "bed-rail-right");
  assert.ok(lico.visible && lico.bottom > rail.bottom);
  assert.equal(storyStageCue(id, 4).items.find((p) => p.art === "plant-label").shaded, true);
  assert.equal(storyStageCue(id, 5).items.find((p) => p.art === "plant-label").shaded, false);
  assert.ok(storyStageCue(id, 52).actors.find((a) => a.id === "leon").bottom >= 0);
  assert.ok(storyStageExitCue(id).actors.find((a) => a.id === "leon").bottom < 0);
});
