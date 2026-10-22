import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import {
  storyStageCue as cue,
  sampleStageActor,
  stageEntrance,
  storyStageExitCue,
} from "../lib/story-stage.ts";
import { stageItemVisible } from "../lib/story-stage-props.ts";

test("chairs retain walking head width and lower their silhouette without clipping", async () => {
  for (const id of ["aria", "leon", "mira", "finn", "lico"]) {
    const base = await readFrame(`public/home-pixel/${id}.webp`, {
      left: 0,
      top: 0,
      width: 128,
      height: 128,
    });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    for (let i = 24; i < 32; i++) {
      const f = await readFrame(`public/story-stage/${id}-poses.webp`, {
        left: (i % 4) * 128,
        top: Math.floor(i / 4) * 128,
        width: 128,
        height: 128,
      });
      const actual = await headBounds(await sharp(f.cell).extract(f.box).png().toBuffer(), 0.25);
      assert.ok(
        Math.abs(actual.width - head.width) <= 2,
        `${id}/${i}: head ${actual.width} vs ${head.width}`,
      );
      assert.equal(f.box.height, 88);
      assert.equal(f.box.top + f.box.height, 120);
      assert.ok(f.box.left >= 2 && f.box.left + f.box.width <= 126);
    }
  }
});

test("a chair is hidden only while its occupant is visibly seated at that location", () => {
  const start = cue("brekka-arrival-departure", 0),
    leon = start.actors.find((a) => a.id === "leon");
  const seat = start.items.find((p) => p.seatFor === "leon");
  const seated = sampleStageActor(leon, leon, 3000, false);
  assert.equal(seated.onChair, true);
  assert.equal(stageItemVisible(seat, new Map([["leon", seated]])), false);
  const absent = sampleStageActor({ ...leon, visible: false }, leon, 3000, false);
  assert.equal(stageItemVisible(seat, new Map([["leon", absent]])), true);
  const standing = cue("brekka-arrival-departure", 22).actors.find((a) => a.id === "leon");
  const moving = sampleStageActor(standing, leon, 0, false);
  assert.equal(stageItemVisible(seat, new Map([["leon", moving]])), true);
  assert.equal(stageItemVisible(seat, new Map([["leon", { ...seated, x: 100 }]])), true);
  const exit = storyStageExitCue("brekka-arrival-departure");
  assert.ok(exit.items.some((p) => p.id === seat.id));
  assert.ok(exit.actors.every((a) => !a.seated));
  assert.equal(exit.actors.find((a) => a.id === "mira").lane, 48);
  assert.equal(exit.actors.find((a) => a.id === "finn").lane, 48);
});

test("Mira starts on the bed, lowers her feet without walking, and returns to breakfast", () => {
  const start = cue("medicine-packing-departure", 0),
    mira = start.actors.find((a) => a.id === "mira");
  const entry = stageEntrance("mira", start);
  assert.deepEqual([entry.x, entry.bottom], [mira.x, mira.bottom]);
  assert.equal(sampleStageActor(mira, entry, 0, false).frame, 32);
  const edge = cue("medicine-packing-departure", 9).actors.find((a) => a.id === "mira");
  assert.equal(sampleStageActor(edge, mira, 50, false).frame, 33);
  assert.ok(edge.bottom < mira.bottom);
  assert.equal(
    cue("medicine-packing-departure", 13).actors.find((a) => a.id === "mira").bed,
    "breakfast",
  );
  const exit = storyStageExitCue("medicine-packing-departure");
  assert.equal(exit.items.find((p) => p.id === "ledger").actor, "aria");
  assert.equal(exit.items.find((p) => p.id === "delivery-bag").actor, "leon");
  assert.ok(cue("medicine-packing-return", 5).cut);
  assert.equal(
    cue("medicine-packing-return", 5)
      .sequence.at(-1)
      .actors.find((a) => a.id === "mira").bed,
    "sleep",
  );
  assert.equal(
    cue("medicine-packing-return", 6).actors.find((a) => a.id === "mira").bed,
    undefined,
  );
});

test("the three travelers use chairs before Finn is introduced by the existing still", () => {
  const start = cue("berne-road-departure", 0);
  assert.equal(start.actors.length, 3);
  assert.ok(start.actors.every((a) => a.seated && a.chair));
  assert.equal(cue("berne-road-departure", 5), null);
});
