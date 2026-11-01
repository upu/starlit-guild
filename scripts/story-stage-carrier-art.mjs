import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds, spriteBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

export async function reviewWorkerMotion(root, name, raw, image) {
  if (name !== "worker-poses") return { raw, image };
  const source = await readFile(new URL("assets/source/story-stage/worker-motion-v2.png", root));
  const size = await sharp(source).metadata();
  const ref = await readFrame(image, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(await sharp(ref.cell).extract(ref.box).png().toBuffer(), 0.25);
  const layers = [{ input: image, left: 0, top: 0 }];
  for (let i = 0; i < 8; i++) {
    const frame = await readFrame(source, {
      left: ((i % 4) * size.width) / 4,
      top: (Math.floor(i / 4) * size.height) / 2,
      width: size.width / 4,
      height: size.height / 2,
    });
    const f = await registerHeroPose(frame, head.width, i === 6 ? undefined : 96);
    layers.push({
      input: f.input,
      left: (i % 4) * 128 + f.left,
      top: (1 + Math.floor(i / 4)) * 128 + f.top,
    });
  }
  return {
    raw: Buffer.concat([raw, source]),
    image: await sharp({
      create: { width: 512, height: 384, channels: 4, background: "#00000000" },
    })
      .composite(layers)
      .webp({ lossless: true })
      .toBuffer(),
  };
}

export async function carrierAssets(root, emit) {
  const fork = await readFile(
    new URL("assets/source/story-stage/mountain-fork-empty-v1.png", root),
  );
  await emit(
    "mountain-fork-empty",
    fork,
    await sharp(fork).resize({ width: 960 }).webp({ lossless: true }).toBuffer(),
  );
  const raw = await readFile(new URL("assets/source/story-stage/carrier-props-v1.png", root));
  const size = await sharp(raw).metadata();
  for (const [i, name] of [
    "signpost-portable",
    "honey-bag-open",
    "trade-parcels",
    "trade-parcels-open",
  ].entries()) {
    const frame = await readFrame(raw, {
      left: ((i % 2) * size.width) / 2,
      top: (Math.floor(i / 2) * size.height) / 2,
      width: size.width / 2,
      height: size.height / 2,
    });
    const crop = await sharp(frame.cell).extract(frame.box).png().toBuffer();
    const image =
      name === "honey-bag-open"
        ? await bagCanvas(crop)
        : await sharp(crop).resize({ width: 256 }).webp({ lossless: true }).toBuffer();
    await emit(`prop-${name}`, raw, image);
  }
  const bag = await readFile(new URL("public/story-stage/prop-delivery-bag.webp", root));
  await emit("prop-honey-bag", bag, await bagCanvas(bag));
}

async function bagCanvas(raw) {
  const image = await sharp(raw)
    .extract(await spriteBounds(raw))
    .resize({ width: 256 })
    .png()
    .toBuffer();
  return sharp({ create: { width: 256, height: 280, channels: 4, background: "#00000000" } })
    .composite([{ input: image, gravity: "south" }])
    .webp({ lossless: true })
    .toBuffer();
}
