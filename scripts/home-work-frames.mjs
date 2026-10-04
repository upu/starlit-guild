import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { residentArt } from "../lib/home-actor.ts";
import { readFrame, spriteBounds } from "./home-pixel-frames.mjs";

// Keep the authored lean: one scale for all four poses, registered at the boots.
// Registering the crown instead would cancel the head's movement toward the work.
export async function buildWorkAtlas(source, name) {
  const sheet = await readFile(new URL(`${name}-work-v1.png`, source));
  const frames = [];
  for (let i = 0; i < 4; i++)
    frames.push(
      await readFrame(sheet, {
        left: (i % 2) * 768,
        top: Math.floor(i / 2) * 512,
        width: 768,
        height: 512,
      }),
    );
  const scale = residentArt.height / Math.max(...frames.map((f) => f.box.height));
  const composite = [],
    anchors = [];
  for (const [i, f] of frames.entries()) {
    const width = Math.round(f.box.width * scale),
      height = Math.round(f.box.height * scale);
    const image = await sharp(f.cell)
      .extract(f.box)
      .resize(width, height, { kernel: "lanczos3" })
      .png()
      .toBuffer();
    const feet = await spriteBounds(
      await sharp(image)
        .extract({ left: 0, top: height - 10, width, height: 10 })
        .png()
        .toBuffer(),
    );
    const left = Math.round(residentArt.cell / 2 - feet.left - feet.width / 2);
    const top = residentArt.foot - height;
    if (left < 4 || left + width > residentArt.cell - 4 || top < 4)
      throw Error(`${name}/${i} work sprite exceeds cell`);
    composite.push({ input: image, left: i * residentArt.cell + left, top });
    anchors.push({ source: f.box, head: f.head, scale, left, top, width, height });
  }
  const image = await sharp({
    create: {
      width: residentArt.cell * 4,
      height: residentArt.cell,
      channels: 4,
      background: "#00000000",
    },
  })
    .composite(composite)
    .webp({ lossless: true })
    .toBuffer();
  return { image, anchors };
}
