import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { storyStageCue, sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget, stageItemVisible } from "../lib/story-stage-props.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { actorPose } from "../lib/story-stage-pose.ts";

const opening = () => storyStageCue("berne-restoration-return", 4);
const moments = (cue) => [cue, ...cue.sequence.map((step) => ({ ...cue, ...step }))];
const oldHashes = {
  aria: "c05f212fde2c2fa97b4624fa5657feac22cb10b8fca1114930016fb985a8b2b0",
  leon: "4a144f3c23dd2fe19abe2f50e88cd906c1224beaf80fbffd67d63033f80550a7",
  mira: "7dcc9d7395d45c82ece415b630cc383a3933bc1df7e9ebd96586997896216861",
  finn: "2fb75a67e51dc6ec3c7ec1843332f76029409cc647967c4a93b3832de9780438",
  lico: "cd5bcac7cfa4d6a6d12ca8b1e603acbb7a920c5a924f34345bd02f2fe4da2076",
};

test("tea poses preserve all previous party cells, seated height, head size and clear feet", async () => {
  for (const [id, hash] of Object.entries(oldHashes)) {
    const path = `public/story-stage/${id}-poses.webp`;
    const old = await sharp(path)
      .extract({ left: 0, top: 0, width: 512, height: 1536 })
      .ensureAlpha()
      .raw()
      .toBuffer();
    assert.equal(createHash("sha256").update(old).digest("hex"), hash, id);
    if (!["aria", "leon", "mira"].includes(id)) continue;
    const base = await readFrame(path, { left: 0, top: 768, width: 128, height: 128 });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    for (let frame = 48; frame < 52; frame++) {
      const pose = await readFrame(path, {
        left: (frame % 4) * 128,
        top: 1536,
        width: 128,
        height: 128,
      });
      const actual = await headBounds(
        await sharp(pose.cell).extract(pose.box).png().toBuffer(),
        0.25,
      );
      assert.ok(Math.abs(actual.width - head.width) <= 1, `${id}/${frame}: head`);
      assert.equal(pose.box.height, 88);
      assert.equal(pose.box.top + pose.box.height, 120);
      assert.ok(pose.box.left >= 2 && pose.box.left + pose.box.width <= 126);
    }
  }
});

test("the shipping record crosses touching hands before Finn steps back", () => {
  const cue = opening(),
    values = moments(cue);
  const positions = new Map(
    cue.actors.map((a) => [a.id, sampleStageActor(a, cue, 0, false, { x: a.x, bottom: a.bottom })]),
  );
  const owner = cue.extras.find((e) => e.id === "merchant");
  positions.set("extra:merchant", { ...owner, wrist: stageExtraWrist(owner, false, 0) });
  const start = cue.items.find((i) => i.id === "shipping-record");
  const step = cue.sequence.find((s) =>
    s.items.some((i) => i.id === "shipping-record" && i.extra === "merchant"),
  );
  const end = step.items.find((i) => i.id === start.id);
  assert.ok(stageItemVisible(start, positions));
  assert.ok(stageItemVisible(end, positions));
  const a = stageItemTarget(start, cue, positions),
    b = stageItemTarget(end, { ...cue, ...step }, positions);
  assert.ok(Math.hypot(a.x - b.x, ((a.bottom - b.bottom) * 2) / 3) < 2, "hands meet");
  const retreat = cue.sequence.find(
    (s) => s.actors.find((a) => a.id === "finn").x !== cue.actors.find((a) => a.id === "finn").x,
  );
  assert.ok(retreat.after >= step.after + 650, "transfer ends before retreat");
  for (const v of values) {
    assert.equal(v.items.filter((i) => i.id === "shipping-record").length, 1);
    assert.ok(v.actors.find((a) => a.id === "finn").dressed);
  }
});

test("three guests sip without changing seats or duplicating chairs and cups", () => {
  const cue = opening(),
    values = moments(cue);
  for (const id of ["aria", "leon", "mira"]) {
    const seat = cue.actors.find((a) => a.id === id);
    assert.ok(values.some((v) => v.actors.find((a) => a.id === id).tea === "sip"));
    for (const v of values) {
      const actor = v.actors.find((a) => a.id === id),
        pose = actorPose(actor, false, 3000, false);
      assert.deepEqual([actor.x, actor.bottom], [seat.x, seat.bottom]);
      assert.ok(pose.onChair);
      assert.ok(pose.frame >= 48 && pose.frame < 52);
      const chair = v.items.find((i) => i.seatFor === id);
      assert.ok(chair);
      assert.equal(
        stageItemVisible(chair, new Map([[id, { ...actor, onChair: pose.onChair }]])),
        false,
      );
      assert.ok(!v.items.some((i) => i.actor === id && i.art.includes("cup")), "cup is in pose");
    }
  }
});
