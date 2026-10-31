import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { RoadWaterwaySaw, sawLowerFrame } from "../lib/road-waterway-saw.ts";
import { waterwayActionAssets as assets } from "../lib/road-waterway-contacts.ts";

test("saw transfers to the ground only after release and stays there after the worker leaves", () => {
  for (const width of [374, 936]) {
    const saw = new RoadWaterwaySaw(),
      view = { width, height: (width * 2) / 3 };
    let placed;
    for (const [node, time] of [
      [8, 0],
      [8, 250],
      [8, 550],
      [8, 800],
      [9, 1200],
      [14, 6000],
    ]) {
      const scene = { poses: {}, props: [], debrisHidden: false, closeContact: false };
      saw.finish({ time }, { waterway: { node } }, view, scene, false);
      const prop = scene.props.find((p) => p.asset === assets.saw);
      if (node === 8 && time < 550) {
        assert.equal(prop, undefined);
        continue;
      }
      assert.ok(prop);
      placed ??= { ...prop.point };
      assert.deepEqual(prop.point, placed);
      if (node === 8) assert.equal(scene.worker.pose.frame, sawLowerFrame(time, false));
      else
        assert.equal(scene.worker, undefined, "ground saw never drags its owner back to the log");
    }
    assert.equal(sawLowerFrame(0, true), 3);
  }
});

test("saw lowering keeps the worker's head/body scale and complete blade inside each cell", async () => {
  const name = "public/storybook-study/waterway-worker-saw-lower-v1";
  const metrics = JSON.parse(await readFile(`${name}-metrics.json`, "utf8"));
  assert.equal(new Set(metrics.map((m) => m.scale)).size, 1);
  assert.equal(metrics[3].height, 134);
  assert.ok(metrics.slice(0, 3).every((m) => m.height < 134 * 0.85 && m.baseline === 176));
  const { data, info } = await sharp(`${name}.webp`)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (x % 256 < 2 || x % 256 > 253 || y < 2 || y > 189)
        assert.ok(data[(y * info.width + x) * 4 + 3] <= 16);
});

test("worker takes the resting saw before cutting without making a second ground saw", () => {
  const saw = new RoadWaterwaySaw(),
    view = { width: 936, height: 624 };
  const sample = (node, time) => {
    const scene = { poses: {}, props: [], debrisHidden: false, closeContact: false };
    saw.finish({ time }, { waterway: { node } }, view, scene, false);
    return scene;
  };
  assert.equal(sample(3, 0).props.length, 1);
  assert.equal(sample(4, 100).worker.pose.frame, 2);
  const grasp = sample(4, 350);
  assert.equal(grasp.worker.pose.frame, 1);
  assert.equal(grasp.props.length, 0);
  assert.equal(sample(4, 650).worker.pose.frame, 0);
  const cutting = sample(4, 1000);
  assert.equal(cutting.worker, undefined);
  assert.equal(cutting.props.length, 0);
});
