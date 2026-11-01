import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue } from "../lib/story-stage.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageWrist } from "../lib/story-stage-wrists.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";

test("Lico closes the existing travel bag before standing up, with no embedded second bag", () => {
  const cue = storyStageCue("starlit-guild-founding-departure", 8);
  const lico = cue.actors.find((a) => a.id === "lico");
  assert.equal(cue.finishBeforeAdvance, true);
  assert.equal(lico.mossStudy, "spread");
  assert.equal(actorPose(lico, false, 0, false).frame, 86);
  assert.equal(actorPose(lico, false, 450, false).frame, 87);
  const bags = cue.items.filter((p) => p.art === "tool-rucksack");
  assert.equal(bags.length, 1);
  assert.equal(bags[0].id, "lico-travel-bag");
  assert.equal(bags[0].width, 6);
  assert.ok(cue.sequence[0].after >= 1500);
  assert.equal(cue.sequence[0].actors.find((a) => a.id === "lico").mossStudy, undefined);
});

test("Lico and Aria take separate places beside the roadside stone without growing", () => {
  const before = storyStageCue("starlit-guild-founding-departure", 37);
  const lico = storyStageCue("starlit-guild-founding-departure", 38);
  const aria = storyStageCue("starlit-guild-founding-departure", 40);
  for (const cue of [lico, aria]) {
    assert.equal(cue.finishBeforeAdvance, true);
    assert.equal(cue.cell, before.cell);
    assert.equal(cue.cameraScale, before.cameraScale);
    assert.ok(cue.items.some((p) => p.id === "return-cart"));
  }
  const l = lico.actors.find((a) => a.id === "lico");
  const a = aria.actors.find((a) => a.id === "aria");
  assert.ok(
    journeyDuration(
      l,
      before.actors.find((a) => a.id === "lico"),
    ) > 300,
  );
  assert.ok(
    journeyDuration(
      a,
      lico.actors.find((a) => a.id === "aria"),
    ) > 300,
  );
  assert.equal(l.inspect, true);
  assert.equal(a.inspect, true);
  assert.ok(Math.abs(l.bottom - a.bottom) >= 16);
  assert.ok(a.via.every((p) => p.bottom < l.bottom - 12));
});

test("Lico's luggage is lifted by its handle, lowered, and remains present for departure", () => {
  const id = "lico-travel-bag";
  const cue = storyStageCue("starlit-guild-founding-departure", 18);
  const floor = cue.items.find((p) => p.id === id);
  const lift = cue.sequence.find((s) => s.items?.some((p) => p.id === id && p.wrist));
  const lower = cue.sequence.find(
    (s) => s.after > lift.after && s.items?.some((p) => p.id === id && !p.actor),
  );
  const bag = lift.items.find((p) => p.id === id);
  const actor = lift.actors.find((a) => a.id === "lico");
  const pose = actorPose(actor, false, 0, false);
  const position = { ...actor, ...pose, wrist: stageWrist(actor.id, pose.atlas, pose.frame) };
  assert.ok(position.wrist);
  const hand = stageItemTarget(bag, cue, new Map([[actor.id, position]]));
  assert.equal(bag.wristAnchor, "top");
  assert.ok(Math.abs(hand.x - floor.x) < 0.01, "lift above the same ground position");
  assert.ok(
    hand.bottom > floor.bottom && hand.bottom - floor.bottom < 12,
    "a short lift, not a jump",
  );
  assert.ok(lower.after - lift.after >= 650, "allow the bag to reach the hand before lowering");
  assert.equal(cue.finishBeforeAdvance, true);
  for (let line = 0; line < 42; line++) {
    const bags = storyStageCue("starlit-guild-founding-departure", line).items.filter(
      (p) => p.id === id,
    );
    assert.equal(bags.length, 1);
    assert.equal(bags[0].width, floor.width);
    if (line >= 37) assert.equal(bags[0].actor, "lico");
  }
  const road = storyStageCue("starlit-guild-founding-departure", 37);
  for (const id of ["return-basket", "return-letters"]) {
    const cargo = road.items.find((p) => p.id === id);
    assert.equal(cargo.carrier, "return-cart");
    assert.equal(cargo.actor, undefined);
    assert.ok(road.items.some((p) => p.id === cargo.carrier));
  }
});

test("the comparison jar changes hands after Aria arrives, then is wrapped and stored", () => {
  const before = storyStageCue("starlit-guild-founding-departure", 26);
  const cue = storyStageCue("starlit-guild-founding-departure", 27);
  const jar = (items) => items.find((p) => p.id === "comparison-jar");
  const transfer = cue.sequence.find((s) => jar(s.items)?.actor === "aria");
  const aria = cue.actors.find((a) => a.id === "aria");
  assert.ok(
    transfer.after >
      journeyDuration(
        aria,
        before.actors.find((a) => a.id === "aria"),
      ),
  );
  const positions = new Map(
    cue.actors.map((a) => {
      const pose = actorPose(a, false, 0, false);
      return [a.id, { ...a, ...pose, wrist: stageWrist(a.id, pose.atlas, pose.frame) }];
    }),
  );
  const a = stageItemTarget(jar(cue.items), cue, positions);
  const b = stageItemTarget(jar(transfer.items), cue, positions);
  assert.ok(Math.hypot(a.x - b.x, a.bottom - b.bottom) < 0.1);
  const wrapped = cue.sequence.find((s) => jar(s.items)?.art === "packing-cloth");
  const stored = cue.sequence.find((s) => jar(s.items)?.stored);
  assert.ok(transfer.after < wrapped.after && wrapped.after < stored.after);
  assert.equal(jar(cue.items).width, jar(stored.items).width);
  assert.equal(cue.finishBeforeAdvance, true);
  for (let line = 28; line <= 41; line++) {
    const items = storyStageCue("starlit-guild-founding-departure", line).items;
    assert.equal(jar(items).stored, true);
    assert.ok(items.some((p) => p.id === jar(items).carrier));
  }
});
