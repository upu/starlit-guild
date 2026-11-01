import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue, storyStageExitCue } from "../lib/story-stage.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";

const departure = "glowing-moss-trail-next-day-departure",
  returned = "glowing-moss-trail-next-day-return";
test("route notes are held / read, then written in, and stowed before walking", () => {
  for (let i = 0; i < 5; i++) {
    const c = storyStageCue(departure, i),
      a = c.actors.find((a) => a.id === "leon");
    assert.equal(actorPose(a, false, 400, false).frame, 17);
    assert.ok(!c.items.some((i) => i.art === "ledger"));
    assert.ok(!c.extras.length);
  }
  assert.equal(
    storyStageCue(departure, 5).actors.find((a) => a.id === "leon").routeNotes,
    undefined,
  );
  assert.ok(storyStageExitCue(departure).actors.every((a) => a.x > 100));
  const c = storyStageCue(returned, 2),
    a = c.actors.find((a) => a.id === "leon");
  assert.deepEqual(
    [0, 400].map((t) => actorPose(a, false, t, false).frame),
    [17, 18],
  );
  assert.equal(actorPose(a, false, 400, true).frame, 17);
  assert.equal(c.sequence.at(-1).actors.find((a) => a.id === "leon").routeNotes, "read");
});
test("the same driver and cart maintain their hand offset on the lower and upper roads", () => {
  const previous = storyStageCue("glowing-moss-trail-return", 1);
  for (const line of [0, 3, 7, 8]) {
    const c = storyStageCue(returned, line),
      d = c.extras.find((e) => e.id === "worker"),
      cart = c.items.find((i) => i.art === "basket-cart");
    assert.equal(c.cell, previous.cell);
    assert.equal(cart.width, previous.items.find((i) => i.art === "basket-cart").width);
    assert.equal(d.pullCart, true);
    const p = new Map([["extra:worker", d]]),
      at = stageItemTarget(cart, c, p);
    assert.ok(Math.abs(at.bottom - d.bottom - 4.3) < 0.0001);
    assert.ok(Math.abs(at.x - d.x + 17.3) < 0.0001);
  }
});
test("all four use the stairs, and Finn returns down them while the others stay above", () => {
  const c = storyStageCue(returned, 7),
    last = c.sequence.at(-1);
  for (const a of last.actors) {
    assert.ok(a.via.some((p) => p.bottom >= 54));
    assert.ok(a.bottom >= 62);
    assert.equal(a.routeNotes, undefined);
  }
  const upper = storyStageCue(returned, 8);
  assert.equal(upper.background, "brekka-tower-path");
  assert.ok(upper.actors.every((a) => a.bottom >= 62));
  const leave = storyStageCue(returned, 9).sequence.at(-1),
    finn = leave.actors.find((a) => a.id === "finn");
  assert.ok(finn.bottom < 0);
  assert.ok(finn.via.some((p) => p.bottom === 27));
  for (const a of leave.actors.filter((a) => a.id !== "finn")) assert.ok(a.bottom >= 62);
  const next = storyStageCue(returned, 10).actors.find((a) => a.id === "finn");
  assert.deepEqual(next.via, finn.via);
});
