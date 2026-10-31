import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { stageItemTarget, stageItemDepth } from "../lib/story-stage-props.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";
import { stageWrist } from "../lib/story-stage-wrists.ts";

const dep = "lico-records-departure",
  ret = "lico-records-return";
const item = (s, id) => s.items.find((i) => i.id === id);
const actor = (s, id) => s.actors.find((a) => a.id === id);
function grip(s, cue, id, who, frame) {
  const a = actor(s, who),
    p = a.wristPoints?.[frame],
    wrist = p ? { x: p[0], y: p[1] } : stageWrist(who, "conversation", frame);
  return stageItemTarget(item(s, id), cue, new Map([[who, { ...a, wrist }]]));
}
function same(a, b) {
  assert.ok(Math.abs(a.x - b.x) < 0.001, `x: ${a.x}, ${b.x}`);
  assert.ok(Math.abs(a.bottom - b.bottom) < 0.001, `bottom: ${a.bottom}, ${b.bottom}`);
}
test("seated field poses stay low at one body scale and apparatus states keep a common scale", async () => {
  const m = JSON.parse(
    await readFile("public/storybook-study/lico-field-records-ponytail-v1-metrics.json", "utf8"),
  );
  assert.equal(m[0].height, 128);
  for (const [i, p] of m.entries()) {
    assert.equal(p.scale, m[0].scale);
    assert.equal(p.top + p.height, 176);
    assert.ok(p.left > 0 && p.left + p.width < 192);
    if ([1, 2, 3, 4, 7].includes(i)) assert.ok(p.height < 128 * 0.85);
  }
  const d = JSON.parse(
    await readFile("public/storybook-study/field-reflector-v1-metrics.json", "utf8"),
  );
  assert.equal(new Set(d.map((p) => p.scale)).size, 1);
  assert.ok(d[2].height < d[1].height * 0.7);
  assert.ok(Math.abs(d[0].width - d[2].width) < d[0].width * 0.03);
});
test("the keeper and Leon hand the record into Lico's actual free palm", () => {
  const c = studyCue(dep, 36, true),
    to = c.sequence.find((s) => s.after === 1400),
    e = c.extras[0],
    wr = e.wristPoints[15];
  const from = stageItemTarget(
    item(c, "records"),
    c,
    new Map([["extra:keeper", { ...e, wrist: { x: wr[0], y: wr[1] } }]]),
  );
  same(from, grip(to, c, "records", "lico", 76));
  const r = studyCue(ret, 0, true),
    picked = r.sequence.find((s) => s.after === 800),
    given = r.sequence.find((s) => s.after === 1700);
  same(grip(picked, r, "records", "leon", 4), grip(given, r, "records", "lico", 79));
});
test("the dry board reaches the same hands and two open books remain supported separately", () => {
  const c = studyCue(ret, 8, true),
    giving = c.sequence.find((s) => s.after === 3800),
    received = c.sequence.find((s) => s.after === 4600),
    read = c.sequence.find((s) => s.after === 5200);
  const pickup = c.sequence.find((s) => s.after === 3200);
  same(item(c, "lap-board"), grip(pickup, c, "lap-board", "aria", 13));
  same(grip(giving, c, "lap-board", "aria", 4), grip(received, c, "lap-board", "lico", 76));
  assert.ok(journeyDuration(actor(giving, "aria"), actor(c, "aria")) < 800);
  const a = item(read, "lico-book"),
    b = item(read, "records"),
    board = item(read, "lap-board");
  assert.equal(a.art, "ledger");
  assert.equal(b.art, "ledger");
  assert.equal(a.carrier, board.id);
  assert.equal(b.carrier, board.id);
  assert.ok(Math.abs(a.x - b.x) > (a.width + b.width) / 2);
  const positions = new Map([["item:lap-board", { x: 60, bottom: 12, depth: 89 }]]);
  assert.ok(stageItemDepth(a, c, positions) > 89);
  const later = studyCue(ret, 20, true);
  assert.equal(item(later, "records").art, "ledger");
  assert.ok(item(later, "lico-book").x < item(read, "lico-book").x);
  assert.equal(item(studyCue(ret, 21, true), "lico-book").x, item(later, "lico-book").x);
});
test("the cover lifts only after arrival and the notebook remains on the stool", () => {
  const c = studyCue(dep, 42, true),
    lift = c.sequence.find((s) => s.items.some((i) => i.id === "reflector-cover" && i.actor)),
    l = actor(c, "lico");
  assert.ok(lift.after > journeyDuration(l, { x: 70, bottom: 12 }));
  assert.equal(item(c, "lico-book").actor, undefined);
  assert.equal(item(c, "lico-book").support, "lico-stool");
  assert.equal(item(lift, "lico-book").support, "lico-stool");
  assert.equal(item(c, "reflector").art, "reflector-covered");
  assert.equal(item(lift, "reflector").art, "reflector");
  const cloth = grip(lift, c, "reflector-cover", "lico", 15);
  assert.ok(cloth.bottom + (12 * 1.5 * 8) / 256 > actor(lift, "lico").bottom + 2.25);
  assert.ok(c.finishBeforeAdvance);
  const end = c.sequence.at(-1);
  assert.ok(Math.abs(actor(end, "lico").x - actor(end, "leon").x) >= 12);
});
test("the first seedling enters the basket without moving the grip or changing size", () => {
  const c = studyCue(ret, 27, true),
    held = c.sequence.find((s) => s.after === 1300),
    placed = c.sequence.find((s) => s.after === 2000);
  assert.equal(item(c, "lap-board").actor, undefined);
  assert.equal(item(placed, "records").carrier, "lap-board");
  const a = actor(placed, "aria"),
    wp = a.wristPoints[14],
    basket = stageItemTarget(
      item(placed, "basket"),
      c,
      new Map([["aria", { ...a, wrist: { x: wp[0], y: wp[1] } }]]),
    );
  const final = stageItemTarget(
    item(placed, "first-seedling"),
    c,
    new Map([["item:basket", basket]]),
  );
  same(grip(held, c, "first-seedling", "lico", 79), final);
  assert.equal(item(held, "first-seedling").width, item(placed, "first-seedling").width);
});
test("field routes leave space around other feet and keep the front path inside the mobile frame", () => {
  for (const line of [9, 13, 20, 25]) {
    const a = actor(studyCue(ret, line, true), "aria");
    assert.equal(a.via, undefined, "the board return must not restart on a later line");
    assert.equal(a.x, 28);
    assert.equal(a.bottom, 38);
  }
  for (const line of [27, 28, 30]) {
    const a = actor(studyCue(ret, line, true), "aria");
    assert.equal(a.via, undefined, "the completed basket route must not restart on the next line");
  }
  const cover = studyCue(dep, 42, true),
    walker = actor(cover, "lico");
  clearRoute(
    walker,
    actor(studyCue(dep, 41, true), "lico"),
    cover.actors.filter((a) => a.id !== "lico"),
  );
  const board = studyCue(ret, 8, true),
    previous = studyCue(ret, 7, true),
    aria = actor(board, "aria");
  clearRoute(
    aria,
    actor(previous, "aria"),
    board.actors.filter((a) => a.id !== "aria"),
    10,
  );
  const moments = [board, ...board.sequence];
  const last = moments.at(-1),
    prior = moments.at(-2);
  const returning = actor(last, "aria");
  clearRoute(
    returning,
    actor(prior, "aria"),
    last.actors.filter((a) => a.id !== "aria"),
  );
  clearRoute(
    returning,
    actor(prior, "aria"),
    last.actors.filter((a) => !["aria", "lico"].includes(a.id)),
    10,
  );
  assert.ok(journeyDuration(returning, actor(prior, "aria")) < 2400);
  const basket = studyCue(ret, 26, true),
    carried = basket.sequence.at(-1);
  clearRoute(
    actor(carried, "aria"),
    actor(basket, "aria"),
    carried.actors.filter((a) => a.id !== "aria"),
  );
  for (const s of [...moments, basket, ...basket.sequence]) {
    const a = actor(s, "aria");
    assert.ok((a.via ?? []).every((p) => p.bottom >= 6));
  }
  const record = studyCue(dep, 36, true),
    keeper = record.sequence.at(-1).extras[0];
  clearRoute(keeper, record.extras[0], record.actors);
  for (const line of [8, 13, 26, 27]) {
    const c = studyCue(ret, line, true);
    for (const s of [c, ...(c.sequence ?? [])])
      for (const a of s.actors) assert.ok((a.via ?? []).every((p) => p.bottom >= -16));
  }
});
function clearRoute(walker, origin, others, clearance = 4) {
  const end = journeyDuration(walker, origin);
  for (let elapsed = 0; elapsed <= end; elapsed += 40) {
    const p = sampleJourney(walker, origin, elapsed, false);
    for (const other of others)
      assert.ok(
        Math.hypot(p.x - other.x, ((p.bottom - other.bottom) * 2) / 3) > clearance,
        `${walker.id} crosses ${other.id}`,
      );
  }
}
