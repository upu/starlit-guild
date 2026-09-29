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
  labLegTarget,
  labFarHand,
} from "../lib/guild-lab-model.ts";
import { labRig } from "../lib/guild-lab-rig.ts";
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

test("cutout atlas has twenty-three nonempty measured frames and room tiles are square", async () => {
  const path = "public/guild/leon-parts-v3.webp";
  const meta = await sharp(path).metadata();
  assert.equal(meta.hasAlpha, true);
  assert.equal(guildLabArt.frames.length, 23);
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
  const head = await sharp("public/guild/leon-parts-v3.webp")
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
  const patch = await sharp("public/guild/leon-parts-v3.webp")
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
  assert.ok(Math.abs(cup.mouth.x - (labRig.head.x + (mouth.x - hw / 2) * scale)) < 0.001);
  assert.ok(Math.abs(cup.mouth.y - (labRig.head.y + (mouth.y - hh) * scale)) < 0.001);
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

test("planted knees extend to 96 percent reach without sliding or leaving the floor", () => {
  for (let t = 0; t < 900; t += 10)
    for (const offset of [0, 0.5]) {
      const pose = labPose(t, "walk", false);
      const target = labLegTarget(t, offset, "walk", pose.bob);
      const [upper, lower] = labRig.legs[0].lengths;
      const distance = Math.hypot(target.x, target.y);
      if ((t / 900 + offset) % 1 < 0.5) {
        assert.ok(distance / (upper + lower) >= 0.95 && distance / (upper + lower) <= 0.97);
        const angle = labJoint(target, upper, lower, -1);
        assert.ok(Math.abs(angle.lower) < 0.65, "planted knee bends less than 38 degrees");
        assert.ok(Math.abs(labRig.legs[0].joint.y + pose.bob + target.y) < 0.001);
        const next = labLegTarget(t + 1, offset, "walk", labPose(t + 1, "walk", false).bob);
        assert.ok(Math.abs((next.x - target.x) * LAB_ACTOR_SCALE + LAB_WALK_SPEED) < 0.001);
      } else assert.ok(distance < (upper + lower) * 0.97, "only the swinging knee folds");
    }
});

test("far shoulder sits inside the painted torso and its hand swings opposite the near arm", async () => {
  const [left, top, width, height] = guildLabArt.frames[2],
    torso = labRig.torso;
  const arm = labRig.arms[0];
  const scale = torso.height / height;
  const x = Math.round(width / 2 + (arm.joint.x - torso.x) / scale);
  const y = Math.round(height / 2 + (arm.joint.y - torso.y) / scale);
  const pixels = await sharp("public/guild/leon-parts-v3.webp")
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer();
  // Check a visible margin around the attachment, not just a point at the edge.
  for (let dx = -8; dx <= 8; dx++)
    for (let dy = -8; dy <= 8; dy++) assert.ok(pixels[((y + dy) * width + x + dx) * 4 + 3] > 240);
  assert.ok(arm.joint.x + labFarHand(0, "idle").x < 0, "idle glove rests behind the torso");
  for (const t of [225, 675]) {
    const near = labPose(t, "walk", false).hand.x;
    assert.ok((labFarHand(t, "walk").x + 8) * near < 0);
  }
  assert.ok(labRig.head.y > -91 && labRig.head.y < labRig.scarf.y + 2);
});

test("painted hip caps stay behind the opaque coat hem while seated and throughout a stride", async () => {
  const pixels = async (frame) => {
    const [left, top, width, height] = guildLabArt.frames[frame];
    return {
      width,
      height,
      data: await sharp("public/guild/leon-parts-v3.webp")
        .extract({ left, top, width, height })
        .ensureAlpha()
        .raw()
        .toBuffer(),
    };
  };
  const torso = await pixels(labRig.torso.frame);
  const torsoScale = labRig.torso.height / torso.height;
  for (const [index, leg] of labRig.legs.entries()) {
    assert.ok(leg.layer < labRig.torso.layer);
    const thigh = await pixels(leg.frames[0]);
    const scale = (leg.lengths[0] * (1 + leg.overlap[0][0] + leg.overlap[0][1])) / thigh.height;
    // The closed proximal oval occupies the first 35 source rows of each thigh.
    const cap = [];
    for (let row = 0; row < 35; row++)
      for (let col = 0; col < thigh.width; col++) {
        if (thigh.data[(row * thigh.width + col) * 4 + 3] > 200)
          cap.push({
            x: (col - thigh.width / 2) * scale,
            y: row * scale - leg.lengths[0] * leg.overlap[0][0],
          });
      }
    for (const mode of ["tea", "walk", "work"])
      for (let t = 0; t < 900; t += 15) {
        const pose = labPose(t, mode, false);
        const target = labLegTarget(t, index / 2, mode, pose.bob);
        const a = labJoint(target, ...leg.lengths, leg.bend).upper;
        for (const point of cap) {
          const x = leg.joint.x + point.x * Math.cos(a) - point.y * Math.sin(a);
          const y = leg.joint.y + point.x * Math.sin(a) + point.y * Math.cos(a);
          const tx = Math.round((x - labRig.torso.x) / torsoScale + torso.width / 2);
          const ty = Math.round((y - labRig.torso.y) / torsoScale + torso.height / 2);
          assert.ok(
            torso.data[(ty * torso.width + tx) * 4 + 3] > 240,
            `thigh ${index}, ${mode}, ${t}ms: hip cap covered by coat`,
          );
        }
      }
  }
});
