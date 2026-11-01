import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { adventureRowFrames } from "../scripts/adventure-pixel-frames.mjs";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";

test("idle, blink and cart poses keep walking head scale and almost-standing stature", async () => {
  for (const id of ["aria", "leon", "mira", "finn", "lico"]) {
    const path = `public/adventure-pixel/${id}.webp`;
    const frame = (i) =>
      readFrame(path, {
        left: (i % 4) * 192,
        top: Math.floor(i / 4) * 192,
        width: 192,
        height: 192,
      });
    const walking = await frame(0);
    const head = await headBounds(
      await sharp(walking.cell).extract(walking.box).png().toBuffer(),
      0.25,
    );
    for (const i of [8, 9, 18, 19, 20, 21]) {
      const f = await frame(i);
      const actual = await headBounds(await sharp(f.cell).extract(f.box).png().toBuffer(), 0.25);
      assert.ok(Math.abs(actual.width - head.width) <= 2, `${id}/${i}: walking head width`);
      assert.ok(f.box.height >= 90 && f.box.height <= 97, `${id}/${i}: preserve torso and legs`);
      assert.equal(f.box.top + f.box.height, 176, `${id}/${i}: ground contact`);
    }
  }
});

test("a weapon crossing a nominal column stays whole with its owner", async () => {
  const data = Buffer.alloc(400 * 100 * 4);
  function rectangle(left, top, width, height) {
    for (let y = top; y < top + height; y++)
      for (let x = left; x < left + width; x++) {
        const p = (y * 400 + x) * 4;
        data[p] = 220;
        data[p + 3] = 255;
      }
  }
  rectangle(20, 5, 30, 80);
  rectangle(50, 60, 90, 5);
  for (const left of [150, 230, 330]) rectangle(left, 5, 25, 70);
  const source = await sharp(data, { raw: { width: 400, height: 100, channels: 4 } })
    .png()
    .toBuffer();
  const frames = await adventureRowFrames(source, 0, 100);
  assert.equal(frames[0].box.left + frames[0].box.width, 140, "entire blade retained");
  assert.deepEqual(
    frames.slice(1).map((f) => f.box.width),
    [25, 25, 25],
    "no blade fragments in neighbours",
  );
});
