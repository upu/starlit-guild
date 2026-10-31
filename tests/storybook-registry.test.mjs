import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { journeyDuration, actorJourney } from "../lib/story-stage-travel.ts";
import {
  stageItemTarget,
  stageItemVisible,
  stageItemDepth,
  stageActorDepth,
} from "../lib/story-stage-props.ts";
import { storybookPresentation, storybookStageAttributes } from "../lib/storybook/presentation.ts";
const id = "lico-records-departure",
  actor = (s) => s.actors.find((a) => a.id === "finn"),
  prop = (s, id) => s.items.find((i) => i.id === id);
function handTarget(s, c, frame) {
  const a = actor(s),
    p = a.wristPoints[frame];
  return stageItemTarget(
    prop(s, "orders"),
    c,
    new Map([["finn", { ...a, wrist: { x: p[0], y: p[1] } }]]),
  );
}
test("registry seats preserve calibrated bodies and complete boots", async () => {
  for (const who of ["keeper", "merchant"]) {
    const m = JSON.parse(
      await readFile(`public/storybook-study/${who}-registry-v1-metrics.json`, "utf8"),
    );
    assert.equal(m[0].height, 94);
    for (const [i, p] of m.entries()) {
      assert.equal(p.scale, m[0].scale);
      assert.equal(p.top + p.height, 120);
      assert.ok(p.left > 0 && p.left + p.width < 128);
      if (i) assert.ok(p.height < 94 * 0.9);
    }
  }
});
test("Finn reaches the clear table corner before releasing the order slip", () => {
  const c = studyCue(id, 6, true),
    held = c.sequence.find((s) => s.after === 1300),
    placed = c.sequence.find((s) => s.after === 1800),
    p = handTarget(held, c, 16),
    q = prop(placed, "orders");
  assert.ok(journeyDuration(actor(c), actor(studyCue(id, 5, true))) < 1300);
  assert.equal(actorPose(actor(held), false, 0, false).frame, 16);
  assert.ok(Math.abs(p.x - q.x) < 0.001 && Math.abs(p.bottom - q.bottom) < 0.001);
  for (const p of actorJourney(actor(c), actor(studyCue(id, 5, true)))) assert.ok(p.x > 71);
  assert.equal(q.pitch, 55);
  const grip = actor(held);
  assert.equal(grip.reachOver, "table");
  assert.ok(
    stageItemDepth(prop(held, "orders"), c, new Map([["finn", grip]])) >
      stageActorDepth(grip, grip, c, new Map([["finn", grip]])),
  );
  assert.ok(
    stageItemDepth(prop(held, "orders"), c, new Map([["finn", grip]])) >
      stageItemDepth(prop(c, "table"), c, new Map()),
  );
  assert.ok(c.finishBeforeAdvance);
});
test("the original is lifted after arrival and Finn holds it until the merchant receives it", () => {
  const c = studyCue(id, 31, true),
    before = c.sequence.find((s) => s.after === 2800),
    picked = c.sequence.find((s) => s.after === 3500),
    reach = c.sequence.find((s) => s.after === 4100),
    received = c.sequence.find((s) => s.after === 4400);
  assert.equal(prop(before, "orders").actor, undefined);
  assert.ok(journeyDuration(actor(before), actor(c.sequence.find((s) => s.after === 2200))) < 700);
  assert.ok(actor(reach).carry);
  const p = handTarget(picked, c, 15),
    e = received.extras.find((e) => e.id === "merchant"),
    wr = e.wristPoints[16],
    q = stageItemTarget(
      prop(received, "orders"),
      c,
      new Map([["extra:merchant", { ...e, wrist: { x: wr[0], y: wr[1] } }]]),
    );
  assert.ok(Math.abs(p.x - q.x) < 0.001 && Math.abs(p.bottom - q.bottom) < 0.001);
  const count = c.sequence.find((s) => s.after === 4900);
  assert.equal(
    stageItemVisible(
      prop(count, "orders"),
      new Map([["extra:merchant", { atlas: "conversation", frame: 17 }]]),
    ),
    false,
  );
  assert.equal(prop(c.sequence.at(-1), "orders"), undefined);
});
test("the written copy stays separate from the keeper's record and field cues retain their own staging", () => {
  const c = studyCue(id, 31, true).sequence.at(-1),
    a = prop(c, "records"),
    b = prop(c, "order-copy");
  assert.ok(Math.abs(a.x - b.x) > (a.width + b.width) / 2);
  assert.equal(storybookPresentation(id, "registry").art, "tower-registry-v1");
  assert.equal(storybookPresentation(id, "moss-beds").art, "moss-beds-v1");
  assert.equal(storybookStageAttributes(id, 31)["data-paper-study"], true);
  assert.equal(storybookStageAttributes(id, 32)["data-paper-study"], true);
  assert.equal(
    studyCue(id, 32, true).items.some((i) => i.id === "registry-keeper-chair"),
    false,
  );
});
