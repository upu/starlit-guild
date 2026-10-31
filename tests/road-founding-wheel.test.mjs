import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { RoadFoundingWheel } from "../app/phaser/road-founding-wheel.ts";
import { foundingCartBody, foundingWheel } from "../lib/road-founding-wheel.ts";
import { tradeWheelAsset } from "../lib/road-trade-cart-wheels.ts";

test("founding cart body preserves the canvas and crossbar while removing the wheel", async () => {
  for (const path of ["/storybook-study/garden-handcart-v2.webp", foundingCartBody]) {
    const { data, info } = await sharp(`public${path}`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.deepEqual([info.width, info.height], [512, 320]);
    const alpha = (x, y) => data[(y * info.width + x) * 4 + 3];
    assert.equal(alpha(0, 0), 0);
    assert.equal(alpha(511, 319), 0);
    for (const [x, y] of [
      [110, 50],
      [420, 280],
      [450, 258],
      [480, 238],
    ])
      assert.ok(alpha(x, y) > 128, `${path} keeps tray and crossbar`);
    assert.equal(alpha(100, 275) > 128, path !== foundingCartBody, "wheel is a separate layer");
  }
});

function fakeScene() {
  const object = () => ({
    setVisible(value) {
      this.visible = value;
      return this;
    },
    setPosition(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },
    setScale(x, y) {
      this.scaleX = x;
      this.scaleY = y;
      return this;
    },
    setDepth(value) {
      this.depth = value;
      return this;
    },
    setDisplaySize(width, height) {
      this.width = width;
      this.height = height;
      return this;
    },
    setRotation(value) {
      this.rotation = value;
      return this;
    },
  });
  const result = { scale: { width: 936 }, add: {} };
  result.add.image = (_x, _y, asset) => (result.image = Object.assign(object(), { asset }));
  result.add.container = (_x, _y, children) =>
    (result.group = Object.assign(object(), { children }));
  return result;
}

test("wheel turns inside a fixed perspective, and pauses with its cart", () => {
  const scene = fakeScene(),
    renderer = new RoadFoundingWheel(scene);
  const state = { time: 0, stage: "forest", journeyCart: { x: 100, phase: "moving" } };
  const paint = (visible = true, reduced = false) =>
    renderer.paint(state, visible, 300, 200, 120, 4, reduced);
  paint();
  assert.equal(scene.image.asset, tradeWheelAsset);
  assert.deepEqual(scene.group.children, [scene.image]);
  assert.equal(scene.group.scaleX, foundingWheel.width / foundingWheel.height);
  assert.equal(scene.group.scaleY, 1);
  assert.equal(scene.image.width, 120 * foundingWheel.height);
  assert.equal(scene.image.height, scene.image.width);
  assert.equal(scene.group.x, 300 + 120 * foundingWheel.x);
  assert.equal(scene.group.y, 200 + 120 * foundingWheel.y);
  state.time = 1000;
  state.journeyCart.x += 20;
  paint();
  const angle = scene.image.rotation;
  assert.ok(angle > 0);
  state.time += 1000;
  state.journeyCart.phase = "parked";
  paint();
  assert.equal(scene.image.rotation, angle);
  paint(false);
  assert.equal(scene.group.visible, false);
  state.time += 1000;
  state.journeyCart.phase = "moving";
  paint();
  assert.equal(scene.image.rotation, angle, "returning to the scene does not jump");
  paint(true, true);
  assert.equal(scene.image.rotation, 0, "reduced motion uses a stationary wheel");
});
