import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds, spriteBounds } from "./home-pixel-frames.mjs";

export async function fieldLanterns(root, emit) {
  const raw = await readFile(
    new URL("assets/source/story-stage/stone-lantern-states-v2.png", root),
  );
  const { height } = await sharp(raw).metadata();
  // Authored gutters are uneven. These cuts lie in transparent gaps, not through roofs.
  const cuts = [0, 620, 1180, 1750, 2172];
  const names = ["stone-lantern-sooty", "stone-lantern-unlit", "stone-lantern", "oil-dish"];
  for (const [i, name] of names.entries()) {
    const frame = await readFrame(raw, {
      left: cuts[i],
      top: 0,
      width: cuts[i + 1] - cuts[i],
      height,
    });
    const cropped = sharp(frame.cell).extract(frame.box);
    let image;
    if (i === 3) image = await cropped.resize({ width: 128 }).webp({ lossless: true }).toBuffer();
    else {
      const body = await cropped.resize({ height: 376 }).png().toBuffer();
      const roof = await headBounds(body, 0.25);
      image = await sharp({
        create: { width: 320, height: 400, channels: 4, background: "#00000000" },
      })
        .composite([{ input: body, left: Math.round(160 - roof.left - roof.width / 2), top: 16 }])
        .webp({ lossless: true })
        .toBuffer();
    }
    await emit(`prop-${name}`, raw, image);
  }
}

export async function plantLabel(root, emit) {
  const raw = await readFile(new URL("assets/source/story-stage/wood-label-v1.png", root));
  await emit(
    "prop-plant-label",
    raw,
    await sharp(raw)
      .extract(await spriteBounds(raw))
      .resize({ height: 192 })
      .webp({ lossless: true })
      .toBuffer(),
  );
}
