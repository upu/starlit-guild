import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds, spriteBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

export async function recordsPoses(root, name, raw, image) {
  const id = name.replace(/-poses$/, "");
  if (
    !name.endsWith("-poses") ||
    !["aria", "leon", "mira", "finn", "lico", "keeper", "merchant"].includes(id)
  )
    return { raw, image };
  const original = await sharp(image).ensureAlpha().raw().toBuffer();
  const size = await sharp(image).metadata();
  if (["aria", "leon", "mira", "finn"].includes(id))
    return pack(raw, original, original.subarray(0, 512 * 128 * 4), size.height);
  const npc = id !== "lico";
  const source = await readFile(
    new URL(`assets/source/story-stage/${npc ? "records-npcs-v1" : "lico-records-v2"}.png`, root),
  );
  const input = await sharp(source).metadata();
  const base = await readFrame(image, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
  const row = id === "merchant" ? 1 : 0,
    rows = npc ? 2 : 1;
  const layers = [];
  for (let i = 0; i < 4; i++) {
    const left = Math.round((i * input.width) / 4),
      top = Math.round((row * input.height) / rows);
    const frame = await readFrame(source, {
      left,
      top,
      width: Math.round(((i + 1) * input.width) / 4) - left,
      height: Math.round(((row + 1) * input.height) / rows) - top,
    });
    const pose = await registerHeroPose(frame, head.width, npc ? 88 : 80);
    layers.push({ input: pose.input, left: i * 128 + pose.left, top: pose.top });
  }
  const extra = await sharp({
    create: { width: 512, height: 128, channels: 4, background: "#00000000" },
  })
    .composite(layers)
    .raw()
    .toBuffer();
  return pack(Buffer.concat([raw, source]), original, extra, size.height);
}

async function pack(raw, original, extra, height) {
  return {
    raw,
    image: await sharp(Buffer.concat([original, extra]), {
      raw: { width: 512, height: height + 128, channels: 4 },
    })
      .webp({ lossless: true })
      .toBuffer(),
  };
}

export async function recordsProps(root, emit) {
  for (const name of ["reflector-cover", "reflector-cover-flat"]) {
    const raw = await readFile(new URL(`assets/source/story-stage/${name}-v1.png`, root));
    const image = await sharp(raw)
      .extract(await spriteBounds(raw))
      .resize(256, name.endsWith("flat") ? 128 : 256, { fit: "contain", background: "#00000000" })
      .webp({ lossless: true })
      .toBuffer();
    await emit(`prop-${name}`, raw, image);
  }
}
