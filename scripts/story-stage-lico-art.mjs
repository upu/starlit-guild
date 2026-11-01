import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds, spriteBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

const source = (root, name) => readFile(new URL(`assets/source/story-stage/${name}-v1.png`, root));
async function cell(raw, col, row, cols, rows) {
  const { width, height } = await sharp(raw).metadata();
  const left = Math.round((col * width) / cols),
    top = Math.round((row * height) / rows);
  return readFrame(raw, {
    left,
    top,
    width: Math.round(((col + 1) * width) / cols) - left,
    height: Math.round(((row + 1) * height) / rows) - top,
  });
}

export async function reviewNpcChair(root, name, raw, original) {
  if (!["keeper-poses", "merchant-poses"].includes(name)) return { raw, image: original };
  const reference = await readFrame(original, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(
    await sharp(reference.cell).extract(reference.box).png().toBuffer(),
    0.25,
  );
  const chair = await source(root, name.replace("-poses", "-chair"));
  const frames = [];
  for (let i = 0; i < 4; i++)
    frames.push(await registerHeroPose(await cell(chair, i, 0, 4, 1), head.width, 88));
  const image = await sharp({
    create: { width: 512, height: 256, channels: 4, background: "#00000000" },
  })
    .composite([
      { input: original, left: 0, top: 0 },
      ...frames.map((f, i) => ({ input: f.input, left: i * 128 + f.left, top: 128 + f.top })),
    ])
    .webp({ lossless: true })
    .toBuffer();
  return { raw: Buffer.concat([raw, chair]), image };
}

export async function licoFieldAssets(root, emit) {
  const kit = await source(root, "lico-kit");
  for (const [i, name] of [
    "step-stool",
    "record-board",
    "paper",
    "folded-paper",
    "lap-board",
    "sample-dish",
  ].entries()) {
    const f = await cell(kit, i % 3, Math.floor(i / 3), 3, 2);
    await emit(
      `prop-${name}`,
      kit,
      await sharp(f.cell).extract(f.box).resize({ width: 256 }).webp({ lossless: true }).toBuffer(),
    );
  }
  const device = await source(root, "lico-device");
  const frames = await Promise.all([0, 1, 2].map((i) => cell(device, i, 0, 3, 1)));
  // Keep the footprint and base fixed; the opened plate is allowed to become taller.
  for (const [i, name] of ["reflector-covered", "reflector", "reflector-down"].entries()) {
    const f = frames[i],
      body = await sharp(f.cell).extract(f.box).resize({ width: 256 }).png().toBuffer();
    const bounds = await spriteBounds(body);
    const image = await sharp({
      create: { width: 272, height: 240, channels: 4, background: "#00000000" },
    })
      .composite([{ input: body, left: 8, top: 232 - bounds.height - bounds.top }])
      .webp({ lossless: true })
      .toBuffer();
    await emit(`prop-${name}`, device, image);
  }
  const smoke = await source(root, "low-smoke");
  await emit(
    "prop-low-smoke",
    smoke,
    await sharp(smoke)
      .extract(await spriteBounds(smoke))
      .resize({ width: 512 })
      .webp({ lossless: true })
      .toBuffer(),
  );
}
