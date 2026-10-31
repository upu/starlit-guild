import { test } from "node:test";
import assert from "node:assert/strict";
import { afterStagePaint } from "../lib/storybook/stage-paint.ts";

test("a cut is covered until two frames have painted and a cancelled cut cannot reveal", () => {
  let next = 0;
  const frames = new Map();
  const schedule = (callback) => {
    frames.set(++next, callback);
    return next;
  };
  const cancel = (id) => frames.delete(id);
  const paint = () => {
    const queued = [...frames.values()];
    frames.clear();
    for (const callback of queued) callback(0);
  };
  let reveals = 0;
  const stop = afterStagePaint(() => reveals++, schedule, cancel);
  paint();
  assert.equal(reveals, 0);
  stop();
  paint();
  assert.equal(reveals, 0);
  afterStagePaint(() => reveals++, schedule, cancel);
  paint();
  assert.equal(reveals, 0);
  paint();
  assert.equal(reveals, 1);
});
