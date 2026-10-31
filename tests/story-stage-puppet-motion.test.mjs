import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFrame } from "../scripts/home-pixel-frames.mjs";
import { stageFigure, stageExtraFrame } from "../lib/story-stage-figure.ts";
import { sampleExtraTravel, extraTravelDuration } from "../lib/story-stage-extra-travel.ts";
import { storyStageCue as cue, sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";

test("figure motion preserves the original physical size and foot plane through padded cells", async () => {
  for (const [art, width] of [
    ["golem", 32],
    ["puppet", 9],
  ]) {
    const original = await sharp(`public/story-stage/prop-${art}.webp`).metadata();
    const item = { art, width, x: 50, bottom: 20 };
    const display = stageFigure(item, false, 0);
    assert.equal((display.width * original.width) / 512, width);
    assert.ok(Math.abs(((display.width * 32) / 512) * 1.5 - display.footPadding) < 1e-10);
    const hashes = [];
    for (let frame = 0; frame < 7; frame++) {
      const f = await readFrame(`public/story-stage/prop-${art}-poses.webp`, {
        left: (frame % 4) * 512,
        top: Math.floor(frame / 4) * 512,
        width: 512,
        height: 512,
      });
      assert.equal(f.box.top + f.box.height, 480, `${art}/${frame}: contact`);
      assert.ok(f.box.left > 8 && f.box.left + f.box.width < 504, `${art}/${frame}: no clipping`);
      if (frame < 5)
        assert.ok(
          Math.abs(f.box.height / original.height - 1) < 0.06,
          `${art}/${frame}: walking stature`,
        );
      else assert.ok(f.box.height < original.height, `${art}/${frame}: lowered joints`);
      hashes.push(f.cell.toString("base64"));
    }
    assert.equal(new Set(hashes.slice(1, 5)).size, 4, "four distinct walking drawings");
    const cadence = art === "golem" ? 180 : 130;
    assert.deepEqual(
      [0, 1, 2, 3].map((i) => stageFigure(item, true, cadence * i).frame),
      [1, 2, 3, 4],
    );
    assert.equal(stageFigure({ ...item, figure: "kneel" }, false, 0).frame, 5);
    assert.equal(stageFigure({ ...item, figure: "bow" }, false, 0).frame, 6);
  }
});

test("the masked commander keeps her feet grounded during poses, walking and both bows", async () => {
  for (let frame = 0; frame < 10; frame++) {
    const f = await readFrame("public/story-stage/masked-pumpety-poses.webp", {
      left: (frame % 4) * 128,
      top: Math.floor(frame / 4) * 128,
      width: 128,
      height: 128,
    });
    assert.equal(f.box.top + f.box.height, 120);
    assert.ok(f.box.left >= 4 && f.box.left + f.box.width <= 124);
    if (frame >= 4 && frame < 8) assert.equal(f.box.height, 96);
    if (frame >= 8) assert.ok(f.box.height < 80);
  }
  const extra = { id: "masked-pumpety", x: 50, bottom: 40, bow: "deep" };
  assert.equal(stageExtraFrame(extra), 9);
  assert.deepEqual(
    [0, 160, 320, 480].map((t) => stageExtraFrame(extra, true, t)),
    [4, 5, 6, 7],
  );
  const origin = { x: 10, bottom: 20 };
  const mid = sampleExtraTravel(extra, origin, extraTravelDuration(extra, origin) / 2, false);
  assert.equal(mid.x, 30);
  assert.equal(mid.bottom, 30);
  assert.ok(mid.moving);
  const interrupted = sampleExtraTravel(extra, mid, 0, false);
  assert.deepEqual([interrupted.x, interrupted.bottom], [mid.x, mid.bottom]);
  assert.deepEqual(sampleExtraTravel(extra, origin, 0, true), {
    x: 50,
    bottom: 40,
    left: false,
    moving: false,
  });
});

test("recovered honey is picked up at the table and changes hands only at contact above Mira's cloth", () => {
  const stage = cue("sweet-blockade-return", 0);
  const steps = stage.sequence;
  const pickup = steps.find((s) => s.after === 2200),
    handoff = steps.find((s) => s.after === 5000);
  const positions = (s) =>
    new Map(s.actors.map((a) => [a.id, sampleStageActor(a, a, 10000, true)]));
  const target = (s, id) =>
    stageItemTarget(
      s.items.find((p) => p.id === id),
      { ...stage, ...s },
      positions(s),
    );
  assert.deepEqual(target(stage, "honey"), target(pickup, "honey"));
  const arrival = steps.find((s) => s.after === 3000);
  assert.ok(handoff.after - arrival.after >= journeyDuration(arrival.actors[0], pickup.actors[0]));
  assert.deepEqual(target(arrival, "honey"), target(handoff, "honey"));
  assert.equal(target(handoff, "honey").x, target(handoff, "cloth").x);
  assert.equal(target(handoff, "honey").bottom - target(handoff, "cloth").bottom, 2);
  for (const s of [stage, ...steps]) assert.equal(s.items.find((p) => p.art === "honey").width, 6);
});

test("kneeling and bows follow their narration and persist correctly through intra-line NPC sequences", () => {
  const id = "sweet-blockade-return";
  assert.equal(cue(id, 1).items.find((p) => p.art === "golem").figure, "kneel");
  assert.ok(
    cue(id, 5)
      .items.filter((p) => ["golem", "puppet"].includes(p.art))
      .every((p) => p.figure === "bow"),
  );
  const bow = cue(id, 9);
  assert.equal(bow.extras[0].bow, "shallow");
  assert.equal(bow.sequence[0].extras[0].bow, "deep");
  assert.equal(cue(id, 10).extras[0].bow, undefined);
  const exit = stageCameraCue({
    ...bow,
    sequence: [{ ...bow.sequence[0], extras: [{ ...bow.extras[0], x: 111 }] }],
  });
  assert.ok(exit.sequence[0].extras[0].x > 140);
});
