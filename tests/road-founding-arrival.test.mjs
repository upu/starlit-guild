import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { FoundingArrival, foundingWarehouseBackground } from "../lib/road-founding-arrival.ts";

test("arrival waits for the cart, fades through black and resumes only at the warehouse", () => {
  const arrival = new FoundingArrival();
  for (let time = 0; time <= 2000; time += 100) {
    const frame = arrival.update(false, time, false);
    assert.equal(frame.switchScene, false);
    assert.equal(frame.complete, false);
  }
  let switched = false,
    complete = false;
  for (let time = 2100; time <= 4000; time += 100) {
    const frame = arrival.update(true, time, false);
    if (frame.switchScene && !switched) {
      switched = true;
      assert.equal(frame.fade, 1);
    }
    if (frame.complete) {
      complete = true;
      assert.equal(frame.fade, 0);
      assert.equal(frame.switchScene, true);
      break;
    }
  }
  assert.ok(switched && complete);
  arrival.reset();
  assert.deepEqual(arrival.update(true, 5000, true), {
    switchScene: true,
    fade: 0,
    complete: true,
  });
});

test("the fade continues after the cart is parked at the warehouse", () => {
  const arrival = new FoundingArrival();
  arrival.update(true, 0, false);
  let frame;
  for (let time = 100; time <= 1500; time += 100) {
    frame = arrival.update(false, time, false);
    if (time === 900) assert.equal(frame.fade, 1);
  }
  assert.equal(frame.switchScene, true);
  assert.equal(frame.complete, true);
});

test("the warehouse background is the recorded complete image", async () => {
  const source = await readFile("assets/source/storybook/founding-linde-warehouse-v1.png");
  const output = await readFile(`public${foundingWarehouseBackground}`);
  assert.deepEqual(output, source);
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.width, 1536);
  assert.equal(metadata.height, 1024);
});
