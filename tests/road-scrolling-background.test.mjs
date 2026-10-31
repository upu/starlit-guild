import test from "node:test";
import assert from "node:assert/strict";
import {
  roadForestTileFlip,
  scrollingRoadBackdrop,
  STORYBOOK_TRANSPLANT,
} from "../lib/road-scrolling-background.ts";
import { roadScale, roadX } from "../lib/road-layout.ts";

test("a ground mark and a stationary parcel move together as the camera advances", () => {
  for (const width of [374, 738]) {
    const view = (camera) =>
      scrollingRoadBackdrop(width, (width * 2) / 3, 1536, 1024, camera, "forest");
    const before = view(100),
      after = view(120);
    const parcelTravel = roadX(300, 120, width) - roadX(300, 100, width);
    assert.ok(Math.abs(after.x - before.x - parcelTravel) < 1e-9);
    assert.ok(after.x <= 0 && after.x + 2 * after.width >= width);
  }
});

test("a wrap advances the same ground without leaving a gap in either viewport", () => {
  for (const width of [374, 738]) {
    const view = (camera) =>
      scrollingRoadBackdrop(width, (width * 2) / 3, 1536, 1024, camera, "forest");
    const period = view(0).width / roadScale(width);
    const before = view(period - 1),
      after = view(period + 1);
    assert.ok(Math.abs(after.x - (before.x + before.width) + 2 * roadScale(width)) < 1e-9);
    assert.ok(before.x + 2 * before.width >= width);
    assert.ok(after.x + 2 * after.width >= width);
  }
});

test("the transplant night road mirrors each adjoining tile across a wrap", () => {
  for (const width of [374, 738]) {
    const height = (width * 2) / 3;
    const tileWidth = scrollingRoadBackdrop(width, height, 1536, 1024, 0, "forest").width;
    const period = tileWidth / roadScale(width, "forest");
    const flip = (camera) =>
      roadForestTileFlip(STORYBOOK_TRANSPLANT, camera, width, tileWidth, "forest");
    assert.equal(flip(0), false);
    assert.equal(flip(period - 0.01), false);
    assert.equal(flip(period + 0.01), true);
    assert.equal(flip(2 * period + 0.01), false);
  }
});
