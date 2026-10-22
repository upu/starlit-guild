import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

const source = (root, id) =>
  readFile(new URL(`assets/source/story-stage/${id}-motion-v1.png`, root));
async function grid(raw) {
  const { width, height } = await sharp(raw).metadata();
  return Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      readFrame(raw, {
        left: ((i % 3) * width) / 3,
        top: (Math.floor(i / 3) * height) / 2,
        width: width / 3,
        height: height / 2,
      }),
    ),
  );
}

/** Preserve the four existing masked poses; append walk x4, shallow bow, deep bow. */
export async function reviewMaskedMotion(root, name, raw, original) {
  if (name !== "masked-pumpety-poses") return { raw, image: original };
  const sheet = await source(root, "masked-pumpety");
  const rects = [
    ...Array.from({ length: 4 }, (_, i) => ({ left: i * 384, top: 0, width: 384, height: 560 })),
    { left: 192, top: 560, width: 576, height: 464 },
    { left: 768, top: 560, width: 576, height: 464 },
  ];
  const reference = await readFrame(original, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(
    await sharp(reference.cell).extract(reference.box).png().toBuffer(),
    0.25,
  );
  const frames = await Promise.all(
    rects.map(async (rect, i) =>
      registerHeroPose(await readFrame(sheet, rect), head.width, i < 4 ? 96 : undefined),
    ),
  );
  const standing = await Promise.all(
    Array.from({ length: 4 }, async (_, i) => {
      const f = await readFrame(original, { left: i * 128, top: 0, width: 128, height: 128 });
      return {
        input: await sharp(f.cell).extract(f.box).png().toBuffer(),
        left: i * 128 + f.box.left,
        top: 120 - f.box.height,
      };
    }),
  );
  return {
    raw: Buffer.concat([raw, sheet]),
    image: await sharp({
      create: { width: 512, height: 384, channels: 4, background: "#00000000" },
    })
      .composite([
        ...standing,
        ...frames.map((f, i) => ({
          input: f.input,
          left: ((i + 4) % 4) * 128 + f.left,
          top: Math.floor((i + 4) / 4) * 128 + f.top,
        })),
      ])
      .webp({ lossless: true })
      .toBuffer(),
  };
}

/** 512px cells: idle, four footfalls, lowered pose, bow; common ground contact at y=480. */
export async function puppetMotionAssets(root, emit) {
  for (const id of ["golem", "puppet"]) {
    const raw = await source(root, id),
      frames = await grid(raw);
    const original = await readFile(new URL(`public/story-stage/prop-${id}.webp`, root));
    const ref = await sharp(original).metadata();
    const scale = ref.height / Math.max(...frames.slice(0, 4).map((f) => f.box.height));
    const layers = [
      { input: original, left: Math.round(256 - ref.width / 2), top: 480 - ref.height },
    ];
    for (const [i, f] of frames.entries()) {
      // The generated golem's low poses have enlarged heads. Correct the whole pose uniformly.
      const factor = scale * (id === "golem" && i >= 4 ? 0.875 : 1);
      const width = Math.round(f.box.width * factor),
        height = Math.round(f.box.height * factor);
      if (width > 496 || height > 464) throw Error(`${id}/${i}: motion exceeds padded cell`);
      const input = await sharp(f.cell).extract(f.box).resize(width, height).png().toBuffer();
      const frame = i + 1;
      layers.push({
        input,
        left: (frame % 4) * 512 + Math.round(256 - width / 2),
        top: Math.floor(frame / 4) * 512 + 480 - height,
      });
    }
    await emit(
      `prop-${id}-poses`,
      Buffer.concat([raw, original]),
      await sharp({ create: { width: 2048, height: 1024, channels: 4, background: "#00000000" } })
        .composite(layers)
        .webp({ lossless: true })
        .toBuffer(),
    );
  }
}
