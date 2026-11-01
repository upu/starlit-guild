import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue as cue, storyStageExitCue } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";

const before = "missing-keystone-departure",
  after = "missing-keystone-return";
const moments = (value) => [value, ...(value.sequence ?? []).map((s) => ({ ...value, ...s }))];
const item = (value, id) => value.items.find((i) => i.id === id);
const actor = (value, id) => value.actors.find((a) => a.id === id);
function target(value, id) {
  return stageItemTarget(item(value, id), value, new Map(value.actors.map((a) => [a.id, a])));
}

test("the shipping copy is picked up at the desk after Finn arrives, folded, and returned at the same hand contact", () => {
  const taking = moments(cue(before, 6));
  assert.ok(
    taking[1].after >
      journeyDuration(actor(taking[0], "finn"), actor(cue(before, 5), "finn")) + 200,
  );
  assert.deepEqual(target(taking[0], "shipping-copy"), target(taking[1], "shipping-copy"));
  assert.equal(item(taking[0], "shipping-copy").width, item(taking[1], "shipping-copy").width);
  assert.equal(item(taking[2], "shipping-copy").turn, 80);
  assert.equal(item(taking[3], "shipping-copy").art, "folded-paper");
  assert.ok(item(taking[3], "shipping-copy").width < item(taking[1], "shipping-copy").width);
  const returning = moments(cue(before, 11));
  assert.deepEqual(target(returning[0], "shipping-copy"), target(returning[1], "shipping-copy"));
  assert.equal(
    item(returning[1], "shipping-copy").width,
    item(returning[0], "shipping-copy").width,
  );
  assert.equal(item(returning[1], "shipping-copy").support, "inspection-table");
});

test("grass and exposed footing share a location, and crouching persists through Finn's replies", () => {
  assert.equal(cue(before, 0).background, "berne-foundation-grass");
  assert.equal(cue(after, 0).background, "berne-foundation-open");
  const approach = moments(cue(after, 13));
  assert.ok(
    approach[2].after - approach[1].after >
      journeyDuration(actor(approach[1], "finn"), actor(approach[0], "finn")) + 200,
  );
  for (let i = 14; i <= 16; i++) assert.equal(actor(cue(after, i), "finn").inspect, true);
  assert.equal(actor(cue(after, 17), "finn").inspect, false);
  const mason = moments(cue(after, 3));
  assert.equal(mason[0].extras.find((e) => e.id === "worker").inspect, true);
  assert.equal(mason.at(-1).extras.find((e) => e.id === "worker").inspect, true);
  assert.ok(mason.at(-1).extras.find((e) => e.id === "worker").bottom > 40);
});

test("the four characters and three pieces of luggage keep their scale across all actions", () => {
  for (const [id, count] of [
    [before, 12],
    [after, 18],
  ])
    for (let line = 0; line < count; line++)
      for (const value of moments(cue(id, line))) {
        assert.equal(value.cell, 21);
        for (const [name, width] of [
          ["basket", 7],
          ["delivery-bag", 8],
          ["medicine-closed", 8],
        ])
          assert.equal(item(value, name).width, width, `${id}/${line}/${name}`);
        assert.ok(!value.items.some((p) => p.art === "ledger"));
      }
});

test("documents are stowed and luggage collected before leaving along a route clear of the empty socket", () => {
  const sequence = moments(cue(after, 17)),
    last = sequence.at(-1),
    exit = storyStageExitCue(after);
  assert.ok(
    sequence[2].after - sequence[1].after >
      journeyDuration(actor(sequence[1], "leon"), actor(sequence[0], "leon")) + 200,
  );
  assert.equal(item(last, "district-plan").stored, true);
  assert.equal(item(last, "shipping-copy").stored, true);
  assert.equal(item(last, "basket").actor, "aria");
  assert.equal(item(last, "medicine-closed").actor, "mira");
  assert.equal(item(last, "delivery-bag").actor, "leon");
  assert.ok(last.actors.every((a) => a.bottom > 0));
  for (const a of exit.actors) {
    const start = actor(last, a.id);
    for (let t = 0; t <= journeyDuration(a, start); t += 30) {
      const p = sampleJourney(a, start, t, false);
      const x = 50 + (p.x - 50) * 0.72,
        y = 81 - p.bottom * 0.72;
      assert.ok(!(x > 43 && x < 48 && y > 60 && y < 68), `${a.id} avoids the socket`);
    }
  }
});
