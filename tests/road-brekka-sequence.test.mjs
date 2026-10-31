import { test } from "node:test";
import assert from "node:assert/strict";
import { BrekkaLedgerSequence } from "../lib/road-brekka-sequence.ts";

const input = (time, extra = {}) => ({
  node: 0,
  completed: false,
  working: true,
  fighting: false,
  paused: false,
  available: true,
  reduced: false,
  skip: false,
  time,
  ...extra,
});

for (const reduced of [false, true])
  test(`rapid work keeps each record check in order, reduced=${reduced}`, () => {
    const sequence = new BrekkaLedgerSequence(),
      checks = new Set(),
      shown = new Set();
    let doneAt;
    for (let time = 0; time < 30000; time += 50) {
      const node = Math.min(14, Math.floor(time / 100));
      const result = sequence.update(input(time, { node, completed: time >= 1450, reduced }));
      if (result.showLedger) shown.add(result.node);
      if (result.phase === "work") {
        checks.add(result.node);
        sequence.inspected(time);
      }
      if (result.complete) {
        doneAt = time;
        break;
      }
    }
    assert.deepEqual([...checks], [2, 5, 8, 11, 14]);
    assert.deepEqual([...shown], [2, 5, 8, 11, 14]);
    assert.ok(doneAt > 1450 && doneAt < 30000);
  });

test("battle interrupts the records and the investigation resumes after combat", () => {
  const sequence = new BrekkaLedgerSequence();
  sequence.update(input(0, { node: 2 }));
  sequence.update(input(700, { node: 2 }));
  sequence.inspected(700);
  const interrupted = sequence.update(input(900, { node: 2, fighting: true }));
  assert.equal(interrupted.showLedger, false);
  assert.equal(interrupted.complete, false);
  sequence.update(input(9000, { node: 5, fighting: true }));
  const resume = sequence.update(input(9050, { node: 5 }));
  assert.equal(resume.phase, "enter");
  assert.equal(resume.node, 2);
  assert.equal(resume.fade, 0);
  assert.equal(resume.showLedger, false);
});

test("a pause holds the current picture, and unavailable Finn cannot hold completion forever", () => {
  const sequence = new BrekkaLedgerSequence();
  sequence.update(input(0, { node: 14 }));
  const during = sequence.update(input(400, { node: 14 }));
  const paused = sequence.update(input(5000, { node: 14, paused: true }));
  assert.equal(paused.phase, during.phase);
  assert.equal(paused.fade, during.fade);
  assert.equal(paused.showLedger, during.showLedger);
  let result;
  for (let time = 5050; time < 9000; time += 50) {
    result = sequence.update(input(time, { node: 14, completed: true, available: false }));
    if (result.complete) break;
  }
  assert.equal(result.complete, true);
});

test("explicit skip releases all queued visual work", () => {
  const sequence = new BrekkaLedgerSequence();
  sequence.update(input(0));
  sequence.update(input(100, { node: 14, completed: true }));
  const skipped = sequence.update(input(150, { node: 14, completed: true, skip: true }));
  assert.equal(skipped.complete, true);
  assert.equal(skipped.showLedger, false);
});

test("the investigation does not begin while the party is still travelling", () => {
  const sequence = new BrekkaLedgerSequence();
  for (let time = 0; time <= 5000; time += 100)
    assert.equal(sequence.update(input(time, { node: 14, working: false })).showLedger, false);
  const started = sequence.update(input(5100, { node: 14, working: true }));
  assert.equal(started.phase, "enter");
  assert.equal(started.node, 14);
});
