import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue as cue, sampleStageActor } from "../lib/story-stage.ts";
import { orderStageItems, itemFacing } from "../lib/story-stage-cargo.ts";
import { stageItemTarget, stageItemDepth, stageItemVisible } from "../lib/story-stage-props.ts";
import { stageFigure } from "../lib/story-stage-figure.ts";
import sharp from "sharp";

const id = "begging-golem-return";
function positions(stage) {
  const result = new Map(stage.actors.map((a) => [a.id, sampleStageActor(a, a, 0, true)]));
  for (const item of orderStageItems(stage.items)) {
    const at = stageItemTarget(item, stage, result);
    result.set(`item:${item.id}`, {
      ...at,
      mirrored: !!item.left,
      depth: stageItemDepth(item, stage, result),
    });
  }
  return result;
}
const xy = (p) => [p.x, p.bottom];

test("the pursuit takes place outside the same workshop at the same physical scale", () => {
  const next = cue("sweet-blockade-departure", 0);
  for (let line = 0; line < 18; line++) {
    const stage = cue(id, line);
    assert.equal(stage.background, next.background);
    for (const state of [stage, ...(stage.sequence ?? [])])
      for (const art of ["golem", "puppet", "honey", "table"])
        assert.equal(
          state.items.find((p) => p.art === art).width,
          next.items.find((p) => p.art === art).width,
        );
  }
  assert.equal(cue("begging-golem-departure", 3), null, "the existing illustration remains static");
});

test("the puppet drags the cloth and its honey together then leaves them on the table", () => {
  const lift = cue(id, 4),
    moving = lift.sequence.at(-1);
  assert.equal(lift.items.find((p) => p.id === "loot-cloth").carrier, "puppet");
  assert.equal(lift.items.find((p) => p.id === "honey").carrier, "loot-cloth");
  const before = positions(lift),
    after = positions({ ...lift, ...moving });
  const delta = (a, b) => xy(b).map((v, i) => v - xy(a)[i]);
  assert.deepEqual(
    delta(before.get("item:puppet"), after.get("item:puppet")),
    delta(before.get("item:honey"), after.get("item:honey")),
  );
  const arrived = cue(id, 8),
    table = arrived.sequence.at(-1);
  const last = positions({ ...arrived, ...table });
  assert.deepEqual(xy(last.get("item:honey")), [90, 66]);
  assert.ok(last.get("item:honey").depth > last.get("item:loot-cloth").depth);
  assert.equal(table.items.find((p) => p.id === "loot-cloth").support, "table");
});

test("backward steps retain the facing and reverse footfalls without changing body width", () => {
  const golem = cue(id, 4)
    .sequence.at(-1)
    .items.find((p) => p.art === "golem");
  const origin = { x: 58, bottom: 24 };
  assert.equal(itemFacing(golem, origin, golem, false), false);
  assert.deepEqual(
    [0, 180, 360, 540].map((t) => stageFigure(golem, true, t).frame),
    [1, 4, 3, 2],
  );
  for (const t of [0, 180, 360, 540])
    assert.equal(stageFigure(golem, true, t).width, stageFigure(golem, false, 0).width);
});

test("Mira dresses Leon first and Aria second at shared hand positions", () => {
  const stage = cue(id, 17),
    steps = stage.sequence;
  for (const [from, to, bandage] of [
    [700, 1400, "hand-bandage"],
    [4400, 5200, "arm-bandage"],
  ]) {
    const a = positions({ ...stage, ...steps.find((s) => s.after === from) }).get(
      `item:${bandage}`,
    );
    const b = positions({ ...stage, ...steps.find((s) => s.after === to) }).get(`item:${bandage}`);
    assert.ok(Math.abs(a.x - b.x) < 0.2);
    // The loose strip is wider than the finished wrap; compare their centers.
    assert.ok(Math.abs(a.bottom + (3 / 1.3) * 0.75 - (b.bottom + (1.3 / 1.3) * 0.75)) < 0.65);
  }
  const finished = steps.at(-1),
    next = cue("sweet-blockade-departure", 0);
  for (const actor of finished.actors) {
    assert.deepEqual(xy(actor), xy(next.actors.find((a) => a.id === actor.id)));
    assert.ok(!actor.inspect && !actor.packing && !actor.carry);
  }
  const box = finished.items.find((p) => p.id === "medicine");
  assert.equal(box.art, "medicine-closed");
  assert.equal(box.width, 8);
  assert.deepEqual(xy(box), xy(next.items.find((p) => p.art === "medicine-closed")));
  const tying = steps.find((s) => s.after === 11100);
  const leon = tying.actors.find((a) => a.id === "leon");
  assert.equal(
    sampleStageActor(leon, leon, 1000).frame,
    13,
    "the medicine box does not summon a cloth sack baked into the packing pose",
  );
  assert.ok(
    Math.abs(tying.actors.find((a) => a.id === "mira").bottom - box.bottom) >= 14,
    "Mira leaves room for the box and Leon's hands",
  );
});

test("dressings stay within the rendered arm through walking, carrying and kneeling", async () => {
  const stage = cue(id, 17);
  let previous = stage.actors;
  const atlases = new Map();
  for (const moment of stage.sequence) {
    for (const item of moment.items.filter((p) => p.wrist)) {
      const actor = moment.actors.find((a) => a.id === item.actor);
      for (const t of [0, 140, 280, 420, 650, 1000, 2000, 4000]) {
        const sample = sampleStageActor(
          actor,
          previous.find((a) => a.id === actor.id),
          t,
        );
        const positions = new Map([[actor.id, sample]]);
        if (
          sample.atlas === "home" &&
          (actor.id === "aria" ? [2, 3, 4, 5, 6] : [2, 3, 6, 7]).includes(sample.frame)
        ) {
          assert.equal(
            stageItemVisible(item, positions),
            false,
            "the torso hides the far arm and its dressing",
          );
          continue;
        }
        assert.ok(sample.wrist, `${actor.id}/${sample.atlas}/${sample.frame} has a wrist anchor`);
        const file =
          sample.atlas === "home"
            ? `public/home-pixel/${actor.id}.webp`
            : `public/story-stage/${actor.id}-poses.webp`;
        if (!atlases.has(file))
          atlases.set(
            file,
            await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
          );
        const { data, info } = atlases.get(file);
        const x = (sample.frame % 4) * 128 + sample.wrist.x;
        const y = Math.floor(sample.frame / 4) * 128 + sample.wrist.y;
        assert.ok(
          data[(y * info.width + x) * 4 + 3] > 128,
          `${actor.id}/${sample.frame} anchor touches the sprite`,
        );
        const target = stageItemTarget(item, stage, new Map([[actor.id, sample]]));
        const elementTop = sample.bottom + stage.cell * 1.5;
        const spriteWrist = elementTop - (sample.wrist.y / 128) * stage.cell * 1.5;
        const overlayCenter = target.bottom + (item.width / 1.3) * 0.75;
        assert.ok(Math.abs(spriteWrist - overlayCenter) < 1e-8, "canvas padding is included once");
      }
    }
    previous = moment.actors;
  }
});
