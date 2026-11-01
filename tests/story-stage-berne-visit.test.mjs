import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue as cue, storyStageExitCue, sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { orderStageItems } from "../lib/story-stage-cargo.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";

const id = "berne-house-calls-return";
const moments = (value) => [value, ...(value.sequence ?? []).map((s) => ({ ...value, ...s }))];
const item = (value, name) => value.items.find((p) => p.id === name);
function positions(value) {
  const result = new Map(value.actors.map((a) => [a.id, sampleStageActor(a, a, 5000, true)]));
  for (const extra of value.extras ?? []) result.set(`extra:${extra.id}`, extra);
  for (const p of orderStageItems(value.items))
    result.set(`item:${p.id}`, stageItemTarget(p, value, result));
  return result;
}
function sameContact(from, to, name) {
  assert.equal(item(from, name).width, item(to, name).width, name + ": constant handoff size");
  const a = stageItemTarget(item(from, name), from, positions(from));
  const b = stageItemTarget(item(to, name), to, positions(to));
  assert.ok(
    Math.hypot(a.x - b.x, a.bottom - b.bottom) < 0.01,
    `${name}: ${JSON.stringify(a)} / ${JSON.stringify(b)}`,
  );
}

test("the missing pavement is visible and the party leaves along intact paving after the final tap", () => {
  const start = cue("berne-house-calls-departure", 0);
  assert.equal(start.background, "berne-paving");
  const writing = cue("berne-house-calls-departure", 5);
  assert.ok(writing.actors.find((a) => a.id === "leon").writing);
  assert.ok(item(writing, "route-map").width <= 6);
  assert.equal(writing.sequence.at(-1).actors.find((a) => a.id === "leon").writing, false);
  const last = cue("berne-house-calls-departure", 10),
    exit = storyStageExitCue("berne-house-calls-departure");
  assert.ok(last.actors.every((a) => a.bottom < 100));
  for (const actor of exit.actors) {
    const origin = last.actors.find((a) => a.id === actor.id);
    for (let time = 0; time <= journeyDuration(actor, origin); time += 30) {
      const p = sampleJourney(actor, origin, time, false);
      const x = 50 + (p.x - 50) * 0.72,
        y = 63 + (25 - p.bottom) * 0.72;
      assert.ok(!(x > 24 && x < 48 && y > 55 && y < 75), actor.id + ": avoid missing paving");
    }
  }
});

test("medicine remains closed and the same size while carried and throughout lunch", () => {
  for (let line = 0; line < 24; line++)
    for (const value of moments(cue(id, line))) {
      const box = item(value, "medicine");
      assert.equal(box.art, "medicine-closed");
      assert.equal(box.width, 8);
    }
  for (let line = 15; line < 24; line++) {
    const box = item(cue(id, line), "medicine");
    assert.equal(box.actor, undefined);
    assert.deepEqual([box.x, box.bottom], [50, 13]);
  }
  assert.equal(cue(id, 0).background, "berne-porch");
  assert.ok(
    !cue(id, 0).items.some((p) => p.art === "replacement"),
    "the small lamp stone is supported by the background shelf",
  );
});

test("medicine, purchase copy, bread and tea meet at the displayed hands", () => {
  const med = moments(cue(id, 0));
  sameContact(med[0], med[1], "prescription");
  const docs = moments(cue(id, 6));
  sameContact(docs[0], docs[1], "purchase-copy");
  const serving = moments(cue(id, 13));
  sameContact(serving[0], serving[1], "leon-wrap");
  const share = moments(cue(id, 17));
  sameContact(share[2], share[3], "finn-roll");
  const mira = moments(cue(id, 20));
  sameContact(mira[1], mira[2], "mira-roll");
  const tea = moments(cue(id, 18));
  sameContact(tea[0], tea[1], "tea-tray");
});

test("three rolls become two rolls and two halves, with four cups attached to the moving tray", () => {
  const rolls = (value) =>
    value.items.filter((p) => p.art === "bread-roll" || p.art === "bread-half");
  assert.equal(rolls(moments(cue(id, 10)).at(-1)).length, 3);
  assert.deepEqual(
    rolls(cue(id, 17)).map((p) => p.art),
    ["bread-roll", "bread-roll", "bread-half", "bread-half"],
  );
  for (const value of moments(cue(id, 18))) {
    const cups = value.items.filter((p) => p.art === "teacup");
    assert.equal(cups.length, 4);
    assert.ok(cups.every((p) => p.carrier === "tea-tray" && p.width === 1.8));
  }
  const end = moments(cue(id, 20)).at(-1);
  assert.equal(rolls(end).length, 4);
  assert.equal(rolls(cue(id, 21)).length, 0, "the next line advances to after lunch");
  assert.equal(item(end, "visit-notebook").art, "closed-ledger");
  const paper = moments(cue(id, 23));
  assert.equal(item(paper[1], "purchase-copy").actor, "finn");
  assert.equal(item(paper.at(-1), "purchase-copy").stored, true);
});

test("medicine pickup and tea transfer wait until their recipients have arrived", () => {
  for (const [line, name, step] of [
    [14, "leon", 1],
    [18, "finn", 0],
  ]) {
    const value = cue(id, line),
      target = value.actors.find((a) => a.id === name),
      before = cue(id, line - 1).actors.find((a) => a.id === name);
    assert.ok(value.sequence[step].after > journeyDuration(target, before) + 200);
  }
});
