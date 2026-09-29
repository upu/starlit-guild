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
  LAB_ACTOR_SCALE,
  LAB_WALK_SPEED,
  labTeaCup,
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
    assert.ok(
      Math.abs(foot.x * LAB_ACTOR_SCALE + t * LAB_WALK_SPEED - 18 * LAB_ACTOR_SCALE) < 0.001,
    );
    assert.ok(labFoot(t, 0.5).y <= 0);
  }
  for (const mode of ["tea", "walk", "work", "idle"])
    assert.deepEqual(labPose(500, mode, true), labPose(9500, mode, true));
});

test("tea rim meets the moving mouth and the hand can reach the handle through the whole sip", () => {
  for (let time = 0; time <= 8000; time += 20) {
    const { cup } = labPose(time, "tea", false);
    assert.ok(cup.rim.y >= cup.mouth.y - 0.001, "cup never rises above the mouth");
    const angles = labJoint(cup.hand, 23, 25);
    const angle = angles.upper + angles.lower;
    const x = -Math.sin(angles.upper) * 23 - Math.sin(angle) * 25;
    const y = Math.cos(angles.upper) * 23 + Math.cos(angle) * 25;
    assert.ok(Math.hypot(x - cup.hand.x, y - cup.hand.y) < 0.001);
  }
  for (const head of [-0.035, 0, 0.035]) {
    const cup = labTeaCup(1, head);
    assert.ok(Math.hypot(cup.rim.x - cup.mouth.x, cup.rim.y - cup.mouth.y) < 0.001);
  }
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

test("cutout atlas has fourteen nonempty measured frames and room tiles are square", async () => {
  const path = "public/guild/leon-parts-v2.webp";
  const meta = await sharp(path).metadata();
  assert.equal(meta.hasAlpha, true);
  assert.equal(guildLabArt.frames.length, 14);
  for (const [index, [left, top, width, height]] of guildLabArt.frames.entries()) {
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
    assert.ok(opaque > 20);
    if (index !== guildLabArt.head.blink.frame) assert.ok(transparent > 20);
  }
  const tiles = await sharp("public/guild/room-tiles-v1.webp").metadata();
  assert.equal(tiles.width, 264);
  assert.equal(tiles.height, 264);
});

test("blink patch uses measured head coordinates, preserves the mouth, and tiles have extruded borders", async () => {
  const [hx, hy, hw, hh] = guildLabArt.frames[0];
  const { mouth, blink, displayHeight } = guildLabArt.head;
  const [x, y, w, h] = blink.rect;
  assert.ok(x >= 0 && y >= 0 && x + w <= hw && y + h < mouth.bounds[1]);
  assert.ok(blink.changedPixels > 100);
  const [px, py, pw, ph] = guildLabArt.frames[blink.frame];
  assert.deepEqual([pw, ph], [w, h]);
  const source = await sharp("assets/source/guild/leon-parts-v2.png")
    .extract({ left: hx, top: hy, width: hw, height: hh })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const head = await sharp("public/guild/leon-parts-v2.webp")
    .extract({ left: hx, top: hy, width: hw, height: hh })
    .ensureAlpha()
    .raw()
    .toBuffer();
  assert.equal(head.length, source.length);
  let differences = 0;
  for (let i = 0; i < head.length; i += 4) {
    if (head[i + 3] !== source[i + 3]) differences++;
    if (source[i + 3] > 0 && [0, 1, 2].some((c) => head[i + c] !== source[i + c])) differences++;
  }
  assert.equal(differences, 0, "lossless delivery preserves visible face pixels");
  const patch = await sharp("public/guild/leon-parts-v2.webp")
    .extract({ left: px, top: py, width: pw, height: ph })
    .png()
    .toBuffer();
  const shut = await sharp(head, { raw: { width: hw, height: hh, channels: 4 } })
    .composite([{ input: patch, left: x, top: y }])
    .raw()
    .toBuffer();
  let changed = 0;
  for (let row = 0; row < hh; row++)
    for (let col = 0; col < hw; col++) {
      const i = (row * hw + col) * 4;
      if (
        head[i + 3] !== shut[i + 3] ||
        (head[i + 3] > 0 && [0, 1, 2].some((c) => Math.abs(head[i + c] - shut[i + c]) > 1))
      ) {
        assert.ok(col >= x && col < x + w && row >= y && row < y + h);
        changed++;
      }
    }
  assert.ok(changed > 100);
  const cup = labTeaCup(1, 0),
    scale = displayHeight / hh;
  assert.ok(Math.abs(cup.mouth.x - (3 + (mouth.x - hw / 2) * scale)) < 0.001);
  assert.ok(Math.abs(cup.mouth.y - (-91 + (mouth.y - hh) * scale)) < 0.001);
  const image = await sharp("public/guild/room-tiles-v1.webp").ensureAlpha().raw().toBuffer();
  for (const col of [0, 132])
    for (const row of [0, 132]) {
      for (let n = 0; n < 128; n++) {
        const pixel = (xx, yy) =>
          image.subarray(((row + yy) * 264 + col + xx) * 4, ((row + yy) * 264 + col + xx) * 4 + 4);
        assert.deepEqual(pixel(0, n + 2), pixel(2, n + 2));
        assert.deepEqual(pixel(131, n + 2), pixel(129, n + 2));
        assert.deepEqual(pixel(n + 2, 0), pixel(n + 2, 2));
        assert.deepEqual(pixel(n + 2, 131), pixel(n + 2, 129));
      }
    }
});
