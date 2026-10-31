import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { actorJourney, journeyDuration } from "../lib/story-stage-travel.ts";
const id = "brekka-arrival-return";
const mira = (s) => s.actors.find((a) => a.id === "mira");
const prop = (s, id) => s.items.find((i) => i.id === id);
function held(s, c, name, frame) {
  const a = mira(s),
    p = a.wristPoints[frame];
  return stageItemTarget(
    prop(s, name),
    c,
    new Map([["mira", { ...a, wrist: { x: p[0], y: p[1] } }]]),
  );
}

test("visit atlases retain one body scale, full soles and a genuinely lower seated patient", async () => {
  for (const [name, height, cell, sole] of [
    ["doctor-visit-v1", 94, 128, 120],
    ["patient-visit-v2", 94, 128, 120],
    ["mira-knock-v1", 126, 192, 176],
    ["mira-bag-place-v1", 126, 192, 176],
  ]) {
    const m = JSON.parse(await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"));
    assert.equal(m[0].height, height);
    for (const p of m) {
      assert.equal(p.scale, m[0].scale);
      assert.equal(p.top + p.height, sole);
      assert.ok(p.left > 0 && p.left + p.width < cell);
    }
    if (name === "patient-visit-v2") assert.ok(m.slice(1).every((p) => p.height < height * 0.77));
    if (name === "mira-knock-v1") assert.ok(m.every((p) => Math.abs(p.height - height) <= 2));
    if (name === "mira-bag-place-v1") assert.ok(m[2].height < height * 0.8);
  }
});
test("the seated patient's head stays consistent while his height remains below Mira's standing height", async () => {
  const patient = JSON.parse(
    await readFile("public/storybook-study/patient-visit-v2-metrics.json", "utf8"),
  );
  const mira = JSON.parse(
    await readFile("public/storybook-study/mira-check-v1-metrics.json", "utf8"),
  );
  const { data, info } = await sharp("public/storybook-study/patient-visit-v2.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (x % 128 === 0 || x % 128 === 127 || y === 0 || y === 127)
        assert.ok(data[(y * info.width + x) * 4 + 3] <= 16, "each frame has transparent margins");
  const widths = patient.map((frame, i) => {
    let left = 128,
      right = -1;
    for (let y = frame.top; y < frame.top + 26; y++)
      for (let x = 0; x < 128; x++)
        if (data[(y * info.width + i * 128 + x) * 4 + 3] > 128) {
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
    return right - left + 1;
  });
  assert.ok(Math.max(...widths) - Math.min(...widths) <= 2);
  for (const frame of patient.slice(1))
    assert.ok(frame.height / 128 / (mira[0].height / 192) < 0.86);
});

test("Mira walks around the table and arrives before lifting the patient's cup", () => {
  const c = studyCue(id, 10, true),
    moving = c.sequence.find((s) => s.after === 700),
    lifting = c.sequence.find((s) => s.after === 3000),
    a = mira(moving);
  const path = actorJourney(a, mira(c));
  for (const [i, to] of path.entries()) {
    if (!i) continue;
    const from = path[i - 1];
    for (let n = 0; n <= 20; n++) {
      const x = from.x + ((to.x - from.x) * n) / 20;
      const b = from.bottom + ((to.bottom - from.bottom) * n) / 20;
      assert.ok(!(x > 37 && x < 67 && b > 14 && b < 31));
    }
  }
  assert.ok(journeyDuration(a, mira(c)) < lifting.after - moving.after);
  assert.ok(c.finishBeforeAdvance);
  assert.equal(mira(studyCue(id, 11, true)).x, mira(c.sequence.at(-1)).x);
});

test("the teacup stays at the painted palm and lands close to its near position", () => {
  const c = studyCue(id, 10, true),
    pickup = c.sequence.find((s) => s.after === 3000),
    reach = c.sequence.find((s) => s.after === 4000),
    placed = c.sequence.find((s) => s.after === 4600),
    p = held(pickup, c, "patient-tea", 60),
    r = held(reach, c, "patient-tea", 61);
  assert.ok(Math.abs(p.x - prop(c, "patient-tea").x) < 1.1);
  assert.ok(Math.abs(r.x - prop(placed, "patient-tea").x) < 0.1);
  assert.ok(Math.abs(r.bottom - prop(placed, "patient-tea").bottom) < 1);
  assert.equal(prop(pickup, "patient-tea").width, prop(placed, "patient-tea").width);
  assert.ok(
    Math.abs(prop(placed, "patient-tea").x - c.extras.find((e) => e.id === "keeper").x) < 3,
  );
  assert.ok(journeyDuration(mira(reach), mira(pickup)) < 300);
  const chair = prop(c, "patient-chair"),
    patient = c.extras.find((e) => e.id === "keeper");
  assert.ok(chair.bottom > patient.bottom);
});

test("the bag lands from a low hand before Mira rises and knocks at the next door", () => {
  const c = studyCue(id, 27, true),
    bend = c.sequence.find((s) => s.after === 2000),
    crouch = c.sequence.find((s) => s.after === 2200),
    placed = c.sequence.find((s) => s.after === 2600),
    rising = c.sequence.find((s) => s.after === 3000),
    knock = c.sequence.find((s) => s.after === 3400);
  assert.ok(journeyDuration(mira(c), mira(studyCue(id, 26, true))) < bend.after);
  const p = held(crouch, c, "visit-bag", 13),
    ground = prop(placed, "visit-bag");
  assert.ok(Math.abs(p.x - ground.x) < 0.02 && Math.abs(p.bottom - ground.bottom) < 0.02);
  assert.equal(mira(rising).healing, "rise");
  assert.ok(!mira(knock).healing && mira(knock).knock);
  assert.ok(c.finishBeforeAdvance);
  assert.equal(storybookPresentation(id, "patient-room").mode, "indoor");
  assert.equal(storybookPresentation(id, "brekka-homes").mode, "outdoor");
});
