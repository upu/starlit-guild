import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EventEmitter } from "node:events";
import ts from "typescript";

const code = ts.transpileModule(readFileSync("app/phaser/adventure-resolution.ts", "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { bindAdventureResolution, freezeAdventureScene } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
);

test("pausing commits the painted frame before sleeping without advancing simulation", () => {
  const calls = [];
  const scene = {
    game: {
      renderer: { preRender: () => calls.push("pre"), postRender: () => calls.push("post") },
      scene: {
        render: () => calls.push("render"),
        update: () => assert.fail("simulation advanced"),
      },
      loop: { sleep: () => calls.push("sleep"), wake: () => assert.fail("loop restarted") },
    },
  };
  freezeAdventureScene(
    scene,
    () => calls.push("paint"),
    () => false,
  );
  assert.deepEqual(calls, ["paint", "pre", "render", "post", "sleep"]);
  calls.length = 0;
  freezeAdventureScene(
    scene,
    () => calls.push("paint"),
    () => true,
  );
  assert.deepEqual(calls, ["paint", "sleep"]);
});

test("initially paused scenes finish late image queues before sleeping", () => {
  const calls = [];
  let loading = false;
  const scene = {
    game: {
      renderer: { preRender() {}, postRender() {} },
      scene: { render() {}, update: () => assert.fail("simulation advanced") },
      loop: { sleep: () => calls.push("sleep"), wake: () => calls.push("wake") },
    },
  };
  freezeAdventureScene(
    scene,
    () => {
      loading = true;
    },
    () => false,
    () => loading,
  );
  assert.deepEqual(calls, ["wake"]);
  loading = false;
  freezeAdventureScene(
    scene,
    () => {},
    () => false,
    () => loading,
  );
  assert.deepEqual(calls, ["wake", "sleep"]);
});

test("dense rendering preserves CSS layout and world positions across resize and cleans up", () => {
  const previous = globalThis.window;
  try {
    const camera = {
      setSize(width, height) {
        Object.assign(this, { width, height });
        return this;
      },
      setZoom(zoomX, zoomY) {
        Object.assign(this, { zoomX, zoomY });
        return this;
      },
      setScroll(scrollX, scrollY) {
        Object.assign(this, { scrollX, scrollY });
        return this;
      },
    };
    const scale = Object.assign(new EventEmitter(), { width: 390, height: 610 });
    const renderer = {
      resize(width, height) {
        Object.assign(this, { width, height });
      },
    };
    const scene = {
      scale,
      events: new EventEmitter(),
      game: { canvas: {}, renderer },
      cameras: { main: camera },
    };
    globalThis.window = { devicePixelRatio: 1 };
    bindAdventureResolution(scene);
    for (const [width, height, dpr] of [
      [390, 610, 1],
      [390, 610, 2],
      [390, 610, 3],
      [844, 250, 3],
      [321, 567, 1.25],
      [390, 610, 4],
      [390, 610, 1],
    ]) {
      Object.assign(scale, { width, height });
      window.devicePixelRatio = dpr;
      scale.emit("resize");
      assert.equal(scale.width, width);
      assert.equal(scale.height, height);
      assert.equal(scene.game.canvas.width, Math.round(width * Math.min(dpr, 3)));
      assert.equal(scene.game.canvas.height, Math.round(height * Math.min(dpr, 3)));
      assert.equal(renderer.width, scene.game.canvas.width);
      assert.equal(renderer.height, scene.game.canvas.height);
      // Phaser's centered zoom + scroll must map every world point back to
      // the same CSS position when the physical canvas is displayed at 100%.
      for (const [point, logical, physical, zoom, scroll] of [
        [87, width, camera.width, camera.zoomX, camera.scrollX],
        [200, height, camera.height, camera.zoomY, camera.scrollY],
      ]) {
        const pixel = physical / 2 + (point - scroll - physical / 2) * zoom;
        assert.ok(Math.abs((pixel / physical) * logical - point) < 1e-9);
      }
    }
    scene.events.emit("shutdown");
    assert.equal(scale.listenerCount("resize"), 0);
  } finally {
    globalThis.window = previous;
  }
});
