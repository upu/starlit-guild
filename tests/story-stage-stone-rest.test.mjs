import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue as cue, sampleStageActor } from "../lib/story-stage.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";
import { stageItemTarget, stageItemVisible } from "../lib/story-stage-props.ts";

const id = "matching-lantern-stone-return";
const moments = (value) => [value, ...(value.sequence ?? []).map((s) => ({ ...value, ...s }))];
const actor = (value, name) => value.actors.find((a) => a.id === name);
const item = (value, name) => value.items.find((p) => p.id === name);
const positions = (value) =>
  new Map([
    ...value.actors.map((a) => [a.id, sampleStageActor(a, a, 0, false)]),
    ...(value.extras ?? []).map((a) => [`extra:${a.id}`, a]),
  ]);
const target = (value, name) => stageItemTarget(item(value, name), value, positions(value));

test("the cup and kettle routes keep their feet away from the medicine box and empty chairs", () => {
  const start = cue(id, 19),
    next = cue(id, 20);
  const obstacles = start.items.filter((p) =>
    ["medicine-closed", "basket", "chair", "brazier"].includes(p.art),
  );
  for (const name of ["aria", "leon"]) {
    const goal = actor(name === "aria" ? next.sequence[1] : next, name);
    for (let t = 0; t <= journeyDuration(goal, actor(start, name)); t += 40) {
      const at = sampleJourney(goal, actor(start, name), t, false);
      for (const obstacle of obstacles) {
        const distance = Math.hypot(at.x - obstacle.x, ((at.bottom - obstacle.bottom) * 2) / 3);
        assert.ok(
          distance > (obstacle.width ?? 10) / 2 + 1.5,
          `${name} feet cross ${obstacle.id} at ${t}ms`,
        );
      }
    }
  }
});

test("only one candidate illuminates the comparison cloth and its distance matches the original sample", () => {
  const stages = moments(cue(id, 4));
  assert.equal(stages[0].background, "stone-storeroom");
  assert.equal(stages[0].cut, true);
  const dull = stages.find((s) => s.after === 900),
    violet = stages.find((s) => s.after === 3400);
  assert.equal(item(dull, "violet-stone").art, "covered-stone");
  assert.equal(item(dull, "comparison-cloth").glow, undefined);
  assert.equal(item(violet, "dull-stone").art, "covered-stone");
  assert.equal(item(violet, "comparison-cloth").glowTone, "violet");
  assert.equal(item(violet, "comparison-cloth").glow, "dim");
  const selected = cue(id, 5);
  const prior = moments(cue("riverside-manor-return", 21)).find((s) => s.after === 1500);
  assert.ok(
    Math.abs(actor(selected, "leon").x - actor(selected, "finn").x) >= 12,
    "leave room beside the comparison area",
  );
  const gap = (value, stone, cloth) => Math.abs(target(value, stone).x - target(value, cloth).x);
  assert.equal(
    gap(selected, "violet-stone", "comparison-cloth"),
    gap(prior, "tower-stone", "light-sample"),
  );
  assert.equal(item(selected, "violet-stone").width, item(prior, "tower-stone").width);
  const walking = stages.find((s) => s.after === 2000);
  for (const name of ["aria", "leon"]) {
    const goal = actor(walking, name),
      start = actor(stages[0], name);
    for (let t = 0; t <= journeyDuration(goal, start); t += 40) {
      const at = sampleJourney(goal, start, t, false);
      for (const stone of [item(walking, "violet-stone"), item(walking, "dull-stone")])
        assert.ok(
          Math.hypot(at.x - stone.x, ((at.bottom - stone.bottom) * 2) / 3) > stone.width / 2 + 1.5,
          `${name} steps on ${stone.id}`,
        );
    }
  }
});

test("both receipt handoffs and the seated cup handoff meet at the same hands", () => {
  const receipt = moments(cue(id, 12));
  for (const [before, after] of [
    [receipt[0], receipt[1]],
    [receipt[2], receipt[3]],
  ]) {
    const oldOwnerAtContact = { ...before, actors: after.actors, extras: after.extras };
    assert.deepEqual(target(oldOwnerAtContact, "sale-receipt"), target(after, "sale-receipt"));
    assert.equal(item(after, "sale-receipt").art, "paper");
    assert.equal(item(after, "sale-receipt").width, 4.5);
  }
  const cups = moments(cue(id, 20)),
    received = cups.at(-1);
  const before = { ...cups.at(-2), actors: received.actors };
  const from = target(before, "mira-cup"),
    to = target(received, "mira-cup");
  assert.ok(Math.hypot(from.x - to.x, from.bottom - to.bottom) < 0.1);
  assert.ok(
    received.after - 650 > journeyDuration(actor(received, "aria"), actor(cue(id, 19), "aria")),
  );
});

test("kettle and chairs remain attached until their bearers arrive, with four seats left in place", () => {
  const steps = moments(cue(id, 21));
  const before = cue(id, 20),
    final = steps.at(-1);
  const startPositions = { ...steps[0], actors: before.sequence.at(-1).actors };
  assert.deepEqual(
    target(startPositions, "kettle"),
    target({ ...before, ...before.sequence.at(-1) }, "kettle"),
  );
  const placedKettle = steps.find((s) => item(s, "kettle").support === "brazier");
  assert.deepEqual(
    target({ ...steps[0], actors: placedKettle.actors }, "kettle"),
    target(placedKettle, "kettle"),
  );
  assert.equal(
    item(placedKettle, "kettle").steaming,
    undefined,
    "cold water does not boil immediately",
  );
  assert.equal(item(final, "kettle").steaming, true);
  assert.ok(
    steps.every((step) => !actor(step, "finn").carry || item(step, "kettle").actor !== "leon"),
    "Finn waits for Leon to clear the shared space by the brazier",
  );
  for (const seat of ["finn", "leon", "aria", "mira"]) {
    const name = `chair-${seat}`;
    const pickupIndex = steps.findIndex((s) => item(s, name).actor === "finn");
    const pickup = steps[pickupIndex],
      previous = steps[pickupIndex - 1];
    assert.deepEqual(target(pickup, name), target(previous, name), `${seat} pickup contact`);
    const placedIndex = steps.findIndex((s, i) => i > pickupIndex && !item(s, name).actor);
    const placed = steps[placedIndex],
      carried = steps[placedIndex - 1];
    assert.deepEqual(target(carried, name), target(placed, name), `${seat} set-down contact`);
    const movingIndex = steps.findLastIndex(
      (step, i) =>
        i > pickupIndex &&
        i < placedIndex &&
        (actor(step, "finn").x !== actor(steps[i - 1], "finn").x ||
          actor(step, "finn").bottom !== actor(steps[i - 1], "finn").bottom),
    );
    assert.ok(
      placed.after - steps[movingIndex].after >=
        journeyDuration(actor(steps[movingIndex], "finn"), actor(steps[movingIndex - 1], "finn")),
      `${seat} reaches the seat`,
    );
    assert.equal(item(final, name).seatFor, seat);
    assert.equal(
      stageItemVisible(item(final, name), positions(final)),
      false,
      "the seated atlas already contains this chair",
    );
  }
});
