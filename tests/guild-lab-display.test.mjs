import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { labCharacters } from "../lib/guild-lab-characters.ts";
import { labIdleArm } from "../lib/guild-lab-arms.ts";
import { LabFeetMotion } from "../lib/guild-lab-feet.ts";
import {
  labLegTarget,
  labJoint,
  labPose,
  labTeaCup,
  LAB_WIDTH,
  LAB_HEIGHT,
} from "../lib/guild-lab-model.ts";
import { labCameraZoom, labCameraTarget, LabCameraFollow } from "../lib/guild-lab-camera.ts";
import { labLimbArtwork } from "../lib/guild-lab-limbs.ts";
import { guildLabSourceConfig } from "../scripts/guild-lab-source-config.mjs";

async function framePixels(art, index) {
  const [left, top, width, height] = art.frames[index];
  return {
    width,
    height,
    pixels: await sharp(`public${art.asset}`)
      .extract({ left, top, width, height })
      .ensureAlpha()
      .raw()
      .toBuffer(),
  };
}
const rotate = (p, a) => ({
  x: p.x * Math.cos(a) - p.y * Math.sin(a),
  y: p.x * Math.sin(a) + p.y * Math.cos(a),
});
async function sampler(art, frame, cfg) {
  const { pixels, width, height } = await framePixels(art, frame),
    scale = cfg.height / height;
  return (x, y) => {
    const p = rotate({ x: x - cfg.x, y: y - cfg.y }, -(cfg.rotation ?? 0));
    const px = Math.round(p.x / scale + width * (cfg.originX ?? 0.5));
    const py = Math.round(p.y / scale + height * (cfg.originY ?? 0.5));
    return px < 0 || py < 0 || px >= width || py >= height ? 0 : pixels[(py * width + px) * 4 + 3];
  };
}

function largestEyeWhite(pixels, width, box) {
  const [left, top, right, bottom] = box,
    seen = new Set();
  let largest = 0;
  for (let y = top; y <= bottom; y++)
    for (let x = left; x <= right; x++) {
      const queue = [y * width + x];
      let count = 0;
      for (let i = 0; i < queue.length; i++) {
        const n = queue[i],
          xx = n % width,
          yy = Math.floor(n / width);
        if (seen.has(n) || xx < left || xx > right || yy < top || yy > bottom) continue;
        seen.add(n);
        const [r, g, b, a] = pixels.subarray(n * 4, n * 4 + 4);
        if (a <= 180 || r <= 235 || g <= 235 || b <= 235) continue;
        count++;
        queue.push(n - 1, n + 1, n - width, n + width);
      }
      largest = Math.max(largest, count);
    }
  return largest;
}

test("phone cameras start near the pair, clamp to the room and follow without a jump", () => {
  for (const width of [296, 366]) assert.ok(labCameraZoom(width, "auto") >= 2);
  assert.equal(labCameraZoom(808, "auto"), 1);
  assert.equal(labCameraZoom(366, "room"), 1);
  for (const zoom of [1, 1.8, 2.35])
    for (const point of [
      { x: -100, y: -100 },
      { x: 900, y: 700 },
    ]) {
      const c = labCameraTarget([point, point], zoom);
      assert.ok(c.x >= LAB_WIDTH / zoom / 2 && c.x <= LAB_WIDTH - LAB_WIDTH / zoom / 2);
      assert.ok(c.y >= LAB_HEIGHT / zoom / 2 && c.y <= LAB_HEIGHT - LAB_HEIGHT / zoom / 2);
    }
  const follow = new LabCameraFollow(),
    first = follow.sample(
      [
        { x: 300, y: 350 },
        { x: 360, y: 350 },
      ],
      2.35,
      0,
    );
  const next = follow.sample(
    [
      { x: 500, y: 450 },
      { x: 560, y: 450 },
    ],
    2.35,
    16,
  );
  assert.ok(next.x > first.x && next.x < first.x + 200);
  assert.deepEqual(
    follow.sample(
      [
        { x: 600, y: 450 },
        { x: 660, y: 450 },
      ],
      2.35,
      0,
    ),
    next,
  );
  assert.deepEqual(
    follow.sample(
      [
        { x: 100, y: 450 },
        { x: 160, y: 450 },
      ],
      1,
      16,
    ),
    { x: 384, y: 288 },
  );
});

test("all delivered cutout frames have transparent gutters and adopted Aria heads are uncut", async () => {
  for (const [id, { art }] of Object.entries(labCharacters))
    for (let i = 0; i < art.frames.length; i++) {
      const { pixels, width, height } = await framePixels(art, i);
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++)
          if (x === 0 || y === 0 || x === width - 1 || y === height - 1)
            assert.ok(
              pixels[(y * width + x) * 4 + 3] < 180,
              `${id} frame ${i}: opaque paint touches ${x},${y}`,
            );
    }
  for (const file of [
    guildLabSourceConfig.aria.head,
    ...["smile", "surprised", "tired", "yawn"].map(guildLabSourceConfig.aria.headExpression),
  ]) {
    const { data, info } = await sharp(file)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++)
        if (x === 0 || y === 0 || x === info.width - 1 || y === info.height - 1)
          assert.ok(data[(y * info.width + x) * 4 + 3] < 8, `${file}: cropped source silhouette`);
  }
});

test("masked closed eyes erase old irises and leave silhouette and hair contour pixels unchanged", async () => {
  const { art } = labCharacters.aria;
  const { pixels: base, width, height } = await framePixels(art, 0);
  for (const [key, expression] of Object.entries(art.head.expressions)) {
    const overlays = await Promise.all(
      expression.patches.map(async (p) => {
        assert.equal(p.masked, true);
        assert.equal(p.silhouettePixels, 0);
        const f = await framePixels(art, p.frame);
        let transparent = 0;
        for (let i = 3; i < f.pixels.length; i += 4) if (f.pixels[i] === 0) transparent++;
        assert.ok(
          transparent > f.width * f.height * 0.15,
          "mask has transparent interior, not a rectangle",
        );
        return {
          input: await sharp(f.pixels, { raw: { width: f.width, height: f.height, channels: 4 } })
            .png()
            .toBuffer(),
          left: p.rect[0],
          top: p.rect[1],
        };
      }),
    );
    const rendered = overlays.length
      ? await sharp(base, { raw: { width, height, channels: 4 } })
          .composite(overlays)
          .raw()
          .toBuffer()
      : base;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const p = (y * width + x) * 4;
        if (base[p + 3] < 180 || (y < 174 + art.framePadding && x > 150)) {
          assert.equal(rendered[p + 3], base[p + 3], `${key}: silhouette alpha ${x},${y}`);
          if (base[p + 3] > 0)
            assert.ok(
              [0, 1, 2].every((c) => Math.abs(rendered[p + c] - base[p + c]) <= 1),
              `${key}: silhouette/hair ${x},${y}`,
            );
        }
      }
    if (expression.closedEyes) {
      let irises = 0;
      for (const [left, top, w, h] of art.head.faceRegions.eyes) {
        const originalIris = [];
        for (let y = top; y < top + h; y++)
          for (let x = left; x < left + w; x++) {
            const p = (y * width + x) * 4,
              [r, g, b, a] = rendered.subarray(p, p + 4);
            if (a > 180 && g > 30 && g - r > 8 && g > b * 1.08) irises++;
            const [br, bg, bb, ba] = base.subarray(p, p + 4);
            if (ba > 180 && bg > 30 && bg - br > 8 && bg > bb * 1.08) originalIris.push([x, y]);
          }
        const box = [
          Math.min(...originalIris.map((p) => p[0])) - 3,
          Math.min(...originalIris.map((p) => p[1])) - 3,
          Math.max(...originalIris.map((p) => p[0])) + 3,
          Math.max(...originalIris.map((p) => p[1])) + 3,
        ];
        assert.ok(largestEyeWhite(base, width, box) >= 20, "detect the original painted sclera");
        // Small isolated bright pixels belong to skin highlights; the old sclera
        // forms connected painted areas of 28–78 pixels on this measured head.
        assert.ok(
          largestEyeWhite(rendered, width, box) < 20,
          `${key}: no painted eye-white area survives`,
        );
      }
      assert.equal(irises, 0, `${key}: no original green iris survives`);
    }
  }
  assert.equal(art.head.neck.visibleNeck, false, "the head part ends at the jaw");
});

test("Leon postures retain chin overlap and cup contact; Aria uses the master contour checks", async () => {
  for (const [id, { art, rig }] of Object.entries({ leon: labCharacters.leon })) {
    const collar = await sampler(art, rig.scarf.frame, rig.scarf),
      [, , w, h] = art.frames[0];
    const scale = art.head.displayHeight / h;
    for (const mode of ["idle", "walk", "tea", "work"])
      for (const time of [0, 225, 450, 675, 5000])
        for (const look of [-0.17, 0, 0.17]) {
          const pose = labPose(time, mode, false, 1, 0, rig, art),
            angle = pose.head + look;
          const chin = rotate(
            {
              x: (art.head.neck.chinUnder[0] - w / 2) * scale,
              y: (art.head.neck.chinUnder[1] - h) * scale,
            },
            angle,
          );
          const y = rig.head.y + chin.y;
          // Scan the neckline at the attachment centre; both share the body transform,
          // so bob, jumping and squash do not open a gap between them.
          const x = rig.neckBase.x;
          let top = rig.scarf.y - rig.scarf.height;
          while (top < y && collar(x, top) < 180) top += 0.1;
          assert.ok(y - top >= 3, `${id} ${mode} ${angle}: chin/cape overlap ${y - top}`);
          const cup = labTeaCup(1, angle, rig, art);
          assert.ok(Math.hypot(cup.rim.x - cup.mouth.x, cup.rim.y - cup.mouth.y) < 0.001);
        }
  }
});

test("idle feet remain separated and the final stride settles with a lifted step", () => {
  for (const { art, rig } of Object.values(labCharacters)) {
    const bob = labPose(0, "idle", false, 1, 0, rig, art).bob;
    const idle = rig.legs.map((leg, i) => labLegTarget(0, i / 2, "idle", bob, rig));
    assert.ok(Math.abs(idle[1].x + rig.legs[1].joint.x - idle[0].x - rig.legs[0].joint.x) >= 8);
    const feet = new LabFeetMotion(rig),
      walking = feet.sample(200, "walk", 0, false);
    assert.deepEqual(feet.sample(210, "idle", bob, false), walking);
    const middle = feet.sample(300, "idle", bob, false);
    assert.ok(
      middle[0].y < (walking[0].y + idle[0].y) / 2,
      "moves above the floor rather than sliding on it",
    );
    assert.deepEqual(feet.sample(390, "idle", bob, false), idle);
    assert.deepEqual(feet.sample(450, "idle", bob, true), idle);
    for (let i = 0; i < 2; i++)
      assert.ok(
        Math.abs(labJoint(idle[i], ...rig.legs[i].lengths, rig.legs[i].idleBend ?? -1).lower) <
          ("master" in art ? 0.7 : 0.36),
      );
  }
});

test("idle arms bend forward and some of the far palm remains visible in front of the coat", async () => {
  for (const [id, { art, rig }] of Object.entries(labCharacters)) {
    const arm = rig.arms[0],
      angles = labIdleArm(0, rig);
    assert.ok(angles.upper < 0 && angles.lower < 0 && Math.abs(angles.lower) < 0.3);
    const frame = arm.frames[1],
      f = await framePixels(art, frame),
      drawing = labLimbArtwork(frame, arm.lengths[1], art);
    const foreground = await Promise.all(
      [rig.torso, rig.scarf, ...(id === "aria" ? [rig.skirt] : [])].map((cfg) =>
        sampler(art, cfg.frame, cfg),
      ),
    );
    const elbow = rotate({ x: 0, y: arm.lengths[0] * angles.scale }, angles.upper);
    let visible = 0;
    for (let y = Math.floor(f.height * 0.75); y < f.height; y++)
      for (let x = 0; x < f.width; x++) {
        if (f.pixels[(y * f.width + x) * 4 + 3] < 220) continue;
        const p = rotate(
          {
            x: (x - drawing.originX * f.width) * drawing.scale,
            y: (y - drawing.originY * f.height) * drawing.scale,
          },
          drawing.rotation,
        );
        const q = rotate(
          { x: p.x * (arm.thickness ?? 1) * angles.scale, y: p.y * angles.scale },
          angles.upper + angles.lower,
        );
        const world = { x: arm.joint.x + elbow.x + q.x, y: arm.joint.y + elbow.y + q.y };
        // Front edge excludes the space between the legs. At this height the other
        // foreground pieces (head, hair, shoulders) end above the sampled palm.
        if (world.x > 14 && !foreground.some((sample) => sample(world.x, world.y) > 180)) visible++;
      }
    assert.ok(visible > 20, `${id}: visible painted far hand ${visible}`);
  }
});

test("three hair roots stay behind the head with front lock behind the near glove", async () => {
  const { art, rig } = labCharacters.aria;
  assert.equal(rig.hairLocks.length, 3);
  assert.equal(art.costume.matchedPair, true);
  assert.ok(rig.hairLocks[0].layer < rig.cape.layer);
  assert.ok(rig.hairLocks[1].layer > rig.scarf.layer);
  assert.ok(
    rig.hairLocks[2].layer > rig.scarf.layer && rig.hairLocks[2].layer < rig.cup.restingHandLayer,
  );
  assert.equal(new Set(rig.hairLocks.map((h) => h.phase)).size, 3);
  assert.ok(rig.hairLocks.every((h) => h.layer < rig.head.layer && h.sway <= 0.04));
  for (const rotation of [-0.17, 0, 0.17]) {
    const head = await sampler(art, 0, {
      ...rig.head,
      height: art.head.displayHeight,
      originY: 1,
      rotation,
    });
    for (const lock of rig.hairLocks)
      assert.ok(head(lock.x, lock.y) > 180, `${lock.frame}: root hidden under the head`);
  }
});
