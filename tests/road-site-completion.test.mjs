import test from "node:test";
import assert from "node:assert/strict";
import { RoadSiteCompletion } from "../app/phaser/road-site-completion.ts";
import { RoadFixedSceneReset } from "../lib/road-fixed-scene-reset.ts";

test("site completion is published once per run, after its visible work ends", () => {
  const publisher = new RoadSiteCompletion(),
    events = [];
  const notify = (quest) => events.push(quest);
  publisher.update({ foundation: { visualComplete: false } }, {}, "a", notify);
  publisher.update({ foundation: { visualComplete: true } }, {}, "a", notify);
  publisher.update({ foundation: { visualComplete: true } }, {}, "a", notify);
  publisher.update({ townFinalizing: true }, { townVisualComplete: false }, "b", notify);
  publisher.update({ townFinalizing: true }, { townVisualComplete: true }, "b", notify);
  publisher.update({ townFinalizing: true }, { townVisualComplete: true }, "b", notify);
  publisher.update({ foundation: { visualComplete: true } }, {}, "c", notify);
  publisher.update({ forestFinalizing: true }, { forestVisualComplete: false }, "d", notify);
  publisher.update({ forestFinalizing: true }, { forestVisualComplete: true }, "d", notify);
  publisher.update(
    { waterwaySearchFinalizing: true },
    { waterwaySearchVisualComplete: true },
    "e",
    notify,
  );
  publisher.update(
    { waterwaySearchFinalizing: true },
    { waterwaySearchVisualComplete: true },
    "e",
    notify,
  );
  publisher.update({ forestFinalizing: true }, { forestVisualComplete: true }, "d", notify);
  assert.deepEqual(events, [
    "missing-keystone",
    "town-deliveries",
    "missing-keystone",
    "forest-wetland",
    "old-waterway",
  ]);
});

test("fixed-site positions reset on tableau changes, without resetting every frame", () => {
  const reset = new RoadFixedSceneReset();
  assert.equal(reset.changed({ foundation: { exposed: false } }), false);
  assert.equal(reset.changed({ foundation: { exposed: false } }), false);
  assert.equal(reset.changed({ foundation: { exposed: true } }), true);
  assert.equal(reset.changed({ foundation: { exposed: true } }), false);
  assert.equal(reset.changed({}), true);
  assert.equal(reset.changed({ manorDelivery: { garden: false } }), false);
  assert.equal(reset.changed({ manorDelivery: { garden: true } }), true);
});
