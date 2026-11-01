import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";

test("seedling poses keep previous visible pixels, head scale and feet across standing and crouching", async () => {
  const previous = {
    lico: [80, "61181338e62936be771aeabc138619c8cc6237c988c3b0f7cf695778208372d5", 4],
    merrill: [4, "220442359308f348454cf3b622f58ba5671ca230ec76e1026015e9ca5fe2b0cc", 8],
  };
  for (const [id, [count, hash, added]] of Object.entries(previous)) {
    const path = `public/story-stage/${id}-poses.webp`;
    const old = await sharp(path)
      .extract({ left: 0, top: 0, width: 512, height: (count / 4) * 128 })
      .ensureAlpha()
      .raw()
      .toBuffer();
    for (let i = 0; i < old.length; i += 4) if (!old[i + 3]) old.fill(0, i, i + 3);
    assert.equal(createHash("sha256").update(old).digest("hex"), hash, id);
    const base = await readFrame(path, { left: 0, top: 0, width: 128, height: 128 });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    for (let i = count; i < count + added; i++) {
      const frame = await readFrame(path, {
        left: (i % 4) * 128,
        top: Math.floor(i / 4) * 128,
        width: 128,
        height: 128,
      });
      const h = await headBounds(await sharp(frame.cell).extract(frame.box).png().toBuffer(), 0.25);
      assert.ok(Math.abs(h.width - head.width) <= 2, `${id}/${i} head`);
      assert.equal(frame.box.height, id === "merrill" && [4, 10].includes(i) ? 68 : 96);
      assert.equal(frame.box.top + frame.box.height, 120);
      assert.ok(frame.box.left >= 2 && frame.box.left + frame.box.width <= 126);
    }
  }
});
