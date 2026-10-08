import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const code = ts
  .transpileModule(readFileSync("app/phaser/road-sprite-filter.ts", "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  })
  .outputText.replace(
    '"@/lib/adventure-pixel-sampling"',
    JSON.stringify(new URL("../lib/adventure-pixel-sampling.ts", import.meta.url).href),
  );
const { RoadSpriteFilter } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
);

test("sprite filtering preserves the figure's size and feet, isolates poses and reuses cached frames", () => {
  const previous = globalThis.document,
    canvases = [],
    draws = [],
    textures = new Map();
  globalThis.document = {
    createElement() {
      const canvas = {
        width: 0,
        height: 0,
        getContext() {
          return {
            drawImage(...args) {
              draws.push(args);
            },
          };
        },
      };
      canvases.push(canvas);
      return canvas;
    },
  };
  try {
    const scene = {
      cameras: { main: { zoomX: 1, zoomY: 1 } },
      textures: {
        exists: (key) => textures.has(key),
        addCanvas(key, canvas) {
          const texture = {
            canvas,
            setFilter(mode) {
              this.filter = mode;
            },
            add(name, source, x, y, w, h) {
              this.frame = { name, x, y, w, h };
            },
          };
          textures.set(key, texture);
          return texture;
        },
      },
    };
    const native = {
      cutX: 512,
      cutY: 256,
      cutWidth: 512,
      cutHeight: 640,
      name: "walk-2",
      source: { image: {} },
    };
    const makeImage = () => ({
      frame: native,
      texture: { key: "mira" },
      displayWidth: 72,
      displayHeight: 90,
      originX: 0.46,
      originY: 0.97,
      setTexture(key) {
        this.texture = { key };
        return this;
      },
      setDisplaySize(w, h) {
        this.displayWidth = w;
        this.displayHeight = h;
        return this;
      },
      setOrigin(x, y) {
        this.originX = x;
        this.originY = y;
        return this;
      },
    });
    const filter = new RoadSpriteFilter(scene),
      image = makeImage();
    filter.apply(image);
    assert.deepEqual(
      [image.displayWidth, image.displayHeight, image.originX, image.originY],
      [72, 90, 0.46, 0.97],
    );
    assert.deepEqual(draws[0].slice(1, 5), [512, 256, 512, 640]);
    const cached = textures.get(image.texture.key);
    assert.equal(cached.canvas.width, 128);
    assert.equal(cached.canvas.height, 128);
    assert.ok(cached.frame.w <= 128 && cached.frame.h <= 128);
    const count = canvases.length;
    filter.apply(makeImage());
    assert.equal(canvases.length, count);
    assert.equal(textures.size, 1);
    scene.cameras.main.zoomX = scene.cameras.main.zoomY = 3;
    const dense = makeImage();
    filter.apply(dense);
    assert.equal(textures.get(dense.texture.key).canvas.width, 512);
    assert.deepEqual(
      [dense.displayWidth, dense.displayHeight, dense.originX, dense.originY],
      [72, 90, 0.46, 0.97],
    );
    const denseCount = canvases.length;
    filter.apply(makeImage());
    assert.equal(canvases.length, denseCount);
    scene.cameras.main.zoomX = scene.cameras.main.zoomY = 1;
    filter.apply(makeImage());
    assert.equal(canvases.length, denseCount);
    assert.equal(textures.size, 2);
    const pixel = makeImage();
    filter.applyPixel(pixel, 90);
    const pixelTexture = textures.get(pixel.texture.key);
    assert.equal(pixelTexture.filter, 0, "nearest sampling for enemy pixels");
    assert.deepEqual([pixelTexture.canvas.width, pixelTexture.canvas.height], [77, 96]);
    assert.deepEqual(
      [pixel.displayWidth, pixel.displayHeight, pixel.originX, pixel.originY],
      [72, 90, 0.46, 0.97],
    );
    const pixelCount = canvases.length;
    scene.cameras.main.zoomX = scene.cameras.main.zoomY = 3;
    const densePixel = makeImage();
    filter.applyPixel(densePixel, 90);
    assert.equal(densePixel.texture.key, pixel.texture.key, "DPR does not change the pixel pitch");
    assert.equal(canvases.length, pixelCount, "same isolated pixel texture is cached");
    const animated = makeImage();
    animated.displayWidth = 20;
    animated.displayHeight = 96;
    filter.applyPixel(animated, 90, { width: 72, height: 90 });
    assert.equal(
      animated.texture.key,
      pixel.texture.key,
      "song turns and squash keep the same sampled pose",
    );
    assert.equal(animated.displayWidth, 20, "animation transform is retained");
  } finally {
    globalThis.document = previous;
  }
});
