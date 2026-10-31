import { test } from "node:test";
import assert from "node:assert/strict";
import { BrekkaBattlePlace } from "../lib/road-brekka-battle-place.ts";

const input = (time, changes = {}) => ({
  node: 0,
  completed: false,
  fighting: false,
  paused: false,
  reduced: false,
  time,
  ...changes,
});

test("quiet approach fades to the outskirts and returns after the encounter", () => {
  const place = new BrekkaBattlePlace();
  assert.deepEqual(place.update(input(0)), { field: false, busy: false, fade: 0 });
  assert.deepEqual(place.update(input(100, { node: 1 })), { field: false, busy: true, fade: 0 });
  assert.deepEqual(place.update(input(450, { node: 1 })), { field: true, busy: true, fade: 1 });
  assert.deepEqual(place.update(input(800, { node: 1 })), { field: true, busy: true, fade: 0 });
  assert.deepEqual(place.update(input(900, { node: 1, fighting: true })), {
    field: true,
    busy: true,
    fade: 0,
  });
  assert.equal(place.update(input(1500, { node: 2 })).field, true);
  assert.equal(place.update(input(1600, { node: 2 })).fade, 0);
  assert.deepEqual(place.update(input(1950, { node: 2 })), { field: false, busy: true, fade: 1 });
  assert.deepEqual(place.update(input(2300, { node: 2 })), { field: false, busy: false, fade: 0 });
});

test("a live encounter overrides a deferred ledger visit without hiding combat", () => {
  const place = new BrekkaBattlePlace();
  assert.deepEqual(place.update(input(0, { node: 1, defer: true })), {
    field: false,
    busy: false,
    fade: 0,
  });
  assert.deepEqual(place.update(input(100, { node: 1, defer: true, fighting: true })), {
    field: true,
    busy: true,
    fade: 0,
  });
  assert.deepEqual(place.update(input(200, { node: 1, fighting: true })), {
    field: true,
    busy: true,
    fade: 0,
  });
});

test("a paused review opened during battle still shows the battle location", () => {
  const place = new BrekkaBattlePlace();
  assert.deepEqual(place.update(input(0, { fighting: true, paused: true })), {
    field: true,
    busy: true,
    fade: 0,
  });
});

test("pause freezes a transition and reduced motion switches without a fade", () => {
  const place = new BrekkaBattlePlace();
  place.update(input(0, { node: 1 }));
  assert.equal(place.update(input(200, { node: 1, paused: true })).fade, 0);
  assert.equal(place.update(input(550, { node: 1 })).fade, 1);
  const reduced = new BrekkaBattlePlace();
  assert.deepEqual(reduced.update(input(0, { node: 1, reduced: true })), {
    field: true,
    busy: true,
    fade: 0,
  });
  assert.deepEqual(reduced.update(input(1, { completed: true, reduced: true })), {
    field: false,
    busy: false,
    fade: 0,
  });
});
