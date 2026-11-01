import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds, spriteBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

const source = (root, name, version = 1) =>
  readFile(new URL(`assets/source/story-stage/${name}-v${version}.png`, root));
export async function mossTrailPoses(root, name, raw, image) {
  const id = name.replace(/-poses$/, "");
  if (!name.endsWith("-poses") || !["aria", "leon", "mira", "finn", "lico", "worker"].includes(id))
    return { raw, image };
  const original = await sharp(image).ensureAlpha().raw().toBuffer();
  const row = Buffer.alloc(512 * 128 * 4);
  let input;
  if (id === "mira" || id === "worker") {
    input = await source(root, id === "mira" ? "mira-all-nighter" : "worker-cart");
    const base = await readFrame(image, { left: 0, top: 0, width: 128, height: 128 });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    const { width, height } = await sharp(input).metadata();
    for (let col = 0; col < 4; col++) {
      const cuts = [0, 1, 2, 3, 4].map((n) => Math.floor((n * width) / 4));
      const left = cuts[col],
        end = cuts[col + 1];
      const frame = await readFrame(input, { left, top: 0, width: end - left, height });
      if (
        frame.box.left < 2 ||
        frame.box.top < 2 ||
        frame.box.left + frame.box.width > end - left - 2 ||
        frame.box.top + frame.box.height > height - 2
      )
        throw Error(`${id}: trail pose touches source edge`);
      const pose = await registerHeroPose(frame, head.width, 96);
      const cell = await sharp({
        create: { width: 128, height: 128, channels: 4, background: "#00000000" },
      })
        .composite([pose])
        .raw()
        .toBuffer();
      for (let y = 0; y < 128; y++)
        cell.copy(row, (y * 512 + col * 128) * 4, y * 512, (y + 1) * 512);
    }
  } else original.copy(row, 0, 0, row.length);
  return {
    raw: input ? Buffer.concat([raw, input]) : raw,
    image: await sharp(Buffer.concat([original, row]), {
      raw: { width: 512, height: id === "worker" ? 768 : 2176, channels: 4 },
    })
      .webp({ lossless: true })
      .toBuffer(),
  };
}
export async function mossTrailProps(root, emit) {
  const foyer = await source(root, "brekka-foyer");
  await emit(
    "brekka-foyer",
    foyer,
    await sharp(foyer).resize(960, 640).webp({ lossless: true }).toBuffer(),
  );
  const wheel = await source(root, "cart-wheel");
  await emit(
    "prop-cart-wheel",
    wheel,
    await sharp(wheel)
      .extract(await spriteBounds(wheel))
      .resize(128, 128, { fit: "fill" })
      .webp({ lossless: true })
      .toBuffer(),
  );
}

export async function secondDayBackgrounds(root, emit) {
  for (const [name, version] of [
    ["brekka-fork", 1],
    ["brekka-tower-path", 2],
  ]) {
    const raw = await source(root, name, version);
    await emit(name, raw, await sharp(raw).resize(960, 640).webp({ lossless: true }).toBuffer());
  }
}
