import test from "node:test";
import assert from "node:assert/strict";
import { waterwayLayout } from "../lib/road-waterway-layout.ts";
import { roadX, roadY, roadFigureDepth } from "../lib/road-layout.ts";
import { waterwayPropDepth } from "../lib/road-waterway-contacts.ts";
import { RoadMossHatches } from "../lib/road-moss-hatches.ts";

test("waterway stone/body proportions and palm contact survive phone cropping", () => {
  const ratios = [];
  for (const width of [350, 374, 738, 936]) {
    const height = (width * 2) / 3;
    const layout = waterwayLayout(width, height);
    const world = layout.world(1043, 653);
    const projected = layout.project(1043, 653);
    assert.ok(Math.abs(roadX(world.x, 0, width) - projected.x) < 1e-8);
    assert.ok(Math.abs(roadY(world.lane, height, width) - projected.y) < 1e-8);
    ratios.push(layout.backdrop.width / (134 * layout.figureScale));
    // A crouching palm reaches the left rim while the soles stay on dry ground.
    const foot = {
      x: projected.x - 45 * layout.figureScale,
      y: projected.y + 10 * layout.figureScale,
    };
    assert.ok(foot.x < projected.x && foot.y > projected.y);
    assert.ok(foot.x - 96 * layout.figureScale > 0);
    assert.ok(foot.y - 176 * layout.figureScale > 0);
    assert.ok(layout.cover.x + (100 * layout.backdrop.width) / 1536 < width);
    assert.ok(layout.backdrop.x <= 0 && layout.backdrop.x + layout.backdrop.width >= width);
  }
  assert.ok(Math.max(...ratios) - Math.min(...ratios) < 1e-8);
});

test("figures on elevated fixed sites stay in front of the backdrop at actual portrait-game heights", () => {
  for (const view of [
    { width: 390, height: 740 },
    { width: 390, height: 844 },
    { width: 1180, height: 790 },
  ]) {
    const layout = waterwayLayout(view.width, view.height);
    if (view.height > view.width) {
      const workingFeet = layout.project(1043, 653);
      assert.ok(
        workingFeet.y > view.height * 0.5 && workingFeet.y < view.height * 0.75,
        "work stays near the dialogue instead of at the top edge",
      );
      assert.ok(layout.backdrop.y + layout.backdrop.height < view.height * 0.9);
    }
    const feet = [
      [1100, 540],
      [985, 670],
      [1217, 340],
    ].map(([x, y]) => layout.world(x, y));
    for (const flag of ["waterway", "packing", "signpost", "defense", "blockade"]) {
      const look = { [flag]: { node: 0 } };
      for (const foot of feet) {
        assert.ok(roadY(foot.lane, view.height, view.width) > 0);
        assert.ok(
          roadFigureDepth(foot.lane, view, look) > 1,
          `${flag}: figures cannot hide behind background/shade`,
        );
      }
      const ordered = [...feet].sort((a, b) => a.lane - b.lane);
      for (let i = 1; i < ordered.length; i++)
        assert.ok(
          roadFigureDepth(ordered[i].lane, view, look) >
            roadFigureDepth(ordered[i - 1].lane, view, look),
        );
    }
  }
});

test("hatch paving remains above the backdrop but below people, and a lifted slab sorts with the keeper", () => {
  for (const view of [
    { width: 390, height: 740 },
    { width: 936, height: 624 },
  ]) {
    const hatches = new RoadMossHatches(13),
      look = { waterway: { node: 14, phase: "open" } };
    let carried = false,
      grounded = false;
    for (let time = 0; time <= 30000; time += 50) {
      hatches.update(time, 14, false, true);
      const scene = { poses: {}, props: [], debrisHidden: true, closeContact: true };
      hatches.paint(scene, view, time, [true, true]);
      const keeper = scene.actors[0];
      const actorDepth = roadFigureDepth(keeper.point.lane, view, look);
      assert.ok(actorDepth > 1);
      for (const prop of scene.props) {
        const depth = waterwayPropDepth(prop, view, look);
        assert.ok(depth > 1);
        if (prop.layer === "ground") {
          grounded = true;
          assert.ok(depth < actorDepth);
        } else if (prop.id.startsWith("inspection-lid")) {
          carried = true;
          assert.ok(Math.abs(depth - actorDepth) < 0.03);
        }
      }
    }
    assert.ok(carried && grounded && hatches.complete);
  }
});
