import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { headBounds, spriteBounds, rowCuts } from "../scripts/home-pixel-frames.mjs";
import {
  defaultHome,
  furnitureSpots,
  roomFurniture,
  roomPath,
  blockedCells,
  cellKey,
  cellPoint,
  layoutError,
} from "../lib/home-room-layout.ts";
import { homeLayoutSchema } from "../lib/home-room-schema.ts";
import { HomeLife } from "../lib/home-room-life.ts";
import { teaChairPosition, residentDisplayPosition } from "../lib/home-room-presentation.ts";
import {
  residentArt,
  residentIds,
  residentFrame,
  walkFrame,
  residentAnimation,
  residentHand,
} from "../lib/home-actor.ts";
import { homeFloor, gardenScenery } from "../lib/home-room-scenery.ts";
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
  const oldSideDesk = defaultHome.map((f) => (f.id === "bench" ? { ...f, y: 11 } : f));
  assert.ok(homeLayoutSchema.safeParse(oldSideDesk).success);
  assert.equal(layoutError(oldSideDesk), "家具までの通路を空けてください");
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

test("compact tea seating keeps occupied/empty chairs aligned after moving a table", () => {
  const life = new HomeLife();
  life.sync([...residentIds], defaultHome, "tea", false);
  const table = defaultHome[0];
  const moved = { ...table, x: table.x + 2, y: table.y - 1 };
  const seats = [];
  for (let seat = 0; seat < 6; seat++) {
    const r = { ...life.residents[0], seat, ...cellPoint(furnitureSpots(table)[seat]) };
    const chair = teaChairPosition(table, seat);
    assert.deepEqual(residentDisplayPosition(r, [table]), chair);
    const relocated = { ...r, ...cellPoint(furnitureSpots(moved)[seat]) };
    const target = residentDisplayPosition(relocated, [moved]);
    assert.ok(Math.abs(target.x - chair.x - 48) < 1e-8);
    assert.ok(Math.abs(target.y - chair.y + 24) < 1e-8);
    seats.push(chair);
    assert.deepEqual(residentDisplayPosition({ ...r, pose: "walk" }, [table]), { x: r.x, y: r.y });
  }
  for (let i = 0; i < seats.length; i++)
    for (let j = i + 1; j < seats.length; j++)
      assert.ok(Math.hypot(seats[i].x - seats[j].x, seats[i].y - seats[j].y) > 30);
});
test("all five atlases have complete transparent frames and useful motion", async () => {
  const manifest = JSON.parse(readFileSync("public/home-pixel/manifest.json", "utf8"));
  assert.equal(Object.keys(manifest).length, 41);
  for (const id of residentIds)
    for (const suffix of ["", "-actions"]) {
      const image = sharp(`public/home-pixel/${id}${suffix}.webp`),
        meta = await image.metadata();
      const size = residentArt.cell;
      assert.equal(meta.width, size * 4);
      assert.equal(meta.height, size * (suffix ? 3 : 4));
      assert.ok(meta.hasAlpha);
      for (let frame = 0; frame < (suffix ? 12 : residentArt.frames); frame++) {
        const { data, info } = await image
          .clone()
          .extract({
            left: (frame % 4) * size,
            top: Math.floor(frame / 4) * size,
            width: size,
            height: size,
          })
          .raw()
          .toBuffer({ resolveWithObject: true });
        let opaque = 0,
          border = 0;
        for (let y = 0; y < size; y++)
          for (let x = 0; x < size; x++) {
            const alpha = data[(y * size + x) * info.channels + 3];
            if (alpha > 96) opaque++;
            if ((x === 0 || x === size - 1 || y === 0 || y === size - 1) && alpha > 96) border++;
          }
        assert.ok(opaque > 150, `${id} frame ${frame}`);
        assert.equal(border, 0, `${id} clipped ${frame}`);
      }
    }
  assert.notEqual(residentFrame("craft", 0, false), residentFrame("craft", 500, false));
  assert.equal(residentFrame("walk", 1500, true), residentFrame("walk", 0, true));
});

test("work approaches the front of a desk, rear walking follows route direction", () => {
  const life = new HomeLife();
  life.sync([...residentIds], defaultHome, "auto", false);
  for (const r of life.residents.filter((r) => ["craft", "paper"].includes(r.pose))) {
    const f = defaultHome.find((f) => f.id === r.furniture);
    assert.deepEqual(r.spot, { x: f.x + 1, y: f.y + 2 });
    assert.equal(r.rear, true);
  }
  const r = life.residents[0];
  Object.assign(r, { x: 36, y: 300, pose: "walk", path: [{ x: 1, y: 11 }], greetUntil: 0 });
  life.tick(33, defaultHome, false);
  assert.equal(r.rear, true);
  r.path = [{ x: 2, y: 12 }];
  life.tick(33, defaultHome, false);
  assert.equal(r.rear, false);
  assert.equal(residentHand("lico"), "left");
  for (const id of residentIds.filter((id) => id !== "lico"))
    assert.equal(residentHand(id), "right");
});

test("registered walk heads do not jump with a lifted foot or a moving cape", async () => {
  for (const id of residentIds)
    for (const suffix of ["", "-actions"]) {
      const image = sharp(`public/home-pixel/${id}${suffix}.webp`);
      const centers = [],
        tops = [];
      for (let f = 0; f < (suffix ? 6 : 8); f++) {
        const cell = await image
          .clone()
          .extract({
            left: (f % 4) * residentArt.cell,
            top: Math.floor(f / 4) * residentArt.cell,
            width: residentArt.cell,
            height: residentArt.cell,
          })
          .png()
          .toBuffer();
        const box = await spriteBounds(cell);
        const head = await headBounds(await sharp(cell).extract(box).png().toBuffer());
        centers.push(box.left + head.left + head.width / 2);
        tops.push(box.top + head.top);
      }
      assert.ok(
        ((Math.max(...centers) - Math.min(...centers)) * residentArt.displayCell) /
          residentArt.cell <=
          1,
        `${id}${suffix} head horizontal jitter ${centers}`,
      );
      assert.ok(
        ((Math.max(...tops) - Math.min(...tops)) * residentArt.displayCell) / residentArt.cell <=
          0.5,
        `${id}${suffix} head vertical jitter ${tops}`,
      );
    }
});

test("walking transfers weight twice per stride without idle or clock-driven pulsing", () => {
  for (const rear of [false, true]) {
    const scale = (distance, time = 0) =>
      residentAnimation("walk", time, distance, false, rear).heightScale;
    assert.ok(scale(0) < scale(6));
    assert.equal(scale(0), scale(12));
    assert.equal(scale(12), scale(24));
    assert.equal(scale(6), scale(18));
    for (let d = 0; d < 24; d += 0.1) {
      assert.ok(scale(d) >= 0.965 && scale(d) <= 1);
      assert.ok(Math.abs(scale(d + 0.1) - scale(d)) < 0.001);
      assert.equal(scale(d), scale(d, 9000));
      assert.equal(residentAnimation("walk", 9000, d, true, rear).heightScale, 1);
    }
  }
  for (const pose of ["idle", "wave", "tea", "craft", "paper", "garden"])
    assert.equal(residentAnimation(pose, 9000, 12, false).heightScale, 1);
});

test("all five rear steps exchange the lower planted foot", async () => {
  for (const id of residentIds) {
    const centers = [];
    for (const frame of [0, 3]) {
      const { data } = await sharp(`public/home-pixel/${id}-actions.webp`)
        .extract({
          left: frame * residentArt.cell,
          top: 0,
          width: residentArt.cell,
          height: residentArt.cell,
        })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      let pixels = 0,
        xSum = 0;
      // Feet at the floor; exclude coat/skirt and the raised sole.
      for (let y = residentArt.foot - 5; y < residentArt.foot + 2; y++)
        for (let x = 0; x < residentArt.cell; x++)
          if (data[(y * residentArt.cell + x) * 4 + 3] > 96) {
            pixels++;
            xSum += x;
          }
      assert.ok(pixels > 8);
      centers.push(xSum / pixels);
    }
    assert.ok(
      (Math.abs(centers[1] - centers[0]) * residentArt.displayCell) / residentArt.cell > 3,
      `${id} must alternate planted legs: ${centers}`,
    );
  }
});

test("source row gutters do not cut the next walk frame's hair", async () => {
  for (const id of residentIds) {
    const source = readFileSync(`assets/source/home-pixel/${id}-walk-v5.png`);
    const cuts = await rowCuts(source, 2);
    const { data } = await sharp(source)
      .extract({ left: 0, top: cuts[1], width: 1536, height: 1 })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let x = 0; x < 1536; x++) assert.ok(data[x * 4 + 3] < 96, `${id} row gutter`);
  }
});

test("new action loops freeze with reduced motion and the two gardens have distinct scenery", () => {
  for (const pose of ["tea", "craft", "paper", "walk"]) {
    assert.deepEqual(
      residentAnimation(pose, 100, 2, true, true),
      residentAnimation(pose, 9400, 81, true, true),
    );
    assert.equal(residentAnimation(pose, 100, 2, false, true).action, true);
  }
  assert.notDeepEqual(homeFloor("linde", 0, 6), homeFloor("brekka", 0, 6));
  assert.notDeepEqual(gardenScenery.linde, gardenScenery.brekka);
});

test("eight walk phases follow travelled distance, stopping for greetings and rest", () => {
  assert.deepEqual(
    Array.from({ length: 8 }, (_, i) => walkFrame(i * 3)),
    [0, 1, 2, 3, 4, 5, 6, 7],
  );
  assert.equal(walkFrame(24), 0);
  assert.equal(walkFrame(21, true), 0);
  const life = new HomeLife();
  life.sync([...residentIds], defaultHome, "auto", false);
  life.sync([...residentIds], defaultHome, "tea", false);
  const moving = life.residents.find((r) => r.path.length);
  assert.ok(moving);
  const start = { x: moving.x, y: moving.y, distance: moving.walkDistance };
  life.tick(33, defaultHome, false);
  assert.ok(
    Math.abs(
      moving.walkDistance - start.distance - Math.hypot(moving.x - start.x, moving.y - start.y),
    ) < 1e-8,
  );
  life.greet(moving.id);
  const distance = moving.walkDistance;
  life.tick(33, defaultHome, false);
  assert.equal(moving.walkDistance, distance);
});
