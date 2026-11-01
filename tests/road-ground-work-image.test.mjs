import test from "node:test";
import assert from "node:assert/strict";
import { paintGroundWorkImage } from "../app/phaser/road-ground-work-image.ts";

test("a hidden logical job never resolves its nonexistent image frame", () => {
  const image = {
    visible: false,
    get texture() {
      throw Error("hidden texture must not be read");
    },
    setTexture() {
      throw Error("housecalls is not an atlas frame");
    },
  };
  const offset = paintGroundWorkImage(
    image,
    { storybookHeroes: true, work: { frame: "housecalls" } },
    { kind: "herb" },
    { width: 390, height: 741 },
    { asset: "/animations/road/worksites-v1.webp", frame: "housecalls" },
  );
  assert.equal(offset, 0, "caption stays on the ground without stale image bounds");
});

test("a visible job can resume after a hidden frame with its texture and drawing properties", () => {
  const calls = [];
  const image = {
    visible: false,
    texture: { key: "old" },
    frame: { name: "old", width: 50 },
    displayHeight: 60,
    originY: 0.5,
    setTexture(asset, frame) {
      calls.push(["texture", asset, frame]);
      this.texture.key = asset;
      this.frame.name = frame;
      return this;
    },
    setOrigin(x, y) {
      this.originY = y;
      return this;
    },
    setPosition(x, y) {
      calls.push(["position", x, y]);
      return this;
    },
    setScale(scale) {
      calls.push(["scale", scale]);
      return this;
    },
    setTint(tint) {
      calls.push(["tint", tint]);
      return this;
    },
    setDepth(depth) {
      calls.push(["depth", depth]);
      return this;
    },
    setFlipX(flip) {
      calls.push(["flip", flip]);
      return this;
    },
  };
  const look = { work: { frame: "cart" }, puller: "leon", night: true };
  const point = { kind: "cargo", task: "carry" };
  const view = { width: 936, height: 624 };
  const draw = {
    x: 300,
    y: 400,
    lane: 0.7,
    size: 100,
    offset: 12,
    asset: "cart",
    frame: "cart",
    depth: 4,
  };
  assert.equal(paintGroundWorkImage(image, look, point, view, draw), 0);
  assert.equal(calls.length, 0);
  image.visible = true;
  assert.equal(paintGroundWorkImage(image, look, point, view, draw), 0);
  assert.deepEqual(calls, [
    ["texture", "cart", "cart"],
    ["position", 300, 388],
    ["scale", 2],
    ["tint", 0xd1d1d1],
    ["depth", 4],
    ["flip", true],
  ]);
});
