import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFrame } from "../scripts/home-pixel-frames.mjs";
import { registerWorkPose } from "../scripts/story-stage-pose-frames.mjs";

test("registering a standing pose preserves crown and toe pixels when its aspect changes", async () => {
  const source = await sharp(
    Buffer.from(`<svg width="100" height="180">
    <rect x="20" y="10" width="60" height="40" fill="white"/>
    <rect x="20" y="10" width="60" height="5" fill="red"/>
    <rect x="35" y="50" width="30" height="100" fill="white"/>
    <rect x="25" y="150" width="50" height="20" fill="white"/>
    <rect x="25" y="165" width="50" height="5" fill="blue"/>
  </svg>`),
  )
    .png()
    .toBuffer();
  const frame = await readFrame(source, { left: 0, top: 0, width: 100, height: 180 });
  for (const width of [40, 55]) {
    const pose = await registerWorkPose(frame, width, 96);
    const pixels = await sharp(pose.input).ensureAlpha().raw().toBuffer();
    let crown = 0,
      toes = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < 96) continue;
      if (pixels[i] > 200 && pixels[i + 1] < 50 && pixels[i + 2] < 50) crown++;
      if (pixels[i + 2] > 200 && pixels[i] < 50 && pixels[i + 1] < 50) toes++;
    }
    assert.ok(crown > 30, `crown survives registration at head width ${width}`);
    assert.ok(toes > 30, `toes survive registration at head width ${width}`);
  }
});
