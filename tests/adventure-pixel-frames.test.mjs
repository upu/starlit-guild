import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { adventureRowFrames } from "../scripts/adventure-pixel-frames.mjs";

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
