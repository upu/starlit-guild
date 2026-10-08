import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import ts from "typescript";
import {
  adventureEnemyArt as art,
  adventureEnemyIds,
  adventureEnemyAsset,
  ordinaryEnemyArt,
  restyledEnemyAsset,
} from "../lib/adventure-enemy-art.ts";

test("every redrawn enemy has transparent gutters, a shared sole and intact source proportions", async () => {
  const anchors = JSON.parse(await readFile("public/adventure-enemies/anchors.json", "utf8"));
  for (const id of adventureEnemyIds) {
    const { data, info } = await sharp(`public${adventureEnemyAsset(id)}`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(info.width, art.cell);
    assert.equal(info.height, art.cell);
    let bottom = 0;
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++) {
        if (data[(y * info.width + x) * 4 + 3] < 96) continue;
        assert.ok(x >= 8 && x < info.width - 8, `${id}: no horizontal clipping`);
        bottom = Math.max(bottom, y);
      }
    assert.ok(Math.abs(bottom - (art.foot - 1)) <= 2, `${id}: shared grounding`);
    assert.equal(anchors[id].height, Math.round(art.height * anchors[id].originalVisibleFraction));
    const box = anchors[id].source;
    assert.ok(
      Math.abs(anchors[id].width / anchors[id].height - box.width / box.height) < 0.01,
      `${id}: no stretching`,
    );
  }
});

test("legacy opponents resolve to the matching redrawn species", () => {
  assert.deepEqual(
    [8, 9, 10, 11].map((n) => ordinaryEnemyArt(String(n))),
    ["slime", "wolf", "dragon", "plant"],
  );
  assert.equal(ordinaryEnemyArt("slime"), "slime");
  assert.equal(restyledEnemyAsset("/enemies/cargo-golem.png", 8), adventureEnemyAsset("golem"));
  assert.equal(restyledEnemyAsset("/items/chest.png", 8), "/items/chest.png");
});

const source = ts
  .transpileModule(await readFile("app/phaser/road-enemy-appearance.ts", "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  })
  .outputText.replace(
    '"@/lib/adventure-enemy-art"',
    JSON.stringify(new URL("../lib/adventure-enemy-art.ts", import.meta.url).href),
  );
const { enemyAppearance, fitEnemy } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
test("Merrill switches singing art and every road opponent uses the shared scale and origin", () => {
  const enemy = { kind: "merrill", id: 1 };
  assert.equal(enemyAppearance(enemy).asset, adventureEnemyAsset("merrill-standing"));
  assert.equal(
    enemyAppearance({ ...enemy, action: "song" }).asset,
    adventureEnemyAsset("merrill-song"),
  );
  assert.equal(
    enemyAppearance({ kind: "slime", id: 1 }, { enemies: { 1: { frame: "9" } } }).asset,
    adventureEnemyAsset("wolf"),
  );
  for (const kind of ["slime", "pumpety", "puppet", "golem", "lico", "merrill", "mushroom"]) {
    const image = {
      setScale(n) {
        this.scale = n;
        return this;
      },
      setOrigin(x, y) {
        this.origin = [x, y];
        return this;
      },
    };
    fitEnemy(image, { kind }, 81, 0, true);
    assert.equal(image.scale, 81 / art.height);
    assert.deepEqual(image.origin, [0.5, art.foot / art.cell]);
  }
});
