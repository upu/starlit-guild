import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { storyStageCue, sampleStageActor } from "../lib/story-stage.ts";
import { stageExtraFrame, stageExtraRows } from "../lib/story-stage-figure.ts";
import { stageItemTarget, stageItemVisible } from "../lib/story-stage-props.ts";
import { actorPose } from "../lib/story-stage-pose.ts";

const oldHashes = {
  aria: "4445a482d79b3246a637c7a82636e548a3f6b193b8a96757aaa35666936c8781",
  leon: "e2146145b6bb6e385877166f5831a8ffedebb2bc5a2b9daec1d3c065a9d33611",
  mira: "2623399b3ee33e4a4fc061080ffd527b36c3c08d41fa91e25c292afe2ca46764",
  finn: "4294349baa060854fd90c0ddb55f4a633366833b669e3e09fa73935e31c9894b",
  lico: "92f8eacedc9e99be7613dc2db234e7c00200cc7bb2d6c69d5c832ce5b9144e62",
  doctor: "dddc06ff5089acf29bca16b4005ef8f8f215a173fd39ef7892404d208445cbf9",
};
const cue = (line) => storyStageCue("brekka-arrival-return", line);
const moments = (c) => [c, ...(c.sequence ?? []).map((s) => ({ ...c, ...s }))];
const positions = (c) => new Map(c.actors.map((a) => [a.id, sampleStageActor(a, c, 0, false, a)]));

test("visit atlas preserves all sixty hero cells and old doctor poses, with consistent heads and soles", async () => {
  for (const [id, hash] of Object.entries(oldHashes)) {
    const p = `public/story-stage/${id}-poses.webp`,
      height = id === "doctor" ? 128 : 1920;
    const raw = await sharp(p)
      .extract({ left: 0, top: 0, width: 512, height })
      .ensureAlpha()
      .raw()
      .toBuffer();
    // Appending a WebP row can change RGB under fully transparent pixels only.
    if (id === "doctor")
      for (let i = 0; i < raw.length; i += 4) if (!raw[i + 3]) raw.fill(0, i, i + 3);
    assert.equal(createHash("sha256").update(raw).digest("hex"), hash, id);
    if (!["mira", "doctor"].includes(id)) continue;
    const base = await readFrame(p, { left: 0, top: 0, width: 128, height: 128 });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    for (let col = 0; col < 4; col++) {
      const frame = await readFrame(p, { left: col * 128, top: height, width: 128, height: 128 });
      const actual = await headBounds(
        await sharp(frame.cell).extract(frame.box).png().toBuffer(),
        0.25,
      );
      assert.ok(Math.abs(head.width - actual.width) <= 1, `${id}/${col}: head`);
      assert.equal(frame.box.height, 96);
      assert.equal(frame.box.top + frame.box.height, 120);
      assert.ok(frame.box.left >= 2 && frame.box.left + frame.box.width <= 126);
    }
  }
  assert.equal(stageExtraRows({ id: "doctor" }), 3);
});

test("doctor records only while writing; the seated patient points at the table", () => {
  const c = cue(1),
    doctor = c.extras.find((e) => e.id === "doctor"),
    patient = c.extras.find((e) => e.id === "keeper");
  assert.equal(patient.chair, true);
  assert.equal(stageExtraFrame(patient), 6);
  assert.equal(stageExtraFrame(doctor, false, 0), 4);
  assert.equal(stageExtraFrame(doctor, false, 320), 5);
  assert.equal(stageExtraFrame(c.sequence.at(-1).extras.find((e) => e.id === "doctor")), 6);
  assert.equal(stageExtraFrame(cue(2).extras.find((e) => e.id === "doctor")), 7);
});

test("Mira releases the bottle, goes around the table and puts the cup within the patient's reach", () => {
  const c = cue(10),
    all = moments(c);
  assert.equal(c.actors.find((a) => a.id === "mira").visit, undefined);
  for (const m of all) {
    const bottle = m.items.find((i) => i.id === "ale-bottle");
    assert.equal(bottle.actor, undefined);
    assert.equal(bottle.support, "visit-table");
    for (const i of m.items.filter((i) => i.wrist)) assert.ok(stageItemVisible(i, positions(m)));
  }
  const travel = all.find((m) => m.actors.find((a) => a.id === "mira").via);
  assert.ok(travel.actors.find((a) => a.id === "mira").via.every((p) => p.bottom < 14));
  assert.deepEqual(
    cue(11).actors.find((a) => a.id === "mira").via,
    travel.actors.find((a) => a.id === "mira").via,
  );
  const held = all.find((m) => m.items.find((i) => i.id === "patient-tea").wrist);
  const stretched = all.find((m) => m.actors.find((a) => a.id === "mira").visit === "slide");
  const a = stageItemTarget(
    held.items.find((i) => i.id === "patient-tea"),
    held,
    positions(held),
  );
  const b = stageItemTarget(
    stretched.items.find((i) => i.id === "patient-tea"),
    stretched,
    positions(stretched),
  );
  assert.ok(b.x > a.x + 2);
  const placed = all.at(-1).items.find((i) => i.id === "patient-tea");
  assert.ok(Math.abs(placed.x - b.x) < 0.1);
  assert.ok(Math.abs(placed.bottom - b.bottom) < 1.1);
  assert.equal(placed.actor, undefined);
});

test("Finn waits outside before the group exits and Mira frees her hand before knocking", () => {
  assert.equal(cue(11).actors.find((a) => a.id === "finn").visible, false);
  const outside = cue(12),
    finn = outside.actors.find((a) => a.id === "finn");
  assert.equal(outside.background, "brekka-homes");
  for (const m of moments(outside))
    assert.deepEqual(
      m.actors.find((a) => a.id === "finn"),
      finn,
    );
  assert.deepEqual(outside.extras, []);
  const door = cue(27),
    all = moments(door),
    knock = all.find((m) => m.actors.find((a) => a.id === "mira").knock);
  assert.equal(knock.items.find((i) => i.id === "visit-bag").actor, undefined);
  const mira = knock.actors.find((a) => a.id === "mira");
  const placing = all.find((m) => m.actors.find((a) => a.id === "mira").inspect);
  assert.equal(
    actorPose(
      placing.actors.find((a) => a.id === "mira"),
      false,
      0,
      false,
    ).frame,
    13,
  );
  assert.ok(
    stageItemVisible(
      placing.items.find((i) => i.id === "visit-bag"),
      positions(placing),
    ),
  );
  assert.equal(mira.carry, false);
  assert.equal(mira.inspect, false);
  assert.deepEqual(
    [0, 180].map((t) => actorPose(mira, false, t, false).frame),
    [62, 63],
  );
  assert.equal(actorPose(mira, false, 180, true).frame, 62);
  assert.equal(actorPose(mira, true, 0, false).atlas, "home");
  assert.equal(all.at(-1).actors.find((a) => a.id === "mira").knock, false);
});
