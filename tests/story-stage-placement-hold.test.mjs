import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleStageActor } from "../lib/story-stage.ts";
import { boxTransferDuration, transferBox } from "../lib/story-stage-props.ts";

test("placement supports the parcel after landing, then releases without moving the feet", () => {
  const actor = {
    id: "aria",
    x: 30,
    bottom: 14,
    left: false,
    place: true,
    placeHoldMs: 200,
    pose: "offer",
  };
  const origin = { x: 30, bottom: 14 };
  const target = { x: 39, bottom: 27 };
  for (const elapsed of [boxTransferDuration, boxTransferDuration + 199]) {
    assert.deepEqual(transferBox({ x: 33, bottom: 31.5 }, target, elapsed), target);
    const sample = sampleStageActor(actor, origin, elapsed);
    assert.equal(sample.frame, 8, "hands remain under the landed box");
    assert.equal(sample.x, origin.x);
    assert.equal(sample.bottom, origin.bottom);
  }
  assert.equal(sampleStageActor(actor, origin, boxTransferDuration + 200).frame, 4);
  assert.equal(sampleStageActor(actor, origin, 0, true).frame, 4, "reduced motion skips the hold");
  assert.equal(
    sampleStageActor({ ...actor, placeHoldMs: undefined }, origin, boxTransferDuration).frame,
    4,
    "existing scenes keep their release time",
  );
});
