import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { actorPose } from "../lib/story-stage-pose.ts";

const cue = (line) => storyStageCue("interlude-walnut-lunch", line);
const moments = (value) => [value, ...(value.sequence ?? []).map((s) => ({ ...value, ...s }))];
const item = (value, id) => value.items.find((p) => p.id === id);
const target = (value, prop) =>
  stageItemTarget(
    prop,
    value,
    new Map(value.actors.map((a) => [a.id, { ...a, ...actorPose(a, false, 0, true) }])),
  );

test("picnic cakes retain identity and scale from the cloth through handoff and eating", () => {
  const before = cue(10),
    pass = cue(11),
    transfer = moments(pass)[1],
    received = moments(pass).at(-1);
  assert.equal(item(before, "shared-cake").actor, undefined);
  assert.equal(item(pass, "shared-cake").actor, "aria");
  assert.equal(item(transfer, "shared-cake").actor, "leon");
  assert.deepEqual(
    target(pass, item(pass, "shared-cake")),
    target(transfer, item(transfer, "shared-cake")),
  );
  assert.ok(
    target(received, item(received, "shared-cake")).x >
      target(transfer, item(transfer, "shared-cake")).x,
  );
  for (let line = 1; line < 32; line++)
    for (const value of moments(cue(line))) {
      assert.equal(new Set(value.items.map((p) => p.id)).size, value.items.length);
      for (const prop of value.items.filter((p) => p.art === "honey-cake"))
        assert.equal(prop.width, 2.8);
      assert.ok(
        value.actors.every((a) => a.seated),
        "packing and eating do not switch back to a standing body",
      );
    }
  for (const value of moments(cue(15))) {
    const a = item(value, "aria-cake"),
      b = item(value, "shared-cake");
    if (a && b)
      assert.ok(
        Math.abs(target(value, a).x - target(value, b).x) > a.width,
        "each person has a separate cake",
      );
  }
  assert.equal(item(cue(16), "shared-cake"), undefined);
  assert.equal(item(cue(16), "aria-cake"), undefined);
});

test("the travel flask comes out on its narrated line and remains between the sitters", () => {
  assert.equal(item(cue(5), "travel-flask"), undefined);
  assert.equal(item(cue(6), "travel-flask").actor, "leon");
  for (let line = 7; line < 32; line++)
    for (const value of moments(cue(line))) {
      const flask = item(value, "travel-flask");
      assert.equal(flask.actor, undefined);
      assert.equal(flask.width, 4);
      assert.ok(flask.x > value.actors[0].x && flask.x < value.actors[1].x);
      const parcel = item(value, "cake-parcel");
      if (parcel) assert.ok(Math.abs(parcel.x - flask.x) >= (parcel.width + flask.width) / 2);
    }
});

test("the parcel closes after the twine handoff without changing the character cell size", () => {
  const states = moments(cue(28));
  assert.equal(item(states[0], "twine").actor, "leon");
  assert.equal(item(states[1], "twine").actor, "aria");
  assert.ok(item(states[0], "walnut-cake"));
  assert.equal(item(states[0], "cake-parcel"), undefined);
  assert.ok(item(states[2], "cake-parcel"));
  assert.equal(item(states[2], "twine"), undefined);
  for (let line = 0; line < 32; line++)
    for (const value of moments(cue(line))) assert.equal(value.cell, 24);
});
