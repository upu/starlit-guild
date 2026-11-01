import test from "node:test";
import assert from "node:assert/strict";
import { RoadGait } from "../lib/road-gait.ts";

const hero = (x, lane = 0.68) => ({ id: "aria", x, lane });
const view = { width: 738, height: 492, stage: "forest" };

test("stopping does not keep cycling feet, regardless of render count", () => {
  const gait = new RoadGait();
  gait.frame(hero(0), view);
  const frame = gait.frame(hero(20), view);
  for (let i = 0; i < 200; i++) assert.equal(gait.frame(hero(20), view), frame);
});

test("the same route has the same gait at coarse and fine rendering intervals", () => {
  const coarse = new RoadGait(),
    fine = new RoadGait();
  coarse.frame(hero(0), view);
  fine.frame(hero(0), view);
  for (let x = 10; x <= 200; x += 10) {
    for (let step = x - 9; step < x; step++) fine.frame(hero(step), view);
    assert.equal(coarse.frame(hero(x), view), fine.frame(hero(x), view));
  }
});

test("vertical travel advances steps and resizing preserves their current phase", () => {
  const gait = new RoadGait();
  gait.frame(hero(0), view);
  const frame = gait.frame(hero(0, 0.95), view);
  assert.notEqual(frame, 0);
  assert.equal(gait.frame(hero(0, 0.95), { ...view, width: 374, height: 249 }), frame);
});
