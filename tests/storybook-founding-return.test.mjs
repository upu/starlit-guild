import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookStageAttributes, storybookPresentation } from "../lib/storybook/presentation.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { stageActorDepth, stageItemDepth, stageItemTarget } from "../lib/story-stage-props.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";
import { itemMotionSignature, itemTransferWidth } from "../lib/story-stage-cargo.ts";
import { storyArt } from "../lib/story-art.ts";

const id = "starlit-guild-founding-return";
const prop = (s, name) => s.items.find((i) => i.id === name || i.art === name);
const actor = (s, id) => s.actors.find((a) => a.id === id);
const at = (c, s, i) =>
  stageItemTarget(i, c, new Map(s.actors.map((a) => [a.id, sampleStageActor(a, a, 0, true)])));
const near = (a, b) =>
  assert.ok(
    Math.abs(a.x - b.x) + Math.abs(a.bottom - b.bottom) < 0.001,
    `${JSON.stringify(a)} != ${JSON.stringify(b)}`,
  );

test("the67 animated lines share body scale and painted carry poses, then retain the existing still", () => {
  for (let line = 0; line < 67; line++) {
    const c = studyCue(id, line, true);
    assert.equal(c.cell, 19);
    assert.equal(c.actors.length, 5);
    assert.equal(storybookStageAttributes(id, line)["data-carry-study"], true);
    assert.equal(storybookPresentation(id, c.background).art, "founding-office-v2");
  }
  assert.equal(storyArt[id].revealAtLine, 67);
  assert.equal(storyArt[id].src, "/stories/guild-formation.webp");
});
test("Mira turns the chair before Leon approaches and the new orientation persists", () => {
  const c = studyCue(id, 50, true);
  const hand = c.sequence.find((s) => actor(s, "mira").visit === "slide");
  const rotated = c.sequence.find((s) => prop(s, "representative-chair")?.turn === 180);
  const leaving = c.sequence.find((s) => actor(s, "mira").x === 51);
  const approaching = c.sequence.find((s) => actor(s, "leon").via?.length === 2);
  assert.ok(hand && rotated && leaving && approaching);
  assert.ok(
    hand.after < rotated.after &&
      rotated.after < leaving.after &&
      leaving.after < approaching.after,
  );
  const mira = actor(hand, "mira"),
    pose = sampleStageActor(mira, mira, 0, true);
  const chair = prop(hand, "representative-chair");
  const handX = mira.x + ((pose.wrist.x - 64) * c.cell) / 128;
  assert.equal(mira.reachOver, "representative-chair");
  assert.ok(Math.abs(handX - chair.x) < chair.width / 2, "the hand reaches the chair");
  assert.equal(prop(c.sequence.at(-1), "representative-chair").turn, 180);
  for (let line = 51; line <= 66; line++)
    assert.equal(prop(studyCue(id, line, true), "representative-chair").turn, 180);
});
test("Finn's name stays above him throughout the seat handover behind Lico", () => {
  const cue = studyCue(id, 42, true);
  for (const moment of [cue, ...(cue.sequence ?? [])]) {
    assert.equal(actor(moment, "finn").nameAbove, true);
  }
  assert.notEqual(actor(studyCue(id, 43, true), "finn").nameAbove, true);
});
test("Leon walks around Mira before signing and reaches the desk before the writing pose", () => {
  const prior = studyCue(id, 63, true);
  const signing = studyCue(id, 64, true);
  const startLeon = actor(signing, "leon"),
    startMira = actor(prior, "mira");
  const movement = signing.sequence.find((step) => actor(step, "leon").via?.length === 2);
  const leon = actor(movement, "leon"),
    mira = actor(signing, "mira");
  const duration = journeyDuration(leon, startLeon);
  const nextPose = signing.sequence.find(
    (step) => actor(step, "leon").writing && !actor(step, "leon").via,
  );
  assert.ok(
    duration > 1000 && nextPose && duration + movement.after < nextPose.after,
    "Leon arrives before writing",
  );
  for (let time = 0; time <= duration; time += 50) {
    const l = sampleJourney(leon, startLeon, time, false);
    const m = sampleJourney(mira, startMira, time + movement.after, false);
    const separation = Math.hypot(l.x - m.x, ((l.bottom - m.bottom) * 2) / 3);
    assert.ok(separation > (Math.abs(l.x - m.x) < 8 ? 15 : 10), `overlap at ${time}ms`);
  }
});
test("the sheet stays on the desk, meets Leon's hand, then travels with him until writing", () => {
  const prior = studyCue(id, 63, true);
  const cue = studyCue(id, 64, true);
  const desk = prop(cue, "ledger");
  assert.equal(desk.support, "table");
  near(at(prior, prior, prop(prior, "ledger")), at(cue, cue, desk));
  const reach = cue.sequence.find(
    (step) => actor(step, "leon").seatedPaper === "reach" && !prop(step, "ledger").actor,
  );
  const pickup = cue.sequence.find(
    (step) => actor(step, "leon").seatedPaper === "reach" && prop(step, "ledger").actor === "leon",
  );
  assert.ok(reach && pickup && reach.after < pickup.after);
  const from = at(cue, reach, prop(reach, "ledger"));
  const to = at(cue, pickup, prop(pickup, "ledger"));
  assert.ok(
    Math.hypot(from.x - to.x, from.bottom - to.bottom) < 1.3,
    "paper moves from the desk to the reaching hand",
  );
  assert.equal(prop(pickup, "ledger").wristAnchor, "bottom");
  assert.equal(itemTransferWidth(prop(pickup, "ledger"), desk.width, 0, false), desk.width);
  assert.ok(itemTransferWidth(prop(pickup, "ledger"), desk.width, 325, false) < desk.width);
  assert.equal(itemTransferWidth(prop(pickup, "ledger"), desk.width, 650, false), 3.5);
  assert.equal(itemTransferWidth(prop(pickup, "ledger"), desk.width, 0, true), 3.5);
  const walking = cue.sequence.find((step) => actor(step, "leon").via?.length === 2);
  assert.ok(walking.after >= pickup.after + 650, "pickup finishes before walking");
  assert.equal(actor(walking, "leon").holdingWalk, true);
  assert.equal(prop(walking, "ledger").actor, "leon");
  assert.deepEqual(prop(walking, "ledger").embeddedFrames, [17, 18]);
  for (const step of cue.sequence)
    assert.equal(step.items.filter((item) => item.id === "ledger").length, 1);
});
test("Aria's supporting palm and Lico's receiving palm meet the same tabletop vessel base", () => {
  const c = studyCue(id, 16, true),
    initial = prop(c, "sample-dish");
  const placed = c.sequence.find(
    (s) => prop(s, "sample-dish")?.support === "table" && !prop(s, "sample-dish")?.actor,
  );
  const bowl = prop(placed, "sample-dish");
  near(at(c, c, initial), bowl);
  const l = studyCue(id, 18, true),
    received = l.sequence.find((s) => prop(s, "sample-dish")?.actor === "lico");
  near(at(l, received, prop(received, "sample-dish")), bowl);
});
test("the label writing has a registered pencil point at the front tag of the stationary bowl", () => {
  const c = studyCue(id, 21, true),
    writing = c.sequence.find((s) => actor(s, "lico").mossStudy === "write");
  const a = actor(writing, "lico"),
    pose = sampleStageActor(a, a, 0, true),
    bowl = prop(writing, "sample-dish");
  assert.ok([69, 70].includes(pose.frame));
  const pencil = {
    x: a.x - ((pose.wrist.x - 64) * c.cell) / 128,
    bottom: a.bottom + (((128 - pose.wrist.y) * c.cell) / 128) * 1.5,
  };
  near(pencil, { x: bowl.x, bottom: bowl.bottom + 1.4 });
});
test("all five paper handoffs keep one shared sheet position before and after ownership changes", () => {
  const c = studyCue(id, 35, true);
  let previous;
  const owners = [];
  for (const s of c.sequence) {
    const p = prop(s, "ledger");
    if (!p?.actor) continue;
    if (previous && previous.p.actor !== p.actor) {
      near(at(c, previous.s, previous.p), at(c, s, p));
      owners.push(p.actor);
    }
    previous = { s, p };
  }
  assert.deepEqual(owners, ["leon", "mira", "finn", "lico", "leon"]);
});
test("Leon places the sheet beside the desk leg, then slides it into the narrated center", () => {
  const c = studyCue(id, 35, true),
    held = c.sequence.find((s) => s.after === 12500),
    placed = c.sequence.find((s) => s.after === 17200);
  const p = prop(placed, "ledger");
  near(at(c, held, prop(held, "ledger")), p);
  assert.equal(p.x, 37);
  assert.ok(actor(held, "leon").x < 34);
  assert.equal(
    prop(
      c.sequence.find((s) => s.after === 17700),
      "ledger",
    ).x,
    50,
  );
  assert.equal(prop(studyCue(id, 36, true), "ledger").x, 50);
});
test("the return route passes below the group and reaches the left desk edge before releasing", () => {
  const c = studyCue(id, 35, true);
  const start = actor(
    c.sequence.find((s) => s.after === 11700),
    "leon",
  );
  const s = c.sequence.find((s) => s.after === 12500);
  const a = actor(s, "leon");
  assert.ok(journeyDuration(a, start) < 4700);
  for (let t = 0; t <= journeyDuration(a, start); t += 50) {
    const at = sampleJourney(a, start, t, false);
    for (const id of ["aria", "mira", "finn", "lico"]) {
      const other = actor(s, id);
      assert.ok(Math.hypot(at.x - other.x, ((at.bottom - other.bottom) * 2) / 3) > 10);
    }
  }
  const p = new Map([["leon", { ...a, x: a.x - 2 }]]);
  const table = prop(s, "table");
  assert.ok(
    stageActorDepth(a, p.get("leon"), { ...c, ...s }, p) > stageItemDepth(table, { ...c, ...s }, p),
  );
});
test("a deliberate regrip eases the same item without detaching it on ordinary rotation", () => {
  const p = {
    id: "ledger",
    art: "paper",
    actor: "finn",
    x: 0,
    bottom: 0,
    wrist: true,
    grip: "receiving",
  };
  assert.notEqual(itemMotionSignature(p), itemMotionSignature({ ...p, grip: "offering" }));
  assert.equal(itemMotionSignature(p), itemMotionSignature({ ...p, tilt: 15 }));
});
test("the signed sheet stays small and attached to Leon's hand until the still illustration", () => {
  for (const line of [65, 66]) {
    const cue = studyCue(id, line, true);
    const sheet = prop(cue, "ledger");
    assert.equal(sheet.actor, "leon");
    assert.equal(sheet.wrist, true);
    assert.equal(sheet.width, 3.5);
    assert.ok(sheet.width < (cue.cell ?? 19) / 4);
  }
});
test("new research poses retain one body scale and uncut feet", async () => {
  const metrics = JSON.parse(
    await readFile("public/storybook-study/lico-label-v1-metrics.json", "utf8"),
  );
  assert.equal(new Set(metrics.map((m) => m.scale)).size, 1);
  assert.ok(
    metrics.every((m) => m.baseline === 176 && m.top >= 4 && m.left >= 2 && m.left + m.width < 190),
  );
});
test("the specimen's painted base reaches the registered palm without a large transparent gutter", async () => {
  const { data, info } = await sharp("public/storybook-study/founding-moss-bowl-v1.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let bottom = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 128) bottom = y;
  assert.ok(info.height - bottom < 15);
});
