import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageItemTarget, stageItemVisible } from "../lib/story-stage-props.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";
const id = "brekka-moss-beds-return";
const actor = (s, id) => s.actors.find((a) => a.id === id);
const item = (s, id) => s.items.find((i) => i.id === id);
function held(s, c, name, who, frame) {
  const a = actor(s, who),
    p = a.wristPoints[frame];
  return stageItemTarget(item(s, name), c, new Map([[who, { ...a, wrist: { x: p[0], y: p[1] } }]]));
}
test("field study uses one standing calibration and lower crouching/rest poses with full soles", async () => {
  for (const [name, height] of [
    ["lico-moss-study-v1", 128],
    ["lico-notebook-walk-v2", 128],
    ["mira-moss-care-v1", 126],
  ]) {
    const m = JSON.parse(await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"));
    assert.equal(m[0].height, height);
    for (const p of m) {
      assert.equal(p.scale, m[0].scale);
      assert.equal(p.top + p.height, 176);
      assert.ok(p.left > 0 && p.left + p.width < 192 && p.top > 0);
    }
    if (name === "lico-moss-study-v1") {
      assert.ok(m[9].height < height * 0.8);
      assert.ok(m[11].height < height * 0.9);
    }
    if (name === "mira-moss-care-v1") assert.ok(m[6].height < height * 0.9);
  }
});
test("moving with the notebook retains it in all walking frames without replacing the stationary action", () => {
  const c = studyCue(id, 15, true),
    a = actor(c, "lico"),
    ledger = item(c, "ledger");
  const frames = [0, 130, 260, 390].map((t) => actorPose(a, true, t, false).frame);
  assert.equal(new Set(frames).size, 4);
  for (const frame of frames)
    assert.equal(
      stageItemVisible(ledger, new Map([["lico", { atlas: "conversation", frame }]])),
      false,
    );
  assert.equal(actorPose(a, false, 0, false).frame, 71);
  assert.equal(actorPose({ ...a, holdingWalk: false }, true, 0, false).atlas, "home");
  assert.ok(c.finishBeforeAdvance);
});
test("the low stool remains visible behind the painted sitter and resting hands keep the ledger", () => {
  const c = studyCue(id, 45, true),
    seated = c.sequence.find((s) => s.after === 6000),
    a = actor(seated, "lico");
  const frame = actorPose(a, false, 0, false).frame;
  assert.equal(frame, 43);
  assert.equal(item(seated, "lico-stool").seatFor, undefined);
  assert.equal(
    stageItemVisible(
      item(seated, "ledger"),
      new Map([["lico", { atlas: "conversation", frame, wrist: { x: 82, y: 100 } }]]),
    ),
    true,
  );
  assert.ok(
    journeyDuration(
      actor(
        c.sequence.find((s) => s.after === 3000),
        "lico",
      ),
      actor(
        c.sequence.find((s) => s.after === 2200),
        "lico",
      ),
    ) < 3000,
  );
});
test("both handovers arrive before ownership changes and register the same contact point", () => {
  const c = studyCue(id, 50, true),
    first = c.sequence.find((s) => s.after === 3000),
    second = c.sequence.find((s) => s.after === 3600),
    bag = c.sequence.find((s) => s.after === 5200);
  const l = held(c, c, "ledger", "lico", 41),
    ar = stageItemTarget(
      item(first, "ledger"),
      c,
      new Map([["aria", { ...actor(first, "aria"), wrist: { x: 83, y: 65 } }]]),
    );
  assert.ok(Math.abs(l.x - ar.x) < 0.01 && Math.abs(l.bottom - ar.bottom) < 0.01);
  const m = held(second, c, "medicine", "mira", 43),
    arBag = held(bag, c, "medicine", "aria", 14);
  assert.ok(Math.abs(m.x - arBag.x) < 0.01 && Math.abs(m.bottom - arBag.bottom) < 0.01);
  assert.ok(journeyDuration(actor(second, "aria"), actor(first, "aria")) < 1600);
  assert.ok(c.finishBeforeAdvance);
  const end = c.sequence.at(-1);
  for (const name of ["medicine", "ledger"]) assert.equal(item(end, name).actor, undefined);
});
