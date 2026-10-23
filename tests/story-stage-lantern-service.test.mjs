import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { storyStageCue, storyStageExitCue } from "../lib/story-stage.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageWrist } from "../lib/story-stage-wrists.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageItemTarget, stageItemVisible } from "../lib/story-stage-props.ts";

test("fieldwork preserves the previous 52 hero cells and registers standing/kneeling at the same head scale", async () => {
  const hashes = {
    aria: "790cb0e7c98c5457cab791227b29e27107f244834041c4165b367bbf955df702",
    leon: "14ea55d4b17bd1e374f5571b6c0222c3ba28f443158844eff6c66184d9d3bc07",
    mira: "5ef5de1e1570abbb3dcb419ef5c18aba686c43cec300e655da2f61e1116c708e",
    finn: "7add3aa1c36e31bbdc24ff71332db2d1819dd9c0691c1595d27fa09c3fb31471",
    lico: "0f54256541ec16a494749542fdb437ca071f8bb8f62f1f39f7dc15d035800157",
  };
  for (const [id, hash] of Object.entries(hashes)) {
    const image = sharp(`public/story-stage/${id}-poses.webp`);
    const meta = await image.metadata();
    assert.equal(meta.width, 512);
    assert.equal(meta.height, 1792);
    const old = await image
      .extract({ left: 0, top: 0, width: 512, height: 1664 })
      .ensureAlpha()
      .raw()
      .toBuffer();
    assert.equal(createHash("sha256").update(old).digest("hex"), hash, id);
  }
  for (const [id, frames] of [
    ["aria", [52, 53, 54, 55]],
    ["worker", [13, 14]],
  ]) {
    const path = `public/story-stage/${id}-poses.webp`;
    const base = await readFrame(path, { left: 0, top: 0, width: 128, height: 128 });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    for (const n of frames) {
      const pose = await readFrame(path, {
        left: (n % 4) * 128,
        top: Math.floor(n / 4) * 128,
        width: 128,
        height: 128,
      });
      const actual = await headBounds(
        await sharp(pose.cell).extract(pose.box).png().toBuffer(),
        0.25,
      );
      assert.ok(Math.abs(actual.width - head.width) <= 1, `${id}/${n} head`);
      assert.equal(pose.box.height, n >= 54 ? 63 : 96);
      assert.equal(pose.box.top + pose.box.height, 120);
      assert.ok(pose.box.left >= 2 && pose.box.left + pose.box.width <= 126);
    }
  }
});

test("oil pan stays in the chamber until the door opens, and lighting waits for refilling and replacement", () => {
  const start = storyStageCue("lantern-detour-return", 0);
  const pan = (c) => c.items.find((i) => i.id === "oil-pan");
  assert.ok(pan(start).stored);
  const open = start.sequence.find((c) => c.items.some((i) => i.art === "stone-lantern-sooty"));
  assert.equal(pan(open).carrier, "stone-lantern");
  assert.ok(!pan(open).stored);
  const pickup = start.sequence.find((c) => pan(c)?.actor === "leon");
  assert.ok(pickup.after >= open.after + 650);
  const clean = storyStageCue("lantern-detour-return", 7);
  const pour = clean.sequence.find((c) => c.items.some((i) => i.id === "lamp-oil" && i.tilt));
  const replace = clean.sequence.find(
    (c) => c.after > pour.after && pan(c).carrier === "stone-lantern",
  );
  const light = clean.sequence.find((c) =>
    c.items.some((i) => i.art === "stone-lantern-closed-lit"),
  );
  assert.ok(replace.after > pour.after + 650);
  assert.ok(light.after > replace.after + 650);
  for (const c of [start, ...start.sequence, clean, ...clean.sequence])
    assert.equal(c.items.filter((i) => i.id === "oil-pan").length, 1);
});

test("cleaning cloth and oil remain visible while carried; the pouring spout is near the raised pan", () => {
  const departure = storyStageExitCue("lantern-detour-departure");
  const map = departure.items.find((i) => i.art === "map");
  const reader = departure.actors.find((a) => a.id === "leon");
  for (let t = 0; t < 600; t += 65) {
    const pose = actorPose(reader, true, t, false);
    assert.ok(
      stageItemVisible(
        map,
        new Map([["leon", { ...reader, wrist: stageWrist("leon", pose.atlas, pose.frame) }]]),
      ),
    );
  }
  for (const line of [2, 7, 21]) {
    const cue = storyStageCue("lantern-detour-return", line);
    for (const c of [cue, ...cue.sequence]) {
      for (const actor of c.actors.filter((a) => a.carry)) {
        for (let time = 0; time < 600; time += 65) {
          const pose = actorPose(actor, true, time, false);
          const wrist = stageWrist(actor.id, pose.atlas, pose.frame);
          for (const item of c.items.filter((i) => i.actor === actor.id && i.wrist))
            assert.ok(
              stageItemVisible(item, new Map([[actor.id, { ...actor, wrist }]])),
              `${line}/${actor.id}/${pose.frame}`,
            );
        }
      }
    }
  }
  const cue = storyStageCue("lantern-detour-return", 7);
  const pour = cue.sequence.find((c) => c.items.some((i) => i.id === "lamp-oil" && i.tilt));
  const leon = pour.actors.find((a) => a.id === "leon"),
    worker = pour.extras.find((e) => e.id === "worker");
  const pose = actorPose(leon, false, 0, false);
  const positions = new Map([
    ["leon", { ...leon, wrist: stageWrist("leon", pose.atlas, pose.frame) }],
    ["extra:worker", { ...worker, wrist: stageExtraWrist(worker, false, 0) }],
  ]);
  const pan = stageItemTarget(
    pour.items.find((i) => i.id === "oil-pan"),
    cue,
    positions,
  );
  const oil = stageItemTarget(
    pour.items.find((i) => i.id === "lamp-oil"),
    cue,
    positions,
  );
  assert.ok(Math.abs(pan.x - oil.x) < 2);
  assert.ok(oil.bottom > pan.bottom && oil.bottom - pan.bottom < 5);
  for (let t = 0; t < 800; t += 90) assert.ok(stageExtraWrist(worker, true, t));
});
