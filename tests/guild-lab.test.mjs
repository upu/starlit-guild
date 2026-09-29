import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  labJoint,
  labFoot,
  labPose,
  labPath,
  labTravel,
  labStations,
  labFurniture,
  LAB_TILE,
} from "../lib/guild-lab-model.ts";
import { guildLabArt } from "../lib/guild-lab-art.ts";

test("cutout joints reach hand/foot targets and stay finite at unreachable positions", () => {
  for (const target of [
    { x: 25, y: 4 },
    { x: 22, y: 25 },
    { x: -15, y: 40 },
  ]) {
    const angles = labJoint(target, 23, 25);
    const angle = angles.upper + angles.lower;
    const x = -Math.sin(angles.upper) * 23 - Math.sin(angle) * 25;
    const y = Math.cos(angles.upper) * 23 + Math.cos(angle) * 25;
    assert.ok(Math.hypot(x - target.x, y - target.y) < 0.001);
  }
  for (const target of [
    { x: 0, y: 0 },
    { x: 100, y: -80 },
  ]) {
    const angles = labJoint(target, 23, 25);
    assert.ok(Number.isFinite(angles.upper) && Number.isFinite(angles.lower));
  }
});

test("walking keeps a planted foot stationary at the actor's travel speed", () => {
  for (let t = 0; t < 400; t += 20) {
    const foot = labFoot(t, 0);
    assert.equal(foot.y, 0);
    assert.ok(Math.abs(foot.x + t * 0.08 - 18) < 0.001);
    assert.ok(labFoot(t, 0.5).y <= 0);
  }
  for (const mode of ["tea", "walk", "work", "idle"])
    assert.deepEqual(labPose(500, mode, true), labPose(9500, mode, true));
});

test("room routes finish once, snapshot their start, and use the aisle outside the table", () => {
  const start = { ...labStations.tea };
  const route = labPath(start, "work");
  start.x = 999;
  assert.deepEqual(route[0], labStations.tea);
  const table = labFurniture.find((item) => item.id === "table");
  for (const path of [route, labPath(labStations.work, "tea"), labPath(labStations.tea, "walk")]) {
    for (let distance = 0; distance < 1200; distance += 5) {
      const point = labTravel(path, distance);
      assert.equal(
        point.x > table.col * LAB_TILE &&
          point.x < (table.col + table.cols) * LAB_TILE &&
          point.y > table.row * LAB_TILE &&
          point.y < (table.row + table.rows) * LAB_TILE,
        false,
      );
    }
    assert.deepEqual(labTravel(path, 2000), labTravel(path, 5000));
    assert.equal(labTravel(path, 2000).moving, false);
  }
});

test("cutout atlas has sixteen separate nonempty alpha bounds and room tiles are square", async () => {
  const path = "public/guild/leon-parts-v1.webp";
  const meta = await sharp(path).metadata();
  assert.equal(meta.hasAlpha, true);
  assert.equal(guildLabArt.frames.length, 16);
  for (const [left, top, width, height] of guildLabArt.frames) {
    assert.ok(left >= 0 && top >= 0 && left + width <= meta.width && top + height <= meta.height);
    const { data } = await sharp(path)
      .extract({ left, top, width, height })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let opaque = 0,
      transparent = 0;
    for (let n = 3; n < data.length; n += 4) {
      if (data[n] > 100) opaque++;
      if (data[n] === 0) transparent++;
    }
    assert.ok(opaque > 20 && transparent > 20);
  }
  const tiles = await sharp("public/guild/room-tiles-v1.webp").metadata();
  assert.equal(tiles.width, 1024);
  assert.equal(tiles.height, 1024);
});
