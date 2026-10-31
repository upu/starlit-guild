import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

export async function diningTeaPoses(root, name, raw, image) {
  const id = name.replace(/-poses$/, "");
  if (!name.endsWith("-poses") || !["aria", "leon", "mira", "finn", "lico"].includes(id))
    return { raw, image };
  const row = ["aria", "leon", "mira"].indexOf(id);
  const layers = [];
  let source;
  if (row >= 0) {
    source = await readFile(new URL("assets/source/story-stage/dining-tea-v1.png", root));
    const { width } = await sharp(source).metadata();
    // Cut through the actual empty gutters, preserving Mira's raised hair curl.
    const cuts = [0, 500, 995, 1536];
    const height = cuts[row + 1] - cuts[row];
    const base = await readFrame(image, { left: 0, top: 768, width: 128, height: 128 });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    for (let col = 0; col < 2; col++) {
      const frame = await readFrame(source, {
        left: (col * width) / 2,
        top: cuts[row],
        width: width / 2,
        height,
      });
      if (
        frame.box.left < 2 ||
        frame.box.top < 2 ||
        frame.box.left + frame.box.width > width / 2 - 2 ||
        frame.box.top + frame.box.height > height - 2
      )
        throw new Error("Tea pose touches source cell boundary");
      const pose = await registerHeroPose(frame, head.width, base.box.height);
      const cell = await sharp({
        create: { width: 128, height: 128, channels: 4, background: "#00000000" },
      })
        .composite([pose])
        .png()
        .toBuffer();
      layers.push({ input: cell, left: col * 128, top: 0 });
      layers.push({
        input: await sharp(cell).flop().png().toBuffer(),
        left: (col + 2) * 128,
        top: 0,
      });
    }
  } else {
    // Reserve the same atlas row for every party member; unused cells retain seated poses.
    layers.push({
      input: await sharp(image)
        .extract({ left: 0, top: 768, width: 512, height: 128 })
        .png()
        .toBuffer(),
      left: 0,
      top: 0,
    });
  }
  const original = await sharp(image).ensureAlpha().raw().toBuffer();
  const additions = await sharp({
    create: { width: 512, height: 128, channels: 4, background: "#00000000" },
  })
    .composite(layers)
    .raw()
    .toBuffer();
  return {
    raw: source ? Buffer.concat([raw, source]) : raw,
    image: await sharp(Buffer.concat([original, additions]), {
      raw: { width: 512, height: 1664, channels: 4 },
    })
      .webp({ lossless: true })
      .toBuffer(),
  };
}
