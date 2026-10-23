import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { storyStageCue, sampleStageActor } from "../lib/story-stage.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageExtraRows } from "../lib/story-stage-figure.ts";
import { stageItemTarget, stageItemDepth, stageItemVisible } from "../lib/story-stage-props.ts";
import { extraTravelDuration } from "../lib/story-stage-extra-travel.ts";

const oldHashes = {
  aria: "0c7a04ad73cfa5a334ab9dddd8a89aefe081531b4e6bf42b416a25da5d49dc5f",
  leon: "eff595d9653b1c170715d276db1b6d7bbc985fdbac9ed5e2896271397d744b40",
  mira: "6ae462d49a9aa4441e7d5cae26027abe32d6603be42c9691340f48555785ad57",
  finn: "c9de2dda2afaaddd382c23b652a56d4b30047ea0626d5e551f2d52841f590727",
  lico: "ab44015da64fc6e57a42340d2b5b240871e06a04d3fabde92bb29257188d8294",
  worker: "5cf071cb60780af8135a7403b48f8e6dd6b0ea374120fab6b343165cad6239a8",
};
const moments = (cue) => [cue, ...cue.sequence.map((s) => ({ ...cue, ...s }))];
const positions = (cue) =>
  new Map([
    ...cue.actors.map((a) => [a.id, sampleStageActor(a, cue, 0, false, a)]),
    ...cue.extras.map((e) => [`extra:${e.id}`, { ...e, wrist: stageExtraWrist(e, false, 0) }]),
  ]);

test("dining additions preserve every previous cell and register heads, chairs and feet consistently", async () => {
  for (const [id, hash] of Object.entries(oldHashes)) {
    const path = `public/story-stage/${id}-poses.webp`,
      worker = id === "worker";
    const meta = await sharp(path).metadata();
    assert.equal(meta.width, 512);
    assert.equal(meta.height, worker ? 640 : 1920);
    const raw = await sharp(path)
      .extract({ left: 0, top: 0, width: 512, height: worker ? 512 : 1792 })
      .ensureAlpha()
      .raw()
      .toBuffer();
    assert.equal(createHash("sha256").update(raw).digest("hex"), hash, id);
    if (id === "lico") continue;
    const base = await readFrame(path, { left: 0, top: worker ? 0 : 768, width: 128, height: 128 });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    for (let col = 0; col < 3; col++) {
      const pose = await readFrame(path, {
        left: col * 128,
        top: worker ? 512 : 1792,
        width: 128,
        height: 128,
      });
      const actual = await headBounds(
        await sharp(pose.cell).extract(pose.box).png().toBuffer(),
        0.25,
      );
      assert.ok(Math.abs(head.width - actual.width) <= 1, `${id}/${col}: head width`);
      assert.equal(pose.box.height, 88);
      assert.equal(pose.box.top + pose.box.height, 120);
      assert.ok(pose.box.left >= 2 && pose.box.left + pose.box.width <= 126);
    }
  }
  assert.equal(stageExtraRows({ id: "worker" }), 5);
});

test("serving reaches each cup before pouring and keeps the tray and glasses above the tabletop", () => {
  const cue = storyStageCue("brekka-arrival-departure", 12),
    values = moments(cue);
  for (const [index, moment] of values.entries()) {
    const owner = moment.extras.find((e) => e.id === "merchant");
    const jug = moment.items.find((i) => i.id === "ale-jug");
    const at = positions(moment);
    if (jug.pouring) {
      let arrival = index;
      while (
        arrival > 0 &&
        values[arrival - 1].extras.find((e) => e.id === "merchant").x === owner.x
      )
        arrival--;
      const move = values[arrival];
      const before = arrival ? values[arrival - 1] : storyStageCue("brekka-arrival-departure", 11);
      const start = before.extras.find((e) => e.id === "merchant");
      assert.ok(moment.after - (move.after ?? 0) >= extraTravelDuration(owner, start));
      const target = stageItemTarget(jug, moment, at);
      const cup = moment.items.find((i) => i.id === (owner.x < 60 ? "mira-ale" : "finn-ale"));
      assert.ok(Math.abs(target.x - cup.x) < 2);
      assert.ok(target.bottom > cup.bottom && target.bottom - cup.bottom < 5);
      assert.ok(
        stageItemDepth(jug, moment, at) >
          stageItemDepth(
            moment.items.find((i) => i.id === "table"),
            moment,
            at,
          ),
      );
    }
    const tray = moment.items.find((i) => i.id === "fruit-tray");
    if (tray.support) {
      const depth = stageItemDepth(tray, moment, at);
      at.set("item:fruit-tray", { ...stageItemTarget(tray, moment, at), depth });
      for (const glass of moment.items.filter((i) => i.carrier === "fruit-tray"))
        assert.ok(stageItemDepth(glass, moment, at) > depth);
    }
    for (const item of moment.items.filter((i) => i.wrist))
      assert.ok(stageItemVisible(item, at), item.id);
  }
});

test("clinking reaches both glass rims without moving the chairs; drinks and bread track the matching hands", () => {
  const cue = storyStageCue("brekka-arrival-departure", 12);
  const toast = moments(cue).find((c) => c.actors.find((a) => a.id === "aria").dining === "reach");
  const at = positions(toast);
  const glasses = ["aria-glass", "leon-glass"].map((id) => toast.items.find((i) => i.id === id));
  const [a, b] = glasses.map((i) => stageItemTarget(i, toast, at));
  const width = glasses[0].width,
    angle = (glasses[0].tilt * Math.PI) / 180;
  const rimReach = width * Math.cos(angle) + (width / 0.62) * Math.sin(angle);
  assert.ok(Math.abs(a.bottom - b.bottom) < 0.5);
  assert.ok(Math.abs(b.x - a.x) <= rimReach && rimReach - Math.abs(b.x - a.x) < 1);
  for (const line of [12, 13, 15, 17, 20]) {
    const c = storyStageCue("brekka-arrival-departure", line);
    for (const m of moments(c)) {
      for (const actor of m.actors) {
        const seat = cue.actors.find((a) => a.id === actor.id);
        assert.deepEqual([actor.x, actor.bottom], [seat.x, seat.bottom]);
      }
      for (const i of m.items.filter((i) => i.wrist))
        assert.ok(stageItemVisible(i, positions(m)), `${line}/${i.id}`);
    }
  }
});
