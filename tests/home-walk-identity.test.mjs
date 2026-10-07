import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { headBounds, spriteBounds } from "../scripts/home-pixel-frames.mjs";

async function measurements(id) {
  const frames = [];
  for (let frame = 0; frame < 8; frame++) {
    const image = await sharp(`public/home-pixel/${id}.webp`)
      .extract({
        left: (frame % 4) * 128,
        top: Math.floor(frame / 4) * 128,
        width: 128,
        height: 128,
      })
      .png()
      .toBuffer();
    const box = await spriteBounds(image);
    const head = await headBounds(await sharp(image).extract(box).png().toBuffer());
    // The registered crown has a stable hair-only region, clear of the face,
    // ornaments and moving sleeves. Compare its median rather than one pixel.
    const pixels = await sharp(image)
      .extract({ left: 56, top: 32, width: 19, height: 12 })
      .ensureAlpha()
      .raw()
      .toBuffer();
    const channels = [[], [], []];
    for (let p = 0; p < pixels.length; p += 4) {
      if (pixels[p + 3] < 240) continue;
      for (let c = 0; c < 3; c++) channels[c].push(pixels[p + c]);
    }
    assert.ok(channels[0].length > 180, `${id}/${frame}: hair measurement is obscured`);
    const color = channels.map((a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)]);
    frames.push({ width: head.width, color });
  }
  return frames;
}

for (const id of ["mira", "finn"]) {
  test(`${id}: walk head size and hair palette stay consistent across both half-cycles`, async () => {
    const frames = await measurements(id);
    const widths = frames.map((f) => f.width);
    assert.ok(Math.max(...widths) - Math.min(...widths) <= 2, `${id}: head pulses: ${widths}`);
    for (let c = 0; c < 3; c++) {
      const average = (part) => part.reduce((sum, f) => sum + f.color[c], 0) / part.length;
      const first = average(frames.slice(0, 4));
      const second = average(frames.slice(4));
      // Allow small painted highlights and resampling differences (10/255),
      // but reject the previous half-sheet palette jump. Visual review remains
      // necessary: this patch does not measure every material or lightness.
      assert.ok(Math.abs(first - second) <= 10, `${id}: hair channel ${c}: ${first} -> ${second}`);
    }
  });
}
