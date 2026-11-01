import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds, rowCuts } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";
import { surveyCook } from "./story-stage-survey-art.mjs";

async function cell(raw, index, columns, rows) {
  const { width, height } = await sharp(raw).metadata();
  const left = Math.floor(((index % columns) * width) / columns),
    right = Math.floor((((index % columns) + 1) * width) / columns),
    top = Math.floor((Math.floor(index / columns) * height) / rows),
    bottom = Math.floor(((Math.floor(index / columns) + 1) * height) / rows);
  return readFrame(raw, {
    left,
    top,
    width: right - left,
    height: bottom - top,
  });
}
export async function reviewManorNpc(root, name, raw, image) {
  if (name !== "cook-poses" && name !== "merchant-poses") return { raw, image };
  const cook = name === "cook-poses";
  const source = await readFile(
    new URL(`assets/source/story-stage/${cook ? "cook-motion-v2" : "merchant-walk-v2"}.png`, root),
  );
  const ref = await readFrame(image, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(await sharp(ref.cell).extract(ref.box).png().toBuffer(), 0.25);
  const layers = [];
  for (let i = 0; i < (cook ? 8 : 4); i++) {
    const frame = await registerHeroPose(
      await cell(source, i, 4, cook ? 2 : 1),
      head.width,
      ref.box.height,
    );
    layers.push({
      input: frame.input,
      left: (i % 4) * 128 + frame.left,
      top: Math.floor(i / 4) * 128 + frame.top,
    });
  }
  // Copy old RGBA rows directly: compositing semi-transparent edge pixels a
  // second time changes their RGB through premultiplication rounding.
  const original = await sharp(image).ensureAlpha().raw().toBuffer();
  const additions = await sharp({
    create: { width: 512, height: cook ? 256 : 128, channels: 4, background: "#00000000" },
  })
    .composite(layers)
    .raw()
    .toBuffer();
  const result = {
    raw: Buffer.concat([raw, source]),
    image: await sharp(Buffer.concat([original, additions]), {
      raw: { width: 512, height: 384, channels: 4 },
    })
      .webp({ lossless: true })
      .toBuffer(),
  };
  return cook ? surveyCook(root, result.raw, result.image) : result;
}
export async function manorAssets(root, emit) {
  for (const name of ["manor-kitchen", "manor-kitchen-open"]) {
    const raw = await readFile(new URL(`assets/source/story-stage/${name}-v1.png`, root));
    await emit(name, raw, await sharp(raw).resize(960).webp({ lossless: true }).toBuffer());
  }
  const raw = await readFile(new URL("assets/source/story-stage/manor-display-props-v1.png", root));
  const { width } = await sharp(raw).metadata();
  // The glass cases extend below the mathematical half-height of the sheet.
  // Split at its transparent gutter so their bases do not leak into the stones.
  const cuts = await rowCuts(raw, 2);
  const names = [
    "display-open",
    "display-closed",
    "display-covered",
    "tower-stone",
    "tower-stone-bottom",
    "light-cloth",
  ];
  for (const [i, name] of names.entries()) {
    const row = Math.floor(i / 3);
    const f = await readFrame(raw, {
      left: (i % 3) * (width / 3),
      top: cuts[row],
      width: width / 3,
      height: cuts[row + 1] - cuts[row],
    });
    const image = await sharp(f.cell)
      .extract(f.box)
      .resize(256, 320, { fit: "contain", background: "#00000000", position: "bottom" })
      .webp({ lossless: true })
      .toBuffer();
    await emit(`prop-${name}`, raw, image);
  }
}
