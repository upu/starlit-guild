import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import ts from "typescript";
import { adventureMushroomProjectile } from "../lib/adventure-enemy-art.ts";
const source = ts
  .transpileModule(await readFile("app/phaser/road-duel-effects.ts", "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  })
  .outputText.replace(
    '"@/lib/adventure-enemy-art"',
    JSON.stringify(new URL("../lib/adventure-enemy-art.ts", import.meta.url).href),
  );
const { paintDuelEffect } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
test("Merrill throws the delivered dot-art mushroom around its center along the existing arc", async () => {
  const image = {
    setTexture(v) {
      this.texture = v;
      return this;
    },
    setDisplaySize(w, h) {
      this.size = [w, h];
      return this;
    },
    setPosition(x, y) {
      this.position = [x, y];
      return this;
    },
    setRotation(v) {
      this.rotation = v;
      return this;
    },
    setAlpha(v) {
      this.alpha = v;
      return this;
    },
  };
  assert.equal(
    paintDuelEffect({}, image, { kind: "mushroomThrow" }, 400, 1, 0, 100, 200, 100, false),
    true,
  );
  assert.equal(image.texture, adventureMushroomProjectile);
  assert.deepEqual(image.position, [100, 40]);
  assert.equal(image.rotation, Math.PI);
  assert.equal(image.alpha, 1);
  const meta = await sharp(`public${image.texture}`).metadata();
  assert.equal(meta.height, 384);
  assert.ok(meta.width > 300 && meta.width < 400, "projectile excludes standing-cell padding");
  paintDuelEffect({}, image, { kind: "mushroomThrow" }, 800, 1, 0, 100, 200, 100, false);
  assert.equal(image.alpha, 0);
});
