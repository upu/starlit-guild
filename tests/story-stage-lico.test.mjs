import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { storyStageCue as cue, sampleStageActor } from "../lib/story-stage.ts";
import { stageItemVisible } from "../lib/story-stage-props.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";

test("Lico's stool and seated NPC frames keep head scale, floor contact and padding", async () => {
  for (const [id, base, frames, height] of [
    ["lico", "public/home-pixel/lico.webp", [36, 37, 38, 39, 40, 41, 42, 43], 80],
    ["keeper", "public/story-stage/keeper-poses.webp", [4, 5, 6, 7], 88],
    ["merchant", "public/story-stage/merchant-poses.webp", [4, 5, 6, 7], 88],
  ]) {
    const reference = await readFrame(base, { left: 0, top: 0, width: 128, height: 128 });
    const head = await headBounds(
      await sharp(reference.cell).extract(reference.box).png().toBuffer(),
      0.25,
    );
    for (const frame of frames) {
      const f = await readFrame(`public/story-stage/${id}-poses.webp`, {
        left: (frame % 4) * 128,
        top: Math.floor(frame / 4) * 128,
        width: 128,
        height: 128,
      });
      const actual = await headBounds(await sharp(f.cell).extract(f.box).png().toBuffer(), 0.25);
      assert.ok(
        Math.abs(head.width - actual.width) <= 2,
        `${id}/${frame} head ${actual.width} vs ${head.width}`,
      );
      assert.equal(f.box.height, height);
      assert.equal(f.box.top + f.box.height, 120);
      assert.ok(f.box.left >= 2 && f.box.left + f.box.width <= 126);
    }
  }
});

test("4-7 seats match the narration and the stool remains after Lico gets up", () => {
  assert.ok(cue("lico-records-departure", 0).extras.every((e) => e.chair));
  const seated = cue("lico-records-departure", 32),
    a = seated.actors.find((a) => a.id === "lico");
  const seat = seated.items.find((p) => p.seatFor === "lico");
  const pose = sampleStageActor(a, a, 3000, false);
  assert.equal(pose.frame, 76);
  assert.equal(pose.onChair, true);
  assert.equal(stageItemVisible(seat, new Map([["lico", pose]])), false);
  const stood = cue("lico-records-departure", 40)
    .sequence.at(-1)
    .actors.find((a) => a.id === "lico");
  assert.equal(
    stageItemVisible(seat, new Map([["lico", sampleStageActor(stood, a, 3000, false)]])),
    true,
  );
});

test("reflector is present covered, opens with low smoke, then stops while smoke clears", async () => {
  const before = cue("lico-records-departure", 32).items.find((p) => p.id === "reflector");
  const active = cue("lico-records-departure", 42).sequence.at(-1).items;
  const after = cue("lico-records-return", 0);
  assert.equal(before.art, "reflector-covered");
  assert.equal(active.find((p) => p.id === "reflector").art, "reflector");
  assert.ok(active.some((p) => p.art === "low-smoke"));
  assert.equal(after.items.find((p) => p.id === "reflector").art, "reflector-down");
  assert.ok(after.items.filter((p) => p.art === "low-smoke").every((p) => p.dissipating));
  assert.ok(after.sequence.at(-1).items.every((p) => p.art !== "low-smoke"));
  for (const art of ["reflector-covered", "reflector", "reflector-down"]) {
    const meta = await sharp(`public/story-stage/prop-${art}.webp`).metadata();
    assert.deepEqual([meta.width, meta.height], [272, 240]);
  }
});

test("Aria collects her basket before approaching and receives the seedling only after arrival", () => {
  const start = cue("lico-records-return", 25).actors.find((a) => a.id === "aria");
  const pickup = cue("lico-records-return", 26),
    walk = pickup.actors.find((a) => a.id === "aria");
  assert.ok(pickup.sequence[0].after >= journeyDuration(walk, start));
  assert.equal(pickup.sequence[0].items.find((p) => p.id === "basket").actor, "aria");
  const receive = cue("lico-records-return", 27),
    target = receive.actors.find((a) => a.id === "aria");
  const arrived = pickup.sequence.at(-1).actors.find((a) => a.id === "aria");
  assert.equal(pickup.finishBeforeAdvance, true, "finish the basket approach before the next line");
  assert.deepEqual([target.x, target.bottom], [arrived.x, arrived.bottom]);
  const inHand = receive.sequence[0].items.find((p) => p.art === "moss");
  assert.equal(inHand.actor, "lico");
  const moss = receive.sequence.at(-1).items.find((p) => p.art === "moss");
  assert.equal(moss.actor, undefined);
  assert.equal(moss.carrier, "basket");
  assert.ok(receive.items.every((p) => p.art !== "seedlings"));
});
