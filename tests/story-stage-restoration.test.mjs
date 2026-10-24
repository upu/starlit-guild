import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { storyStageCue as cue } from "../lib/story-stage.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
import { stageExtraAtlas, stageExtraFrame } from "../lib/story-stage-figure.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageWrist } from "../lib/story-stage-wrists.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";
import { extraTravelDuration, sampleExtraTravel } from "../lib/story-stage-extra-travel.ts";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";

const story = "berne-restoration-departure";
const moments = (v) => [v, ...(v.sequence ?? []).map((s) => ({ ...v, ...s }))];
const actor = (v, id) => v.actors.find((a) => a.id === id);
const extra = (v, id) => v.extras.find((a) => a.id === id);
const item = (v, id) => v.items.find((a) => a.id === id);
const distance = (a, b) => Math.hypot(a.x - b.x, ((a.bottom - b.bottom) * 2) / 3);

test("restoration returns to the established socket with the same small unlit stone", () => {
  assert.equal(cue(story, 0).background, cue("missing-keystone-return", 0).background);
  for (let line = 0; line < 17; line++)
    for (const v of moments(cue(story, line))) {
      assert.equal(v.cell, 21);
      const stone = item(v, "recovered-stone");
      assert.equal(stone.width, 6.2);
      assert.equal(stone.glow, undefined);
      assert.equal(stone.art, "tower-stone-bottom");
      assert.equal(actor(v, "finn").dressed, true);
      assert.equal(item(v, "passing-cart").width, 26);
      assert.equal(item(v, "carried-fence").width, 10);
      assert.equal(stageExtraAtlas(extra(v, "fence-carrier")), "stone-carrier");
    }
});

test("the keeper's crouched finger reaches the grooves without stretching his body", () => {
  const v = cue(story, 5),
    k = extra(v, "keeper"),
    stone = item(v, "recovered-stone");
  assert.equal(stageExtraFrame(k), 13);
  // Fingertip in the registered cell: x=35, y=115. Stone ink spans the lower part of its cell.
  const finger = {
    x: k.x + ((35 - 64) * v.cell) / 128,
    bottom: k.bottom + ((128 - 115) * v.cell * 1.5) / 128,
  };
  assert.ok(Math.abs(finger.x - stone.x) < stone.width / 2);
  assert.ok(finger.bottom >= stone.bottom && finger.bottom <= stone.bottom + 5);
});

test("the document changes hands after arrival and Leon clears the keeper's route to the desk", () => {
  const transfer = moments(cue(story, 7));
  assert.ok(
    transfer[1].after > journeyDuration(actor(transfer[0], "leon"), actor(cue(story, 6), "leon")),
  );
  assert.equal(item(transfer[1], "replacement-record").actor, "leon");
  assert.equal(item(transfer[2], "replacement-record").extra, "keeper");
  const moving = moments(cue(story, 8));
  assert.ok(
    moving[1].after > journeyDuration(actor(moving[0], "leon"), actor(cue(story, 7), "leon")),
  );
  assert.ok(
    moving[2].after - moving[1].after >=
      extraTravelDuration(extra(moving[1], "keeper"), extra(moving[0], "keeper")),
  );
  for (let t = 0; t <= 2600; t += 30) {
    const l = sampleJourney(actor(moving[0], "leon"), actor(cue(story, 7), "leon"), t, false);
    const k =
      t < 1300
        ? extra(moving[0], "keeper")
        : sampleExtraTravel(
            extra(moving[1], "keeper"),
            extra(moving[0], "keeper"),
            t - 1300,
            false,
          );
    assert.ok(distance(l, k) >= 7, `keeper/Leon at ${t}`);
  }
  const copy = item(moving[2], "replacement-record"),
    record = item(moving[2], "removal-record");
  assert.equal(copy.support, record.support);
  assert.ok(distance(copy, record) < 1);
  for (const frameTime of [0, 180, 360, 540])
    assert.ok(stageExtraWrist(extra(moving[1], "keeper"), true, frameTime));
});

test("the mason and Aria reach their work before kneeling, and roots leave the socket", () => {
  const clean = moments(cue(story, 10));
  assert.ok(
    clean[1].after >=
      extraTravelDuration(extra(clean[0], "worker"), extra(cue(story, 9), "worker")),
  );
  const roots = moments(cue(story, 11));
  assert.ok(
    roots[1].after >= journeyDuration(actor(roots[0], "aria"), actor(cue(story, 10), "aria")),
  );
  const a = actor(roots[1], "aria"),
    r = item(roots[1], "joint-roots");
  const wrist = stageWrist("aria", "conversation", 13);
  assert.ok(Math.abs(a.x + ((wrist.x - 64) * roots[0].cell) / 128 - r.x) < 2);
  assert.ok(distance(item(roots[2], "joint-roots"), r) > 7);
  assert.equal(item(clean.at(-1), "cleaning-cloth"), undefined);
});

test("the cart reaches Finn's signal before turning and its handles stay in the pusher's hands", () => {
  const v = moments(stageCameraCue(cue(story, 15))),
    approach = v[1],
    end = v[2];
  assert.ok(
    end.after - approach.after >
      extraTravelDuration(extra(approach, "stone-carrier"), extra(v[0], "stone-carrier")) + 600,
  );
  const worker = extra(approach, "stone-carrier"),
    cart = item(approach, "passing-cart");
  const at = stageItemTarget(cart, approach, new Map([["extra:stone-carrier", worker]]));
  const hand = {
    x: worker.x + ((43 - 64) * 21) / 128,
    bottom: worker.bottom + ((128 - 80) * 21 * 1.5) / 128,
  };
  const handle = {
    x: at.x + (340 / 384 - 0.5) * 26,
    bottom: at.bottom + 2 + ((256 - 163) / 256) * 26,
  };
  assert.ok(distance(hand, handle) < 1);
  assert.ok(actor(approach, "finn").x < at.x - 13);
  assert.ok(extra(end, "stone-carrier").bottom < -60);
  assert.ok(stageWrist("finn", "conversation", 1));
  for (let frame = 0; frame < 8; frame++) {
    const wrist = stageWrist("finn", "home", frame);
    if (wrist) assert.ok(wrist.x > 30 && wrist.x < 100 && wrist.y > 60 && wrist.y < 100);
  }
});

test("the caretaker keeps all original pixels and consistent heads and feet in eight new poses", async () => {
  const path = "public/story-stage/keeper-poses.webp";
  const old = await sharp(path)
    .extract({ left: 0, top: 0, width: 512, height: 256 })
    .ensureAlpha()
    .raw()
    .toBuffer();
  for (let i = 0; i < old.length; i += 4) if (!old[i + 3]) old.fill(0, i, i + 3);
  assert.equal(
    createHash("sha256").update(old).digest("hex"),
    "4b40b6274097d10ae066e48c5945c06f971551b981d7d0a207f4c6fd782f964d",
  );
  for (let i = 8; i < 16; i++) {
    const f = await readFrame(path, {
      left: (i % 4) * 128,
      top: Math.floor(i / 4) * 128,
      width: 128,
      height: 128,
    });
    const head = await headBounds(await sharp(f.cell).extract(f.box).png().toBuffer(), 0.25);
    assert.ok(Math.abs(head.width - 47) <= 1);
    assert.equal(f.box.top + f.box.height, 120);
    assert.equal(f.box.height, i === 12 || i === 13 ? 72 : 96);
    assert.ok(f.box.left > 1 && f.box.left + f.box.width < 127);
  }
});
