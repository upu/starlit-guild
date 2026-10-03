import test from "node:test";
import assert from "node:assert/strict";
import { walkStudyPose } from "../lib/home-walk-study.ts";
import sharp from "sharp";
import { residentIds } from "../lib/home-actor.ts";
test("walk reference swaps both arms, returns through neutral, and loops without a jump", () => {
  const handX = (f, s) => {
    const p = walkStudyPose(f)[s];
    return p.hand.x - p.shoulder.x;
  };
  for (const side of ["near", "far"]) {
    assert.ok(handX(0, side) * handX(4, side) < 0, side + " must swing behind as well as ahead");
    assert.ok(Math.abs(handX(2, side)) < 2);
    assert.ok(Math.abs(handX(6, side)) < 2);
  }
  for (let f = 0; f < 8; f += 0.125) {
    const p = walkStudyPose(f);
    assert.ok(Math.abs(p.near.angle + p.far.angle) < 1e-12);
    for (const s of [p.near, p.far]) {
      assert.ok(Math.abs(Math.hypot(s.hand.x - s.elbow.x, s.hand.y - s.elbow.y) - 12) < 1e-9);
      assert.ok(s.hand.y > s.shoulder.y + 22, "no forward chest-height reach");
    }
  }
  assert.deepEqual(walkStudyPose(0), walkStudyPose(8));
  const a = walkStudyPose(7.999).near.hand,
    b = walkStudyPose(0).near.hand;
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 0.02);
});
test("planted feet stay level and move back at a fixed pace during support", () => {
  const samples = Array.from({ length: 6 }, (_, i) => walkStudyPose(i).near);
  for (let i = 1; i < samples.length; i++) {
    assert.equal(samples[i].ankle.y, samples[0].ankle.y);
    assert.ok(Math.abs(samples[i].ankle.x - samples[i - 1].ankle.x + 4) < 1e-9);
  }
  assert.ok(walkStudyPose(6).near.ankle.y < samples[0].ankle.y);
});

test("every delivered return step brings the boots together before the next contact", async () => {
  for (const id of residentIds) {
    const widths = [];
    for (const frame of [4, 7]) {
      // Actual rendered boots, below the skirt/coat: this failed when frame 8
      // was another wide contact pose instead of the returning near leg.
      const data = await sharp(`public/home-pixel/${id}.webp`)
        .extract({
          left: (frame % 4) * 128,
          top: Math.floor(frame / 4) * 128 + 99,
          width: 128,
          height: 24,
        })
        .ensureAlpha()
        .raw()
        .toBuffer();
      let left = 128,
        right = -1;
      for (let y = 0; y < 24; y++)
        for (let x = 0; x < 128; x++) {
          if (data[(y * 128 + x) * 4 + 3] > 160) {
            left = Math.min(left, x);
            right = Math.max(right, x);
          }
        }
      assert.ok(right > left, `${id}: missing boots at ${frame + 1}`);
      widths.push(right - left + 1);
    }
    assert.ok(
      widths[1] < widths[0] * 0.75,
      `${id}: frame 8 is still a wide contact pose: ${widths}`,
    );
  }
});

test("Aria's far glove leaves the forward position during the opposite half-stride", async () => {
  const visible = [];
  for (let frame = 0; frame < 8; frame++) {
    // Measured delivered-atlas region in front of the waist. This is the far
    // glove in the contact pose, not the nearer glove crossing the skirt.
    const { data } = await sharp("public/home-pixel/aria.webp")
      .extract({
        left: (frame % 4) * 128 + 81,
        top: Math.floor(frame / 4) * 128 + 75,
        width: 22,
        height: 19,
      })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let brown = 0;
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = data.subarray(i, i + 4);
      if (a > 160 && r > 45 && r < 180 && r > g * 1.2 && g > b * 1.1) brown++;
    }
    visible.push(brown);
  }
  assert.ok(visible[0] > 20 && visible[7] > 20, `forward glove missing: ${visible}`);
  for (const f of [3, 4, 5])
    assert.ok(visible[f] < 16, `far glove stuck forward at ${f}: ${visible}`);
});
