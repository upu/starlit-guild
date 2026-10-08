import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

for (const [id, version] of [
  ["aria", 2],
  ["mira", 3],
])
  test(`${id}'s still mini character is the idle frame of the shared mini art`, async () => {
    const idle = await sharp(`assets/source/road/${id}-v${version}.png`)
      .extract({ left: 0, top: 2 * 384, width: 384, height: 384 })
      .ensureAlpha()
      .raw()
      .toBuffer();
    const still = await sharp(`public/characters/${id}-mini-v${version}.webp`)
      .ensureAlpha()
      .raw()
      .toBuffer();
    for (let p = 0; p < idle.length; p += 4) {
      assert.equal(still[p + 3], idle[p + 3]);
      if (idle[p + 3]) assert.ok(still.subarray(p, p + 3).equals(idle.subarray(p, p + 3)));
    }
  });
