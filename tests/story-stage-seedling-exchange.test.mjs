import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue, storyStageExitCue } from "../lib/story-stage.ts";
import { stageWrist } from "../lib/story-stage-wrists.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";

test("seedling and paper transfers meet at the same hands before the giver lets go", () => {
  for (const [line, id] of [
    [16, "comparison-sprig"],
    [29, "route-slip"],
  ]) {
    const cue = storyStageCue("merrill-seedlings-return", line);
    assert.equal(cue.finishBeforeAdvance, true);
    const giver = cue.actors.find((a) => a.id === "lico");
    const receiver = cue.extras.find((a) => a.id === "merrill");
    const positions = new Map([
      ["lico", { ...giver, wrist: stageWrist("lico", "conversation", 73) }],
      ["extra:merrill", { ...receiver, wrist: stageExtraWrist(receiver, false, 0) }],
    ]);
    const states = [cue, ...cue.sequence];
    const given = states
      .flatMap((s) => s.items ?? [])
      .find((p) => p.id === id && p.actor === "lico");
    const received = states
      .flatMap((s) => s.items ?? [])
      .find((p) => p.id === id && p.extra === "merrill" && p.wrist);
    assert.ok(given && received);
    const a = stageItemTarget(given, cue, positions),
      b = stageItemTarget(received, cue, positions);
    assert.ok(Math.hypot(a.x - b.x, a.bottom - b.bottom) < 0.2, id);
  }
});

test("Merrill stays for the final line and leaves only through the exit cue", () => {
  const last = storyStageCue("merrill-seedlings-return", 40);
  const exit = storyStageExitCue("merrill-seedlings-return");
  assert.ok(last.extras.find((e) => e.id === "merrill").x < 100);
  const leaving = exit.extras.find((e) => e.id === "merrill");
  assert.ok(leaving.bottom < -50);
  assert.ok(
    leaving.x >= 65 && leaving.x <= 80,
    "leave along the soil, inside the right water channel",
  );
  assert.ok(leaving.via.every((p) => p.x <= 80 && p.bottom < 0));
  assert.deepEqual(exit.actors, last.actors);
  assert.equal(storyStageCue("merrill-seedlings-departure", 14), null);
});

test("four mushrooms enter the hand and pot exactly once before being packed", () => {
  const cue = storyStageCue("merrill-seedlings-return", 34);
  assert.equal(cue.finishBeforeAdvance, true);
  const initial = cue.items.filter((p) => p.art === "korotake");
  assert.equal(initial.length, 4);
  for (const item of initial) {
    const states = cue.sequence
      .filter((s) => s.items)
      .map((s) => s.items.find((p) => p.id === item.id));
    const hand = states.findIndex((p) => p?.wrist);
    const pot = states.findIndex((p) => p?.carrier === "merrill-pot");
    assert.ok(hand >= 0 && pot > hand, item.id);
    assert.ok(
      states.slice(pot + 1).every((p) => !p || p.carrier === "merrill-pot"),
      item.id + " returns from pot",
    );
  }
  assert.equal(
    cue.sequence.at(-1).items.some((p) => p.art === "korotake"),
    false,
  );
  assert.equal(cue.sequence.at(-1).items.find((p) => p.id === "merrill-pot").wrist, true);
});
