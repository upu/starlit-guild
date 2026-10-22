import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { storyStageCue as cue, sampleStageActor, storyStageExitCue } from "../lib/story-stage.ts";
import { stageItemTarget, stageItemDepth, stageItemVisible } from "../lib/story-stage-props.ts";
import { orderStageItems } from "../lib/story-stage-cargo.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";

const id = "sweet-blockade-return";
function targets(stage) {
  const positions = new Map(stage.actors.map((a) => [a.id, sampleStageActor(a, a, 10000, true)]));
  for (const extra of stage.extras ?? []) positions.set(`extra:${extra.id}`, extra);
  for (const item of orderStageItems(stage.items)) {
    const at = stageItemTarget(item, stage, positions);
    positions.set(`item:${item.id}`, {
      ...at,
      mirrored: !!item.left,
      depth: stageItemDepth(item, stage, positions),
    });
  }
  return positions;
}

test("cargo follows the displayed carrier in the same frame, preserves mirroring and layers above it", () => {
  const parent = { id: "cart", art: "empty-cart", x: 40, bottom: 12, left: true };
  const child = { id: "parcel", art: "trade-parcels-open", carrier: "cart", x: -4, bottom: 15 };
  const stage = { actors: [], items: [child, parent] };
  assert.deepEqual(
    orderStageItems(stage.items).map((p) => p.id),
    ["cart", "parcel"],
  );
  const positions = targets(stage);
  assert.deepEqual(stageItemTarget(child, stage, positions), { x: 44, bottom: 27 });
  assert.equal(stageItemDepth(child, stage, positions), 89);
  positions.set("item:cart", { x: 57, bottom: 17, mirrored: true, depth: 83 });
  assert.deepEqual(stageItemTarget(child, stage, positions), { x: 61, bottom: 32 });
  assert.equal(stageItemDepth(child, stage, positions), 84);
  assert.equal(stageItemVisible({ ...child, stored: true }, positions), false);
  const outside = stageCameraCue({
    ...stage,
    luggage: false,
    items: [{ ...parent, x: 111 }, child],
  });
  assert.ok(outside.items[0].x > 140);
  assert.equal(outside.items[1].x, -4, "carrier offset is not an offscreen entrance");
});

test("the portable pole changes hands and enters its hole without changing position or size", () => {
  const scene = cue(id, 17),
    steps = scene.sequence;
  const position = (s) => targets({ ...scene, ...s }).get("item:signpost-portable");
  const arriving = steps.find((s) => s.after === 600),
    pickup = steps.find((s) => s.after === 2400);
  const before = steps.find((s) => s.after === 3200),
    planted = steps.find((s) => s.after === 4000);
  assert.deepEqual(
    [position(arriving).x, position(arriving).bottom],
    [position(pickup).x, position(pickup).bottom],
  );
  assert.deepEqual(
    [position(before).x, position(before).bottom],
    [position(planted).x, position(planted).bottom],
  );
  for (const s of [scene, ...steps])
    assert.equal(s.items.find((p) => p.id === "signpost-portable").width, 11);
  assert.equal(planted.items.find((p) => p.id === "signpost-portable").tilt, undefined);
  assert.equal(scene.background, "mountain-fork-empty");
});

test("the cart is attached at its existing position and carries the same recovered parcels", () => {
  const scene = cue(id, 20),
    final = scene.sequence.at(-1);
  const initial = targets(scene).get("item:empty-cart");
  const atHands = {
    ...scene,
    ...final,
    extras: final.extras.map((e) => (e.id === "worker" ? { ...e, x: 13.5, bottom: 14 } : e)),
  };
  const attached = targets(atHands).get("item:empty-cart");
  assert.deepEqual([attached.x, attached.bottom], [initial.x, initial.bottom]);
  assert.ok(
    cue(id, 21).extras.some((e) => e.id === "worker" && e.x > 100),
    "a fast next tap continues the exit",
  );
  for (let line = 0; line < 32; line++)
    for (const s of [cue(id, line), ...(cue(id, line).sequence ?? [])]) {
      const cargo = s.items.find((p) => p.id === "other-goods");
      if (cargo) assert.equal(cargo.width, 7.5);
      for (const item of s.items)
        if (item.carrier)
          assert.ok(
            s.items.some((p) => p.id === item.carrier),
            `${line}/${item.id} parent`,
          );
    }
});

test("honey stays in a distinct bag and the bandage passes between touching hands", () => {
  const packing = cue(id, 22);
  const before = packing.sequence.find((s) => s.after === 1400),
    after = packing.sequence.find((s) => s.after === 2200);
  assert.equal(before.items.find((p) => p.art === "honey").stored, false);
  assert.equal(after.items.find((p) => p.art === "honey").stored, true);
  assert.equal(after.items.find((p) => p.art === "honey").carrier, "honey-bag");
  const care = cue(id, 30),
    from = care.sequence.find((s) => s.after === 2300),
    to = care.sequence.find((s) => s.after === 3100);
  const a = targets({ ...care, ...from }).get("item:bandage"),
    b = targets({ ...care, ...to }).get("item:bandage");
  assert.equal(a.x, b.x);
  assert.ok(Math.abs(a.bottom - b.bottom) < 0.1, "cloth stays on the joined wrists");
  const exit = storyStageExitCue(id);
  assert.equal(exit.items.find((p) => p.id === "honey-bag").actor, "mira");
  assert.equal(exit.items.find((p) => p.id === "medicine").actor, "leon");
  assert.ok(exit.items.find((p) => p.id === "honey").stored);
  const departing = cue(id, 31).actors;
  const aria = departing.find((a) => a.id === "aria"),
    leon = departing.find((a) => a.id === "leon");
  assert.ok(
    Math.hypot(aria.x - leon.x, ((aria.bottom - leon.bottom) * 2) / 3) > 14,
    "Aria clears the medicine pickup before Leon steps in",
  );
});

test("worker walking, writing and crouching preserve head scale and ground contact", async () => {
  let width;
  for (let frame = 0; frame < 12; frame++) {
    const f = await readFrame("public/story-stage/worker-poses.webp", {
      left: (frame % 4) * 128,
      top: Math.floor(frame / 4) * 128,
      width: 128,
      height: 128,
    });
    const h = await headBounds(await sharp(f.cell).extract(f.box).png().toBuffer(), 0.25);
    if (frame === 0) width = h.width;
    if (frame >= 4) {
      assert.equal(f.box.top + f.box.height, 120);
      assert.ok(Math.abs(h.width - width) <= 3);
    }
    if (frame === 10) assert.ok(f.box.height < 86);
    else if (frame >= 4) assert.equal(f.box.height, 96);
  }
  assert.equal(stageExtraFrame({ id: "worker", writing: true, x: 1 }, false, 0), 8);
  assert.equal(stageExtraFrame({ id: "worker", writing: true, x: 1 }, false, 320), 9);
  assert.equal(stageExtraFrame({ id: "worker", inspect: true, x: 1 }), 10);
});
