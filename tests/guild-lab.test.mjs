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
import { labLimbPaintOrder, labRig } from "../lib/guild-lab-rig.ts";
import { guildLabArt } from "../lib/guild-lab-art.ts";
import { labWalkingArm, labArmArtwork, LabArmMotion } from "../lib/guild-lab-arms.ts";
import { labLimbArtwork } from "../lib/guild-lab-limbs.ts";
import { guildLabAriaArt } from "../lib/guild-lab-aria-art.ts";
import { labRigs } from "../lib/guild-lab-rig.ts";
import { labCharacters } from "../lib/guild-lab-characters.ts";
import { labMouth, labPathTo } from "../lib/guild-lab-model.ts";
import { labPairBeat, labPairFeeling, labSharingProps } from "../lib/guild-lab-pair.ts";
import {
  LAB_PAIR_MIN_DISTANCE,
  labKeepDistance,
  labPairDestination,
} from "../lib/guild-lab-spacing.ts";

test("thighs paint over boot cuffs while forearms paint over upper sleeves", () => {
  for (const leg of labRig.legs) {
    assert.equal(leg.front, "upper");
    assert.deepEqual(labLimbPaintOrder(leg.front), ["lower", "upper"]);
  }
  for (const arm of labRig.arms) {
    assert.equal(arm.front, "lower");
    assert.deepEqual(labLimbPaintOrder(arm.front), ["upper", "lower"]);
  }
});

test("walking arms stay in shoulder limits with forward-only elbow flexion", () => {
  for (let index = 0; index < 2; index++) {
    const config = labRig.arms[index];
    for (let t = 0; t < 900; t += 5) {
      const a = labWalkingArm(t, index),
        shoulder = (-a.upper * 180) / Math.PI,
        elbow = (-a.lower * 180) / Math.PI;
      assert.ok(
        shoulder >= config.walkShoulder.back - 1e-8 &&
          shoulder <= config.walkShoulder.forward + 1e-8,
      );
      assert.ok(elbow >= 5 && elbow <= 35 && a.lower <= 0);
      if (Math.abs(shoulder - config.walkShoulder.back) < 0.2) assert.ok(elbow <= 10);
    }
  }
});
test("arm extrema coincide with diagonal foot contact and opposite arm phases", () => {
  for (const [index, contact] of [
    [1, 0],
    [0, 450],
  ]) {
    const config = labRig.arms[index];
    assert.equal(labFoot(contact, index ? 0 : 0.5).x, 18);
    assert.ok(
      Math.abs(
        labWalkingArm(contact, index).upper + (config.walkShoulder.forward * Math.PI) / 180,
      ) < 1e-8,
    );
    assert.ok(
      Math.abs(
        labWalkingArm(contact + 450, index).upper + (config.walkShoulder.back * Math.PI) / 180,
      ) < 1e-8,
    );
  }
  for (let t = 0; t < 900; t += 5) {
    const normalized = labRig.arms.map(
      (config, i) =>
        ((-labWalkingArm(t, i).upper * 180) / Math.PI - config.walkShoulder.back) /
        (config.walkShoulder.forward - config.walkShoulder.back),
    );
    assert.ok(Math.abs(normalized[0] + normalized[1] - 1) < 1e-8);
  }
});
const rotateArmPoint = (p, a) => ({
  x: p.x * Math.cos(a) - p.y * Math.sin(a),
  y: p.x * Math.sin(a) + p.y * Math.cos(a),
});
const paintedJoint = (frame, length, point) => {
  const art = labArmArtwork(frame, length),
    [, , w, h] = guildLabArt.frames[frame];
  return rotateArmPoint(
    { x: (point[0] - art.originX * w) * art.scale, y: (point[1] - art.originY * h) * art.scale },
    art.rotation,
  );
};
test("measured sleeve centres meet at the elbow through a complete walking cycle", async () => {
  for (const [index, arm] of labRig.arms.entries()) {
    const [upper, lower] = arm.frames.map((f) => guildLabArt.armJoints[f]);
    for (const frame of arm.frames) {
      const [left, top, width, height] = guildLabArt.frames[frame];
      const pixels = await sharp(`public${guildLabArt.asset}`)
        .extract({ left, top, width, height })
        .ensureAlpha()
        .raw()
        .toBuffer();
      for (const [name, p] of Object.entries(guildLabArt.armJoints[frame]))
        assert.ok(
          pixels[(p[1] * width + p[0]) * 4 + 3] >
            (name === "proximal" && guildLabArt.armSeams[frame] ? 120 : 240),
          `frame ${frame} measured centre inside paint`,
        );
    }
    const end = paintedJoint(arm.frames[0], arm.lengths[0], upper.distal);
    const start = paintedJoint(arm.frames[1], arm.lengths[1], lower.proximal);
    for (let t = 0; t < 900; t += 5) {
      const a = labWalkingArm(t, index),
        paintedEnd = rotateArmPoint(end, a.upper),
        paintedStart = rotateArmPoint(start, a.upper + a.lower);
      const pivot = rotateArmPoint({ x: 0, y: arm.lengths[0] }, a.upper);
      // Convert to device pixels at the 390px/DPR3, 5x inspection magnification.
      const error =
        Math.hypot(
          paintedEnd.x - pivot.x - paintedStart.x,
          paintedEnd.y - pivot.y - paintedStart.y,
        ) *
        a.scale *
        0.5 *
        (366 / 768) *
        3 *
        5;
      assert.ok(error < 1, `${t}ms: sleeve centre error ${error}px`);
    }
  }
});
test("foreground forearm caps fade into upper sleeves without changing the glove", async () => {
  for (const frame of [5, 7]) {
    const [left, top, width, height] = guildLabArt.frames[frame];
    const seam = guildLabArt.armSeams[frame];
    assert.deepEqual(seam.proximal, guildLabArt.armJoints[frame].proximal);
    assert.ok(seam.changedPixels > 500);
    const before =
      frame === 5
        ? await sharp("assets/source/guild/leon-far-palm-v4.png")
            .trim({ threshold: 20 })
            .resize({ width, height, fit: "fill" })
            .ensureAlpha()
            .raw()
            .toBuffer()
        : await sharp("public/guild/leon-parts-v2.webp")
            .extract({ left, top, width, height })
            .flop()
            .ensureAlpha()
            .raw()
            .toBuffer();
    const after = await sharp("public/guild/leon-parts-v3.webp")
      .extract({ left, top, width, height })
      .ensureAlpha()
      .raw()
      .toBuffer();
    let brightened = 0,
      faded = 0,
      outside = 0;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const p = (y * width + x) * 4;
        assert.ok(after[p + 3] <= before[p + 3], `frame ${frame} alpha at ${x},${y}`);
        if (after[p + 3] < before[p + 3]) {
          assert.ok(y <= seam.maxY, `frame ${frame} fade outside elbow at ${x},${y}`);
          faded++;
        }
        if (before[p + 3] < 240) continue;
        const difference = [0, 1, 2].some((c) => after[p + c] !== before[p + c]);
        if (!difference) continue;
        if (y > seam.maxY) outside++;
        else if (after[p] + after[p + 1] + after[p + 2] > before[p] + before[p + 1] + before[p + 2])
          brightened++;
      }
    assert.ok(brightened > 250, `frame ${frame} elbow cap becomes sleeve-colored`);
    assert.ok(faded > 2000, `frame ${frame} elbow cap blends into the upper sleeve`);
    assert.ok(outside < 10, `frame ${frame} glove remains unchanged beyond the elbow`);
  }
});

test("measured head neck is centred above the final torso collar", async () => {
  const { neck, displayHeight } = guildLabArt.head;
  assert.deepEqual(neck.center, [
    (neck.earUnder[0] + neck.chinUnder[0]) / 2,
    (neck.earUnder[1] + neck.chinUnder[1]) / 2,
  ]);
  const [hx, hy, hw, hh] = guildLabArt.frames[0];
  const [tx, ty, tw, th] = guildLabArt.frames[labRig.torso.frame];
  const head = await sharp("public/guild/leon-parts-v3.webp")
    .extract({ left: hx, top: hy, width: hw, height: hh })
    .ensureAlpha()
    .raw()
    .toBuffer();
  for (const [x, y] of [neck.earUnder, neck.chinUnder]) assert.ok(head[(y * hw + x) * 4 + 3] > 200);
  const torso = await sharp("public/guild/leon-parts-v3.webp")
    .extract({ left: tx, top: ty, width: tw, height: th })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const [minX, maxX] = guildLabArt.torso.neck.collarBounds;
  assert.ok(minX < maxX && guildLabArt.torso.neck.pixels > 500);
  for (const x of [minX, maxX]) {
    let found = false;
    for (let y = 0; y < 30; y++) {
      const p = (y * tw + x) * 4;
      if (torso[p + 3] > 220 && torso[p] > 180 && torso[p + 1] > 160) found = true;
    }
    assert.ok(found, `collar edge at ${x}`);
  }
  const neckWorldX = labRig.head.x + (neck.center[0] - hw / 2) * (displayHeight / hh);
  const collarWorldX =
    labRig.torso.x + (guildLabArt.torso.neck.center[0] - tw / 2) * (labRig.torso.height / th);
  assert.ok(Math.abs(neckWorldX - collarWorldX) < 0.001);
  assert.ok(labRig.head.x >= -1 && labRig.head.x <= 0.5);
  assert.ok(
    Math.hypot(
      labTeaCup(1, 0).rim.x - labTeaCup(1, 0).mouth.x,
      labTeaCup(1, 0).rim.y - labTeaCup(1, 0).mouth.y,
    ) < 0.001,
  );
});
test("walking settles into idle, while tea, work and reactions retain target-based IK", () => {
  for (const index of [0, 1]) {
    const motion = new LabArmMotion(),
      arm = labRig.arms[index],
      target = { x: 20, y: 30 };
    const walk = motion.sample(410, "walk", index, target, false, false);
    assert.deepEqual(walk, labWalkingArm(410, index));
    assert.deepEqual(motion.sample(420, "idle", index, target, false, false), walk);
    const end = { ...labJoint(target, ...arm.lengths, arm.bend), scale: 1 };
    const middle = motion.sample(510, "idle", index, target, false, false);
    assert.ok(Math.abs(middle.upper - (walk.upper + end.upper) / 2) < 1e-8);
    const settled = motion.sample(600, "idle", index, target, false, false);
    assert.ok(
      Math.abs(settled.upper - end.upper) < 1e-8 && Math.abs(settled.lower - end.lower) < 1e-8,
    );
    for (const mode of ["tea", "work", "walk"])
      assert.deepEqual(motion.sample(1000, mode, index, target, true, false), end);
    assert.deepEqual(
      motion.sample(1200, "idle", index, target, false, true),
      labWalkingArm(0, index, true),
    );
    assert.deepEqual(
      motion.sample(1800, "walk", index, target, false, true),
      labWalkingArm(0, index, true),
    );
  }
});

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
    const art = labLimbArtwork(leg.frames[0], leg.lengths[0]);
    // The closed proximal oval occupies the first 35 source rows of each thigh.
    const cap = [];
    for (let row = 0; row < 35; row++)
      for (let col = 0; col < thigh.width; col++) {
        if (thigh.data[(row * thigh.width + col) * 4 + 3] > 200)
          cap.push({
            x: (col - art.originX * thigh.width) * art.scale,
            y: (row - art.originY * thigh.height) * art.scale,
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

test("painted knee centres remain joined through sitting and the entire stride", () => {
  for (const leg of labRig.legs) {
    assert.equal(leg.measured, true);
    const upperArt = labLimbArtwork(leg.frames[0], leg.lengths[0]);
    const lowerArt = labLimbArtwork(leg.frames[1], leg.lengths[1]);
    const upperJoint = guildLabArt.legJoints[leg.frames[0]].distal;
    const lowerJoint = guildLabArt.legJoints[leg.frames[1]].proximal;
    for (const mode of ["tea", "walk"])
      for (let t = 0; t < 900; t += 5) {
        const pose = labPose(t, mode, false);
        const angles = labJoint(labLegTarget(t, 0, mode, pose.bob), ...leg.lengths, leg.bend);
        const upper = rotateArmPoint(
          {
            x:
              (upperJoint[0] - upperArt.originX * guildLabArt.frames[leg.frames[0]][2]) *
              upperArt.scale,
            y:
              (upperJoint[1] - upperArt.originY * guildLabArt.frames[leg.frames[0]][3]) *
              upperArt.scale,
          },
          angles.upper + upperArt.rotation,
        );
        const lower = rotateArmPoint(
          {
            x:
              (lowerJoint[0] - lowerArt.originX * guildLabArt.frames[leg.frames[1]][2]) *
              lowerArt.scale,
            y:
              (lowerJoint[1] - lowerArt.originY * guildLabArt.frames[leg.frames[1]][3]) *
              lowerArt.scale,
          },
          angles.upper + angles.lower + lowerArt.rotation,
        );
        const knee = rotateArmPoint({ x: 0, y: leg.lengths[0] }, angles.upper);
        assert.ok(Math.hypot(upper.x - knee.x - lower.x, upper.y - knee.y - lower.y) < 1);
      }
  }
});

test("idle stance extends the knee and settles its hip height over 180 ms", () => {
  assert.equal(labRig.idleReach, 0.99);
  assert.equal(labRig.idleSettleMs, 180);
  const walk = labPose(0, "walk", false).bob;
  const start = labPose(0, "idle", false, 0, walk).bob;
  const middle = labPose(0, "idle", false, 0.5, walk).bob;
  const end = labPose(0, "idle", false, 1, walk).bob;
  assert.ok(Math.abs(start - walk) < 0.001);
  assert.ok(Math.min(start, end) < middle && middle < Math.max(start, end));
  const target = labLegTarget(0, 0, "idle", end);
  const angles = labJoint(target, ...labRig.legs[0].lengths, -1);
  assert.ok(Math.abs(angles.lower) < 0.36);
});

test("shoulders clear the scarf and cup sits between the torso and near glove", () => {
  assert.equal(labRig.arms[0].joint.y, -80);
  assert.equal(labRig.arms[1].joint.y, -81);
  assert.ok(labRig.torso.layer < labRig.cup.layer);
  assert.ok(labRig.cup.layer < labRig.arms[1].layer);
  for (const sip of [0, 0.5, 1]) {
    const cup = labTeaCup(sip, 0);
    const target = labJoint(cup.hand, ...labRig.arms[1].lengths, labRig.arms[1].bend);
    assert.ok(Number.isFinite(target.upper) && Number.isFinite(target.lower));
  }
});

test("both residents use their own measured cutout and can sit without overlap", async () => {
  assert.deepEqual(Object.keys(labCharacters), ["leon", "aria"]);
  const [leon, aria] = [labCharacters.leon, labCharacters.aria];
  assert.notEqual(leon.art.asset, aria.art.asset);
  assert.ok(aria.rig.head.y > -84 && aria.rig.head.y < -75);
  assert.equal(aria.rig.legs[0].front, "upper");
  assert.equal(aria.rig.arms[1].front, "lower");
  assert.ok(aria.art.head.displayHeight < leon.art.head.displayHeight);
  const meta = await sharp("public/guild/aria-parts-v1.webp").metadata();
  assert.equal(meta.hasAlpha, true);
  for (const [left, top, width, height] of aria.art.frames)
    assert.ok(left >= 0 && top >= 0 && left + width <= meta.width && top + height <= meta.height);
  for (const frame of [5, 7, 8, 10]) {
    const seam = aria.art.seams[frame];
    assert.ok(seam.changedPixels > 100);
    assert.ok(seam.band[0] < seam.band[1]);
  }
  assert.ok(labStations.ariaTea.x - labStations.tea.x > 80);
  const walkTargets = [
    { x: 656, y: 416 },
    { x: 611, y: 428 },
  ];
  assert.ok(
    Math.hypot(walkTargets[0].x - walkTargets[1].x, walkTargets[0].y - walkTargets[1].y) > 44,
  );
  assert.deepEqual(labPathTo(labStations.ariaTea, walkTargets[1]).at(-1), walkTargets[1]);
});

test("Aria's painted joints and tea rim use her measured profile", () => {
  const rig = labRigs.aria;
  for (const limb of [...rig.arms, ...rig.legs]) {
    const upper = labLimbArtwork(limb.frames[0], limb.lengths[0], guildLabAriaArt);
    const lower = labLimbArtwork(limb.frames[1], limb.lengths[1], guildLabAriaArt);
    const upperEnd =
      limb.frames[0] < 8
        ? guildLabAriaArt.armJoints[limb.frames[0]].distal
        : guildLabAriaArt.legJoints[limb.frames[0]].distal;
    const lowerStart =
      limb.frames[1] < 8
        ? guildLabAriaArt.armJoints[limb.frames[1]].proximal
        : guildLabAriaArt.legJoints[limb.frames[1]].proximal;
    const up = rotateArmPoint(
      {
        x: (upperEnd[0] - upper.originX * guildLabAriaArt.frames[limb.frames[0]][2]) * upper.scale,
        y: (upperEnd[1] - upper.originY * guildLabAriaArt.frames[limb.frames[0]][3]) * upper.scale,
      },
      upper.rotation,
    );
    const lo = rotateArmPoint(
      {
        x:
          (lowerStart[0] - lower.originX * guildLabAriaArt.frames[limb.frames[1]][2]) * lower.scale,
        y:
          (lowerStart[1] - lower.originY * guildLabAriaArt.frames[limb.frames[1]][3]) * lower.scale,
      },
      lower.rotation,
    );
    assert.ok(Math.hypot(up.x, up.y - limb.lengths[0]) < 0.001);
    assert.ok(Math.hypot(lo.x, lo.y) < 0.001);
  }
  for (const [id, profile] of Object.entries(labCharacters)) {
    const cup = labTeaCup(1, 0, profile.rig, profile.art);
    assert.ok(Math.hypot(cup.rim.x - cup.mouth.x, cup.rim.y - cup.mouth.y) < 0.001, id);
    const mouth = labMouth(profile.art);
    assert.ok(Math.abs(cup.mouth.x - profile.rig.head.x - mouth.x) < 0.001);
  }
});

test("sharing food follows push, take, offer, surprise, shyness, acceptance without a heart", () => {
  const times = [0, 6100, 8100, 11100, 13600, 14500, 16500];
  assert.deepEqual(times.map(labPairBeat), [
    "sip",
    "push",
    "take",
    "offer",
    "surprised",
    "shy",
    "accept",
  ]);
  const original = {
    expression: "neutral",
    yawn: false,
    mark: null,
    blush: false,
    jump: 0,
    stretch: 0,
    squash: 0,
    look: 0,
    gesture: "none",
    markAge: 0,
  };
  const aria = labPairFeeling(original, "aria", "take", false);
  assert.equal(aria.expression, "smile");
  assert.equal(aria.mark, "note");
  assert.equal(labPairFeeling({ ...original, look: 0.06 }, "aria", "take", false).look, 0.06);
  const leon = labPairFeeling(original, "leon", "shy", false);
  assert.equal(leon.blush, true);
  assert.equal(leon.mark, "thought");
  for (const time of times) {
    const beat = labPairBeat(time);
    for (const id of ["leon", "aria"])
      assert.notEqual(labPairFeeling(original, id, beat, true).mark, "heart");
  }
  assert.ok(labSharingProps(7600, false).dishX > labSharingProps(6100, false).dishX);
  assert.equal(labSharingProps(12000, false).bite.y, 352);
  assert.deepEqual(labSharingProps(17000, false).bite, { x: 294, y: 352 });
});

test("back hair is a right-facing neck lock with a measured root and no extra head features", async () => {
  const art = guildLabAriaArt,
    rig = labRigs.aria;
  assert.deepEqual(art.hairLock.reviewed, { ears: 0, flowers: 0, skull: false, view: "right" });
  const [x, y, w, h] = art.frames[art.extras.backHair];
  assert.ok(h > w * 1.8, "a hanging lock, not a wide rear-view head");
  const data = await sharp(`public${art.asset}`)
    .extract({ left: x, top: y, width: w, height: h })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const [rx, ry] = art.hairLock.root;
  assert.ok(data[(ry * w + rx) * 4 + 3] > 200);
  assert.equal(rig.backHair.originX, rx / w);
  assert.equal(rig.backHair.originY, ry / h);
  assert.ok(rig.backHair.sway >= 0.03 && rig.backHair.sway <= 0.05);
});

test("both boots point forward, measured from opaque ankle and toe bands", async () => {
  for (const [id, { art }] of Object.entries(labCharacters)) {
    const signs = [];
    for (const frame of [9, 11]) {
      const [left, top, width, height] = art.frames[frame];
      const data = await sharp(`public${art.asset}`)
        .extract({ left, top, width, height })
        .ensureAlpha()
        .raw()
        .toBuffer();
      const extent = (from, to) => {
        let sum = 0,
          n = 0,
          lo = width,
          hi = 0;
        for (let y = Math.floor(from * height); y < Math.floor(to * height); y++)
          for (let x = 0; x < width; x++)
            if (data[(y * width + x) * 4 + 3] > 180) {
              sum += x;
              n++;
              lo = Math.min(lo, x);
              hi = Math.max(hi, x);
            }
        assert.ok(n > 100);
        return { center: sum / n, lo, hi };
      };
      const ankle = extent(0.15, 0.55),
        toe = extent(0.8, 0.97);
      assert.ok(toe.center > ankle.center + 4, `${id} ${frame}: forward centroid`);
      assert.ok(toe.hi - ankle.center > ankle.center - toe.lo, `${id} ${frame}: toe extends right`);
      signs.push(Math.sign(toe.center - ankle.center));
    }
    assert.deepEqual(signs, [1, 1]);
  }
});

async function partSampler(art, frame, cfg, origin = [0.5, 0.5]) {
  const [left, top, width, height] = art.frames[frame];
  const pixels = await sharp(`public${art.asset}`)
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const scale = cfg.height / height;
  return (x, y, rotation = 0) => {
    const local = rotateArmPoint({ x: x - cfg.x, y: y - cfg.y }, -rotation);
    const px = Math.round(local.x / scale + width * origin[0]);
    const py = Math.round(local.y / scale + height * origin[1]);
    return px < 0 || py < 0 || px >= width || py >= height ? 0 : pixels[(py * width + px) * 4 + 3];
  };
}

test("Aria's fixed front cape covers rotating shoulder roots above the near upper arm", async () => {
  const { art, rig } = labCharacters.aria;
  assert.ok(rig.cape.layer < rig.torso.layer);
  assert.ok(rig.arms[0].layer < rig.torso.layer);
  assert.ok(rig.scarf.layer > rig.arms[1].layer);
  assert.ok(rig.scarf.layer < rig.head.layer);
  const cape = await partSampler(art, rig.scarf.frame, rig.scarf);
  for (const arm of rig.arms) {
    const frame = arm.frames[0],
      joints = art.armJoints[frame];
    const [left, top, width, height] = art.frames[frame];
    const pixels = await sharp(`public${art.asset}`)
      .extract({ left, top, width, height })
      .ensureAlpha()
      .raw()
      .toBuffer();
    const drawing = labLimbArtwork(frame, arm.lengths[0], art);
    for (const angle of [-1.8, -1, -0.3, 0, 0.5, 1]) {
      for (let y = 0; y < joints.proximal[1]; y += 3)
        for (let x = 0; x < width; x += 3) {
          if (pixels[(y * width + x) * 4 + 3] < 220) continue;
          const p = rotateArmPoint(
            {
              x: (x - joints.proximal[0]) * drawing.scale,
              y: (y - joints.proximal[1]) * drawing.scale,
            },
            drawing.rotation + angle,
          );
          assert.ok(
            cape(arm.joint.x + p.x, arm.joint.y + p.y) > 180,
            `painted shoulder cap covered: ${frame} ${angle}`,
          );
        }
    }
  }
  for (const arm of rig.arms)
    for (let angle = -1.8; angle <= 1.8; angle += 0.05) {
      for (const p of [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: -2, y: 0 },
        { x: 0, y: 2 },
      ]) {
        const q = rotateArmPoint(p, angle);
        assert.ok(cape(arm.joint.x + q.x, arm.joint.y + q.y) > 230, `covered shoulder ${angle}`);
      }
    }
});

test("measured chin overlaps the collar and a hidden neck base seals the maximum head rotation", async () => {
  for (const [id, { art, rig }] of Object.entries(labCharacters)) {
    const [, , hw, hh] = art.frames[0];
    const scale = art.head.displayHeight / hh;
    const collar = await partSampler(art, rig.scarf.frame, rig.scarf);
    const torso = await partSampler(art, rig.torso.frame, rig.torso);
    const head = await partSampler(
      art,
      0,
      { ...rig.head, height: art.head.displayHeight },
      [0.5, 1],
    );
    const base = rig.neckBase;
    assert.ok(base.layer < rig.scarf.layer && base.layer < rig.head.layer);
    assert.ok(base.width <= 10 && base.height <= 7);
    const neckX = rig.head.x + (art.head.neck.center[0] - hw / 2) * scale;
    assert.ok(Math.abs(neckX - base.x) < 0.001, `${id}: measured neck centre`);
    const chinY = rig.head.y + (art.head.neck.chinUnder[1] - hh) * scale;
    assert.ok(Math.abs(chinY - base.y) < 0.001, `${id}: chin overlaps collar bridge`);
    for (const a of [-0.1, 0, 0.1]) {
      for (let y = base.y - 5; y <= base.y + 5; y += 0.5) {
        const covered =
          head(base.x, y, a) > 180 ||
          collar(base.x, y) > 180 ||
          torso(base.x, y) > 180 ||
          ((y - base.y) / (base.height / 2)) ** 2 < 1;
        assert.ok(covered, `${id}: sealed collar at ${a},${y}`);
      }
      const cup = labTeaCup(1, a, rig, art);
      assert.ok(Math.hypot(cup.rim.x - cup.mouth.x, cup.rim.y - cup.mouth.y) < 0.001);
    }
    // The small skin bridge must be hidden by painted head/collar at rest.
    for (const p of [
      { x: base.x, y: base.y },
      { x: base.x, y: base.y - 2 },
      { x: base.x, y: base.y + 2 },
    ])
      assert.ok(
        head(p.x, p.y) > 180 || collar(p.x, p.y) > 180 || torso(p.x, p.y) > 180,
        `${id}: hidden neck base`,
      );
  }
});

test("pair destinations and interrupted paths preserve minimum foot clearance in every scene", () => {
  let positions = [
    { ...labStations.tea, moving: false },
    { ...labStations.ariaTea, moving: false },
  ];
  assert.ok(LAB_PAIR_MIN_DISTANCE >= 60);
  for (let request = 0; request < 24; request++) {
    const mode = ["walk", "detour", "work", "tea", "detour", "walk"][request % 6];
    const right = positions[0].x < 384;
    const destinations = [0, 1].map((i) => labPairDestination(mode, i, request, right));
    assert.ok(
      Math.hypot(destinations[0].x - destinations[1].x, destinations[0].y - destinations[1].y) >=
        LAB_PAIR_MIN_DISTANCE,
    );
    const paths = positions.map((p, i) => labPathTo(p, destinations[i], i ? 488 : 416));
    // Alternate arrivals and interrupts, sampling at about one display frame.
    const total = request % 3 ? 1300 : 120;
    for (let distance = 0; distance <= total; distance += 1.3) {
      const next = paths.map((p) => labTravel(p, distance));
      positions = labKeepDistance(next);
      assert.ok(
        Math.hypot(positions[0].x - positions[1].x, positions[0].y - positions[1].y) >=
          LAB_PAIR_MIN_DISTANCE - 1e-8,
      );
    }
    if (total === 1300)
      positions.forEach((p, i) =>
        assert.ok(Math.hypot(p.x - destinations[i].x, p.y - destinations[i].y) < 0.001),
      );
  }
});
