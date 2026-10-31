import test from "node:test";
import assert from "node:assert/strict";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";

test("Aria reaches the table, then pours over each cup without repeating the approach route", () => {
  const cue = studyCue("medicine-road-home-return", 9, true);
  const moments = [{ after: 0, actors: cue.actors, items: cue.items }, ...cue.sequence];
  const positions = new Map([
    ["aria", { x: 67, bottom: 24 }],
    ["leon", { x: 62, bottom: 48 }],
    ["mira", { x: 25, bottom: 42 }],
  ]);
  let phase = -1;
  let origins;
  const checks = new Map([
    [4000, 0],
    [5200, 1],
    [6500, 2],
  ]);
  for (let t = 0; t <= 6500; t += 4) {
    const index = moments.findLastIndex((moment) => moment.after <= t);
    const moment = moments[index];
    if (phase !== index) {
      phase = index;
      origins = new Map(positions);
    }
    for (const actor of moment.actors)
      positions.set(actor.id, sampleStageActor(actor, origins.get(actor.id), t - moment.after));
    if (!checks.has(t)) continue;
    const cupIndex = checks.get(t);
    const pot = moment.items.find((item) => item.id === "teapot");
    const cup = moment.items.find((item) => item.id === `tea-${cupIndex}`);
    const target = stageItemTarget(pot, { ...cue, ...moment }, positions);
    assert.equal(pot.pouring, true);
    assert.equal(cup.art, "empty-cup");
    assert.ok(Math.abs(cup.x - target.x - 3) < 0.5, `cup ${cupIndex}: ${target.x} -> ${cup.x}`);
    assert.ok(Math.abs(positions.get("aria").bottom - 24) < 0.1);
    assert.equal(moment.items.filter((item) => item.art === "teacup").length, cupIndex);
  }
  assert.equal(cue.finishBeforeAdvance, true);
  assert.ok(cue.sequence.every((step) => !step.actors.find((actor) => actor.id === "aria").via));
  const offer = studyCue("medicine-road-home-return", 10, true);
  assert.equal(offer.actors.find((actor) => actor.id === "aria").via, undefined);
  assert.ok(offer.sequence.every((step) => !step.actors.find((actor) => actor.id === "aria").via));
  assert.equal(offer.finishBeforeAdvance, true);
});

test("return traffic uses the same registered cart and carrying positions as the outward road", () => {
  const cue = studyCue("medicine-road-home-return", 0, true);
  assert.equal(cue.extras.find((extra) => extra.id === "worker").pullCart, true);
  assert.equal(cue.items.find((item) => item.id === "empty-cart").x, -13.1);
  assert.equal(cue.items.find((item) => item.id === "medicine").wrist, true);
  assert.ok(
    cue.sequence.every((step) => step.extras.find((extra) => extra.id === "worker").pullCart),
  );
});

test("office arrival separates the party and leaves the case in one clear place", () => {
  const cue = studyCue("medicine-road-home-return", 1, true);
  const aria = cue.actors.find((actor) => actor.id === "aria");
  const leon = cue.actors.find((actor) => actor.id === "leon");
  const mira = cue.actors.find((actor) => actor.id === "mira");
  const carried = cue.items.find((item) => item.id === "medicine");
  assert.ok(leon.x - aria.x >= 14);
  assert.equal(cue.initial.leon, leon.x);
  assert.equal(carried.actor, "mira");
  assert.equal(carried.wrist, true);
  assert.equal(mira.left, true);
  const putDown = cue.sequence.find((step) => step.after === 700);
  const moveAway = cue.sequence.find((step) => step.after === 1500);
  const caseOnFloor = putDown.items.find((item) => item.id === "medicine");
  assert.equal(caseOnFloor.actor, undefined);
  assert.equal(caseOnFloor.x, 16);
  assert.ok(moveAway.after - putDown.after >= (caseOnFloor.travelMs ?? 650));
  assert.ok(moveAway.actors.find((actor) => actor.id === "mira").bottom > 35);
  for (let line = 2; line <= 10; line++) {
    const scene = studyCue("medicine-road-home-return", line, true);
    assert.equal(scene.items.find((item) => item.id === "medicine").x, 16);
    assert.equal(scene.actors.find((actor) => actor.id === "leon").nameAbove, true);
  }
});
