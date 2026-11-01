import test from "node:test";
import assert from "node:assert/strict";
import { lanternRoadLayout } from "../lib/road-lantern-layout.ts";

test("the proposed village-road camera keeps the group and lantern on screen", () => {
  for (const view of [
    { width: 900, height: 600 },
    { width: 1178, height: 608 },
    { width: 390, height: 700 },
  ]) {
    const layout = lanternRoadLayout(view);
    const scene = [
      [480, 690],
      [610, 720],
      [740, 690],
      [870, 720],
      [1060, 630],
      [1170, 630],
    ];
    for (const [x, y] of scene) {
      const point = layout.project(x, y);
      const margin = layout.figureSize * 0.6;
      assert.ok(point.x > margin && point.x < view.width - margin, `${view.width}: x=${point.x}`);
      assert.ok(
        point.y > layout.figureSize && point.y < view.height - 2,
        `${view.width}: y=${point.y}`,
      );
      const original = layout.unproject(point.x, point.y);
      assert.ok(Math.abs(original.x - x) < 1e-6 && Math.abs(original.y - y) < 1e-6);
    }
    assert.ok(layout.backdrop.x <= 0 && layout.backdrop.y <= 0);
    assert.ok(layout.backdrop.x + layout.backdrop.width >= view.width);
    assert.ok(layout.backdrop.y + layout.backdrop.height >= view.height);
  }
});
