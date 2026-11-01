import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { storyStageCue as cue } from "../lib/story-stage.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageWrist } from "../lib/story-stage-wrists.ts";
import { stageActorDepth, stageItemTarget, stageItemDepth } from "../lib/story-stage-props.ts";
import { orderStageItems } from "../lib/story-stage-cargo.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";

const story = "keystone-night-road-return";
const moments = (v) => [v, ...(v.sequence ?? []).map((s) => ({ ...v, ...s }))];
const actor = (v, id) => v.actors.find((a) => a.id === id);
const item = (v, id) => v.items.find((p) => p.id === id);
function positions(v) {
  const result = new Map(
    v.actors.map((a) => {
      const pose = actorPose(a, false, 0, false);
      return [a.id, { ...a, wrist: stageWrist(a.id, pose.atlas, pose.frame) }];
    }),
  );
  for (const p of orderStageItems(v.items))
    result.set(`item:${p.id}`, {
      ...stageItemTarget(p, v, result),
      depth: stageItemDepth(p, v, result),
      mirrored: !!p.left,
    });
  return result;
}

test("the bridge keeps the cart and recovered parcel at their established scale, with an empty pot", () => {
  const previous = cue("garden-reception-return", 18);
  for (let line = 0; line < 13; line++)
    for (const v of moments(cue(story, line))) {
      assert.equal(item(v, "reception-cart").width, item(previous, "reception-cart").width);
      assert.equal(item(v, "recovered-parcel").width, item(previous, "replacement-parcel").width);
      assert.equal(item(v, "front-pot").width, item(previous, "cart-pot-0").width);
      assert.equal(item(v, "front-pot").art, "empty-garden-pot");
      for (const id of ["recovered-parcel", "front-pot"]) {
        const p = positions(v),
          cargo = p.get(`item:${id}`),
          cart = p.get("item:reception-cart");
        assert.ok(Math.abs(cargo.x - cart.x) < 13);
        assert.ok(cargo.bottom > cart.bottom + 8 && cargo.bottom < cart.bottom + 20);
        assert.ok(cargo.depth > cart.depth);
      }
    }
});

test("Leon arrives late and the reunion routes clear the cart and the waiting companions", () => {
  const first = stageCameraCue(cue(story, 0)),
    arrived = moments(first).at(-1);
  assert.ok(actor(first, "leon").x < -20);
  assert.ok(arrived.after >= 500);
  assert.ok(actor(arrived, "leon").x > 0);
  const greeting = cue(story, 1),
    before = cue(story, 0).sequence.at(-1);
  const duration = Math.max(...greeting.actors.map((a) => journeyDuration(a, actor(before, a.id))));
  for (let time = 0; time <= duration; time += 30) {
    const people = greeting.actors.map((a) => ({
      ...sampleJourney(a, actor(before, a.id), time, false),
      id: a.id,
    }));
    for (const a of people) {
      for (const b of people.filter((b) => b.id !== a.id))
        assert.ok(
          Math.hypot(a.x - b.x, ((a.bottom - b.bottom) * 2) / 3) >= 8,
          `${a.id}/${b.id} at ${time}`,
        );
      if (["aria", "leon"].includes(a.id))
        assert.ok(
          a.x < 29 || a.x > 55 || a.bottom < 20 || a.bottom > 58,
          `${a.id} crosses cart at ${time}`,
        );
    }
  }
});

test("Mira reaches the bandaged palm before Finn pats the parcel once with his free hand", async () => {
  const v = cue(story, 6),
    steps = moments(v),
    ready = steps[1],
    touch = steps[2],
    release = steps[3];
  assert.ok(ready.after >= journeyDuration(actor(v, "mira"), actor(cue(story, 5), "mira")));
  assert.deepEqual(
    steps.slice(1).map((s) => actor(s, "finn").handAction),
    ["pat-ready", "pat-touch", "pat-ready", "palm"],
  );
  const p = positions(v),
    f = p.get("finn"),
    m = p.get("mira"),
    pixel = v.cell / 128;
  const hand = (a) => ({
    x: a.x + (a.wrist.x - 64) * pixel * (a.left ? -1 : 1),
    y: a.bottom + (128 - a.wrist.y) * pixel * 1.5,
  });
  const fh = hand(f),
    mh = hand(m);
  assert.ok(Math.hypot(fh.x - mh.x, ((fh.y - mh.y) * 2) / 3) < 1);
  for (const s of steps) assert.equal(actor(s, "finn").dressed, true);
  for (const s of [ready, touch, release]) {
    assert.equal(
      s.items.some((p) => p.id === "bandage"),
      false,
      "dressing is painted in these poses",
    );
    const pose = actorPose(actor(s, "finn"), false, 0, false);
    assert.ok([32, 33].includes(pose.frame));
    const pixels = await sharp("public/story-stage/finn-poses.webp")
      .extract({
        left: (pose.frame % 4) * 128,
        top: Math.floor(pose.frame / 4) * 128,
        width: 128,
        height: 128,
      })
      .ensureAlpha()
      .raw()
      .toBuffer();
    const at = (81 * 128 + 91) * 4;
    assert.ok(
      pixels[at] > 170 && pixels[at + 1] > 130 && pixels[at + 3] > 200,
      "cream dressing remains visible on the right palm",
    );
  }
  const ended = steps.at(-1);
  assert.equal(item(ended, "bandage").wrist, true);
});

test("the stationary pat appears above the parcel, while an approach keeps normal ground depth", () => {
  const touch = moments(cue(story, 6))[2],
    p = positions(touch),
    f = actor(touch, "finn");
  assert.ok(
    stageActorDepth(f, f, touch, p) > stageItemDepth(item(touch, "recovered-parcel"), touch, p),
  );
  assert.equal(stageActorDepth(f, { ...f, x: f.x - 3 }, touch, p), 100 - f.bottom);
  const ended = moments(cue(story, 6)).at(-1),
    resting = actor(ended, "finn");
  assert.equal(stageActorDepth(resting, resting, ended, positions(ended)), 100 - resting.bottom);
  const look = moments(cue(story, 11)).at(-1);
  assert.ok(look.after >= journeyDuration(actor(look, "mira"), actor(cue(story, 10), "mira")));
  assert.ok(actor(look, "mira").bottom > actor(cue(story, 10), "mira").bottom);
  assert.equal(actorPose(actor(look, "mira"), false, 0, false).frame, 17);
});

test("new gestures keep head width, standing height, padded feet and every other atlas cell", async () => {
  for (const [id, changed, expected] of [
    ["finn", [32, 33], "0411e418c8483702977389924134c29c2696b5ece8f133889c8f24eeed0e52dd"],
    ["mira", [17], "3356d6b66be113228214b882f80a5a2f830a190bf32fcf0b42fffb5e90ba6027"],
  ]) {
    const path = `public/story-stage/${id}-poses.webp`,
      hash = createHash("sha256");
    const home = await readFrame(`public/home-pixel/${id}.webp`, {
      left: 0,
      top: 0,
      width: 128,
      height: 128,
    });
    const reference = await headBounds(
      await sharp(home.cell).extract(home.box).png().toBuffer(),
      0.25,
    );
    for (let i = 0; i < 48; i++) {
      const box = { left: (i % 4) * 128, top: Math.floor(i / 4) * 128, width: 128, height: 128 };
      if (changed.includes(i)) {
        const frame = await readFrame(path, box),
          head = await headBounds(
            await sharp(frame.cell).extract(frame.box).png().toBuffer(),
            0.25,
          );
        assert.ok(Math.abs(head.width - reference.width) <= 2);
        assert.equal(frame.box.height, 96);
        assert.equal(frame.box.top + frame.box.height, 120);
        assert.ok(frame.box.left >= 2 && frame.box.left + frame.box.width <= 126);
      } else {
        const pixels = await sharp(path).extract(box).ensureAlpha().raw().toBuffer();
        for (let j = 0; j < pixels.length; j += 4) if (!pixels[j + 3]) pixels.fill(0, j, j + 3);
        hash.update(pixels);
      }
    }
    assert.equal(hash.digest("hex"), expected, id);
  }
});
