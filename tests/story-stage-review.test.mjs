import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { storyStageCue as cue, storyStageExitCue, sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget, deliveryBoxTarget } from "../lib/story-stage-props.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";

const actor = (id, line, who) => cue(id, line).actors.find((a) => a.id === who);
const settled = (a) => sampleStageActor(a, a, 10000, true);

test("sitting and carrying preserve emotional changes without cups or packing poses", () => {
  for (const id of ["aria", "leon", "mira", "finn", "lico"]) {
    const base = { id, x: 50, left: false };
    for (const state of ["seated", "carry"]) {
      const samples = ["idle", "think", "tease"].map((pose) =>
        settled({ ...base, [state]: true, pose }),
      );
      assert.ok(samples.every((s) => s.atlas === "conversation"));
      assert.equal(new Set(samples.map((s) => s.frame)).size, 3);
    }
    assert.equal(settled({ ...base, inspect: true }).frame, 13);
    assert.equal(settled({ ...base, inspect: true, packing: true }).frame, 6);
  }
  assert.ok([17, 18].includes(settled(actor("starlit-guild-founding-return", 64, "leon")).frame));
  assert.equal(settled(actor("moonlit-herbs-return", 3, "mira")).frame, 31);
});

test("delivered dialogue poses retain head scale, foot contact and short seated bodies", async () => {
  for (const id of ["aria", "leon", "mira", "finn", "lico"]) {
    const base = await readFrame(`public/home-pixel/${id}.webp`, {
      left: 0,
      top: 0,
      width: 128,
      height: 128,
    });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    for (let frame = 0; frame <= 20; frame++) {
      const f = await readFrame(`public/story-stage/${id}-poses.webp`, {
        left: (frame % 4) * 128,
        top: Math.floor(frame / 4) * 128,
        width: 128,
        height: 128,
      });
      const actual = await headBounds(await sharp(f.cell).extract(f.box).png().toBuffer(), 0.25);
      assert.ok(
        Math.abs(actual.width - head.width) <= 3,
        `${id}/${frame}: head ${actual.width} vs ${head.width}`,
      );
      assert.equal(f.box.top + f.box.height, 120, `${id}/${frame}: foot`);
      if ((frame >= 10 && frame <= 13) || (id === "finn" && frame === 17))
        assert.ok(f.box.height < 86, `${id}/${frame}: stays low`);
      else if (frame !== 6 && frame !== 7) assert.equal(f.box.height, 96);
    }
  }
});

test("Lico walks around the party and held items follow her displayed facing and depth", () => {
  const id = "brekka-moss-beds-return";
  for (const [line, start] of [
    [15, 82],
    [22, 34],
  ]) {
    const stage = cue(id, line),
      lico = stage.actors.find((a) => a.id === "lico"),
      origin = { x: start, bottom: 14 };
    const duration = journeyDuration(lico, origin);
    for (let t = 0; t < duration; t += 50) {
      const s = sampleStageActor(lico, origin, t);
      if (s.x > 41 && s.x < 67) assert.ok(s.bottom <= 1, `avoids occupied row at ${t}`);
      const book = stage.items.find((p) => p.id === "ledger");
      const target = stageItemTarget(book, stage, new Map([["lico", s]]));
      assert.equal(Math.sign(target.x - s.x), s.left ? -1 : 1);
      assert.ok(Math.abs(target.bottom - s.bottom - 9) < 0.0001);
    }
    const during = sampleStageActor(lico, origin, 600);
    const next = sampleStageActor(lico, during, 0);
    assert.equal(next.x, during.x);
    assert.equal(next.bottom, during.bottom);
    assert.equal(sampleStageActor(lico, origin, 0, true).x, lico.x);
  }
  assert.equal(actor(id, 2, "lico").name, "小柄な女性");
  assert.equal(actor(id, 9, "lico").name, "リコ");
});

test("the key, shoulder bag and Merrill's pot appear with their narrated owners", () => {
  assert.ok(!cue("riverside-manor-departure", 5).items.some((p) => p.art === "key"));
  assert.equal(cue("manor-survey-return", 2).items.find((p) => p.art === "key").actor, "finn");
  assert.equal(cue("manor-survey-return", 11).items.find((p) => p.art === "key").extra, "worker");
  const bags = [0, 4].map((line) =>
    cue("medicine-packing-return", line).items.find((p) => p.art === "delivery-bag"),
  );
  assert.equal(bags[0].width, bags[1].width);
  assert.ok(actor("medicine-packing-return", 4, "aria").shoulder);
  const stage = cue("merrill-seedlings-return", 40),
    pot = stage.items.find((p) => p.art === "pot");
  for (const x of [73, 81, 93, 110]) {
    const at = stageItemTarget(pot, stage, new Map([["extra:merrill", { x, bottom: 36 }]]));
    assert.equal(at.x - x, 4);
    assert.equal(at.bottom, 44);
  }
});

test("transplant transport completes pickup, carry, placement and return within the narration", () => {
  const stage = cue("moss-transplant-departure", 31),
    steps = stage.sequence;
  assert.equal(stage.items.find((p) => p.art === "seedlings").actor, "aria");
  assert.ok(steps[0].actors.find((a) => a.id === "aria").carry);
  const placed = steps[1].items.find((p) => p.art === "seedlings");
  assert.equal(placed.actor, undefined);
  assert.equal(placed.width, 10);
  assert.equal(steps.at(-1).actors.find((a) => a.id === "aria").carry, false);
  assert.deepEqual(cue("moss-transplant-departure", 32).items, steps.at(-1).items);
  assert.ok(
    cue("moss-transplant-departure", 20).items.find((p) => p.art === "seedling-cart").tilt < 0,
  );
  assert.ok(
    cue("moss-transplant-departure", 25).sequence[0].actors.find((a) => a.id === "leon").sword,
  );
  const restored = cue("moss-transplant-departure", 37)
    .sequence.at(-1)
    .items.find((p) => p.art === "seedling-cart");
  assert.equal(restored.tilt, 0);
  assert.equal(restored.actor, "finn");
});

test("delivery carriers clear the stock and the held box follows their depth", () => {
  const origin = cue("town-deliveries-departure", 12),
    next = cue("town-deliveries-departure", 13);
  for (let elapsed = 0; elapsed <= 1500; elapsed += 40) {
    const positions = next.actors.map((a, i) => sampleStageActor(a, origin.actors[i], elapsed));
    for (const p of positions)
      if (p.x > 40 && p.x < 58) assert.ok(p.bottom < 10, "walk in front of table stock");
    const box = deliveryBoxTarget(
      "shared",
      positions[0].x,
      positions[1].x,
      positions[0].bottom,
      positions[1].bottom,
    );
    assert.equal(box.bottom, (positions[0].bottom + positions[1].bottom) / 2 + 10);
  }
});

test("the night fork follows both visible branches and reduced motion reaches the same exit", () => {
  const last = cue("moss-night-road-return", 25),
    exit = storyStageExitCue("moss-night-road-return");
  for (const [i, actor] of exit.actors.entries()) {
    assert.ok(actor.via.length === 2);
    const midpoint = sampleStageActor(actor, last.actors[i], 1800);
    assert.ok(midpoint.bottom > last.actors[i].bottom);
    assert.equal(midpoint.left, i === 0);
    const end = sampleStageActor(actor, last.actors[i], 0, true);
    assert.equal(end.bottom, actor.bottom);
    assert.equal(end.x, actor.x);
  }
});

test("Aria and Leon have four registered carry phases without changes of stature", async () => {
  for (const id of ["aria", "leon"]) {
    const actor = { id, x: 90, left: false, carry: true };
    const frames = [0, 130, 260, 390].map((t) => sampleStageActor(actor, { x: 10 }, t).frame);
    assert.deepEqual(frames, [8, 9, 22, 23]);
    for (const frame of frames) {
      const f = await readFrame(`public/story-stage/${id}-poses.webp`, {
        left: (frame % 4) * 128,
        top: Math.floor(frame / 4) * 128,
        width: 128,
        height: 128,
      });
      assert.equal(f.box.height, 96);
      assert.equal(f.box.top + f.box.height, 120);
    }
  }
});

test("the returning cloth stays owned, is put away, and is handed back on the narrated line", () => {
  const scene = "forest-wetland-departure";
  const clothAt = (line) => cue(scene, line).items.find((item) => item.id === "cloth");
  assert.equal(clothAt(0).actor, "aria");
  for (const line of [4, 5, 6, 13, 14, 15]) assert.equal(clothAt(line).actor, "leon");
  for (let line = 7; line <= 12; line++) assert.equal(clothAt(line), undefined);
  assert.equal(clothAt(16).actor, "aria");
  for (const line of [0, 4, 13, 16]) {
    const stage = cue(scene, line),
      cloth = clothAt(line);
    const owner = stage.actors.find((a) => a.id === cloth.actor);
    const moved = { ...owner, x: owner.x + 10, bottom: 20 };
    const at = stageItemTarget(cloth, stage, new Map([[owner.id, moved]]));
    assert.ok(Math.abs(at.x - moved.x) <= 5);
    assert.equal(at.bottom - moved.bottom, owner.id === "aria" ? 6 : 10);
  }
});
