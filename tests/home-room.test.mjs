import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import {
  defaultHome,
  furnitureSpots,
  roomFurniture,
  roomPath,
  blockedCells,
  cellKey,
  layoutError,
} from "../lib/home-room-layout.ts";
import { homeLayoutSchema } from "../lib/home-room-schema.ts";
import { HomeLife } from "../lib/home-room-life.ts";
import { residentIds, residentFrame } from "../lib/home-actor.ts";
import { testState, act } from "../lib/game.ts";
import { guildSchema } from "../lib/save-guild.ts";

test("six accessible seats, legal rooms and reversible furniture edits", () => {
  assert.equal(layoutError(defaultHome), null);
  assert.equal(furnitureSpots(defaultHome[0]).length, 6);
  for (const site of ["home", "linde", "brekka"])
    assert.equal(layoutError(roomFurniture(site)), null);
  const moved = defaultHome.map((f) => (f.id === "fern" ? { ...f, x: 13 } : f));
  assert.ok(homeLayoutSchema.safeParse(moved).success);
  for (const bad of [
    [...defaultHome, { id: "blocked", kind: "plant", x: 8, y: 12 }],
    [...defaultHome, { id: "overlap", kind: "plant", x: 3, y: 8 }],
    defaultHome.map((f) => (f.id === "tea" ? { ...f, x: 0 } : f)),
    defaultHome.map((f) => (f.id === "fern" ? { ...f, x: 1.5 } : f)),
    defaultHome.filter((f) => f.kind !== "bench"),
    [...defaultHome, { id: "invalid", kind: "unknown", x: 3, y: 6 }],
  ])
    assert.equal(homeLayoutSchema.safeParse(bad).success, false);
});
test("room arrangement survives schema and never replaces materials, crops or inventory", () => {
  const original = act(
    testState(1000, 37, 40, 100000),
    { type: "guildBuy", id: "herb-seed" },
    1000,
  );
  const s = act(original, { type: "guildArrange", furniture: defaultHome }, 1000);
  assert.deepEqual(s.guild.home, defaultHome);
  assert.ok(guildSchema.safeParse(s.guild).success);
  assert.equal(original.guild?.home, undefined);
  assert.equal(s.gold, original.gold);
  assert.deepEqual(s.guild.materials, original.guild.materials);
  assert.deepEqual(s.guild.plots, original.guild.plots);
  const old = { ...s.guild };
  delete old.home;
  assert.ok(guildSchema.safeParse(old).success);
  assert.throws(() => act(s, { type: "guildArrange", furniture: [] }, 1000));
});
test("five residents reserve distinct seats and follow walkable paths to relocated furniture", () => {
  const life = new HomeLife();
  life.sync([...residentIds], defaultHome, "tea", false);
  assert.equal(life.residents.length, 5);
  assert.equal(new Set(life.residents.map((r) => cellKey(r.spot))).size, 5);
  assert.ok(life.residents.every((r) => r.pose === "tea"));
  life.sync([...residentIds], defaultHome, "craft", false, "lico");
  for (const r of life.residents)
    for (const cell of r.path) assert.equal(blockedCells(defaultHome).has(cellKey(cell)), false);
  for (let i = 0; i < 3000; i++) life.tick(33, defaultHome, false);
  assert.equal(life.residents.find((r) => r.id === "lico").pose, "craft");
  const before = structuredClone(life.residents),
    t = life.time;
  life.tick(1000, defaultHome, true);
  assert.equal(life.time, t);
  assert.deepEqual(life.residents, before);
  life.greet("lico");
  assert.ok(life.event.includes("リコ"));
  assert.ok(life.residents.find((r) => r.id === "lico").greetUntil > t);
});
test("idle life makes companions respond to each other and does not continuously pace", () => {
  const life = new HomeLife();
  life.sync([...residentIds], defaultHome, "auto", false);
  for (let i = 0; i < 260; i++) life.tick(33, defaultHome, false);
  assert.match(life.event, /笑い合/);
  assert.ok(life.residents.every((r) => !r.path.length));
  assert.equal(roomPath({ x: 8, y: 12 }, { x: 3, y: 8 }, defaultHome), null);
});
test("all five atlases have complete transparent frames and useful motion", async () => {
  const manifest = JSON.parse(readFileSync("public/home-pixel/manifest.json", "utf8"));
  assert.equal(Object.keys(manifest).length, 23);
  for (const id of residentIds) {
    const image = sharp(`public/home-pixel/${id}.webp`),
      meta = await image.metadata();
    assert.equal(meta.width, 320);
    assert.equal(meta.height, 240);
    assert.ok(meta.hasAlpha);
    for (let frame = 0; frame < 12; frame++) {
      const { data, info } = await image
        .clone()
        .extract({ left: (frame % 4) * 80, top: Math.floor(frame / 4) * 80, width: 80, height: 80 })
        .raw()
        .toBuffer({ resolveWithObject: true });
      let opaque = 0,
        border = 0;
      for (let y = 0; y < 80; y++)
        for (let x = 0; x < 80; x++) {
          const alpha = data[(y * 80 + x) * info.channels + 3];
          if (alpha > 96) opaque++;
          if ((x === 0 || x === 79 || y === 0 || y === 79) && alpha > 96) border++;
        }
      assert.ok(opaque > 150, `${id} frame ${frame}`);
      assert.equal(border, 0, `${id} clipped ${frame}`);
    }
  }
  assert.notEqual(residentFrame("craft", 0, false), residentFrame("craft", 500, false));
  assert.equal(residentFrame("walk", 1500, true), residentFrame("walk", 0, true));
});
