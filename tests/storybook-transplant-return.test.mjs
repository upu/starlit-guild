import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";
import { extraTravelDuration, sampleExtraTravel } from "../lib/story-stage-extra-travel.ts";
const id = "moss-transplant-return";
const item = (s, id) => s.items.find((i) => i.id === id);
function target(s, c, name, owner, npc = false) {
  const a = (npc ? s.extras : s.actors).find((a) => a.id === owner),
    frame = npc ? stageExtraFrame(a) : actorPose(a, false, 0, true).frame,
    p = a.wristPoints[frame];
  return stageItemTarget(
    item(s, name),
    c,
    new Map([[npc ? `extra:${owner}` : owner, { ...a, wrist: { x: p[0], y: p[1] } }]]),
  );
}
const near = (a, b) =>
  assert.ok(
    Math.abs(a.x - b.x) < 0.001 && Math.abs(a.bottom - b.bottom) < 0.001,
    JSON.stringify({ a, b }),
  );
test("new beds, tower drainage and next-morning visits retain distinct painted places", () => {
  const expected = [
    [0, "new-moss-beds-v1"],
    [9, "brekka-tower-drain-v1"],
    [15, "patient-room-v1"],
    [22, "brekka-homes-v1"],
  ];
  for (const [line, art] of expected) {
    const c = studyCue(id, line, true);
    assert.equal(storybookPresentation(id, c.background, line).art, art);
  }
  assert.equal(studyCue(id, 15, true).night, false);
});
test("the cloth handoff joins two visible palms before Aria leaves", () => {
  const c = studyCue(id, 0, true),
    pass = c.sequence.find((s) => s.after === 1800),
    leave = c.sequence.find((s) => s.after === 2600);
  near(target(c, c, "dry-cloth", "aria"), target(pass, c, "dry-cloth", "lico"));
  const a = c.actors.find((a) => a.id === "aria");
  assert.equal(c.initial.aria, a.x);
  assert.equal(c.initialBottom.aria, a.bottom);
  assert.ok(leave.actors.find((a) => a.id === "aria").x < a.x);
  assert.ok(c.finishBeforeAdvance);
});
test("squatting care keeps the same head scale and complete foot margins", async () => {
  const m = JSON.parse(
    await readFile("public/storybook-study/lico-transplant-care-v1-metrics.json", "utf8"),
  );
  assert.equal(new Set(m.map((f) => f.scale)).size, 1);
  assert.equal(m[0].height, 128);
  assert.ok(m.slice(4, 7).every((f) => f.height < 128 * 0.76));
  const { data, info } = await sharp("public/storybook-study/lico-transplant-care-v1.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (x % 192 === 0 || x % 192 === 191 || y % 192 === 0 || y % 192 === 191)
        assert.ok(data[(y * info.width + x) * 4 + 3] <= 16);
  const c = studyCue(id, 3, true);
  assert.equal(
    actorPose(
      c.actors.find((a) => a.id === "lico"),
      false,
      0,
      true,
    ).frame,
    84,
  );
  assert.equal(
    actorPose(
      c.sequence[0].actors.find((a) => a.id === "lico"),
      false,
      0,
      true,
    ).frame,
    86,
  );
});
test("the basket is lifted from its floor position and changes owner at the shared contact", () => {
  const c = studyCue(id, 9, true),
    low = c.sequence.find((s) => s.after === 2800),
    ground = c.sequence.find((s) => s.after === 1800),
    offer = c.sequence.find((s) => s.after === 4600),
    received = c.sequence.find((s) => s.after === 6000);
  near(target(low, c, "tower-basket", "worker", true), item(ground, "tower-basket"));
  near(
    target(offer, c, "tower-basket", "worker", true),
    target(received, c, "tower-basket", "leon"),
  );
  assert.ok(
    c.sequence
      .at(-1)
      .actors.find((a) => a.id === "leon")
      .via.every((p) => p.bottom === 14),
  );
});
test("the party checks the drainage after the basket handoff and stays there for the reply", () => {
  const cue = studyCue(id, 9, true);
  const before = cue.sequence.at(-2),
    drain = cue.sequence.at(-1);
  const actor = (state, name) => state.actors.find((value) => value.id === name);
  const extra = (state, name) => state.extras.find((value) => value.id === name);
  assert.equal(cue.finishBeforeAdvance, true);
  assert.ok(drain.after > 6800, "the basket exchange and Leon's return come first");
  assert.equal(item(drain, "tower-basket").actor, "leon");
  for (const name of ["aria", "lico"])
    assert.ok(journeyDuration(actor(drain, name), actor(before, name)) < 3000);
  assert.ok(extraTravelDuration(extra(drain, "keeper"), extra(before, "keeper")) < 3000);
  for (let time = 0; time <= 3000; time += 25) {
    const lico = sampleJourney(actor(drain, "lico"), actor(before, "lico"), time, false);
    for (const name of ["aria", "mira", "leon"]) {
      const other = sampleJourney(actor(drain, name), actor(before, name), time, false);
      if (Math.abs(lico.x - other.x) < 6) assert.ok(Math.abs(lico.bottom - other.bottom) >= 18);
    }
    const worker = sampleExtraTravel(extra(drain, "worker"), extra(before, "worker"), time, false);
    if (Math.abs(lico.x - worker.x) < 6) assert.ok(Math.abs(lico.bottom - worker.bottom) >= 18);
  }
  for (let line = 10; line <= 14; line++) {
    const next = studyCue(id, line, true);
    for (const name of ["aria", "lico"])
      assert.deepEqual(
        [actor(next, name).x, actor(next, name).bottom],
        [actor(drain, name).x, actor(drain, name).bottom],
      );
    assert.deepEqual(
      [extra(next, "keeper").x, extra(next, "keeper").bottom],
      [extra(drain, "keeper").x, extra(drain, "keeper").bottom],
    );
  }
});
test("the morning visit replaces ale with tea and keeps the bag on the same side while lifting", async () => {
  const c = studyCue(id, 15, true);
  assert.ok(c.extras.find((e) => e.name === "患者").chair);
  assert.equal(c.items.filter((i) => i.art === "teacup").length, 1);
  assert.ok(!c.items.some((i) => i.art.includes("ale")));
  const m = JSON.parse(await readFile("public/storybook-study/doctor-bag-v1-metrics.json", "utf8"));
  assert.equal(new Set(m.map((f) => f.scale)).size, 1);
  assert.equal(m[0].height, 94);
  assert.ok(m[1].height < m[0].height * 0.85);
  const out = studyCue(id, 22, true);
  assert.deepEqual(
    [out, ...out.sequence].map((s) => stageExtraFrame(s.extras[0])),
    [8, 9, 10, 11],
  );
});
test("Finn lifts the floor basket through the low hand and retains the smiling carry pose", () => {
  const c = studyCue(id, 6, true),
    low = c.sequence[0],
    upright = c.sequence[1];
  assert.equal(
    actorPose(
      c.actors.find((a) => a.id === "finn"),
      false,
      0,
      true,
    ).frame,
    13,
  );
  near(target(low, c, "return-basket", "finn"), item(c, "return-basket"));
  assert.equal(
    actorPose(
      upright.actors.find((a) => a.id === "finn"),
      false,
      0,
      true,
    ).frame,
    16,
  );
  assert.ok(Number.isFinite(target(upright, c, "return-basket", "finn").bottom));
});
