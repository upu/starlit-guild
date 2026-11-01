import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds, spriteBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

const source = (root, name, version = 1) =>
  readFile(new URL(`assets/source/story-stage/${name}-v${version}.png`, root));
export async function brekkaVisitPoses(root, name, raw, image) {
  const id = name.replace(/-poses$/, "");
  if (!name.endsWith("-poses") || !["aria", "leon", "mira", "finn", "lico", "doctor"].includes(id))
    return { raw, image };
  const original = await sharp(image).ensureAlpha().raw().toBuffer();
  const row = Buffer.alloc(512 * 128 * 4);
  let input;
  if (id === "mira" || id === "doctor") {
    input = await source(
      root,
      id === "mira" ? "mira-visit" : "doctor-records",
      id === "mira" ? 2 : 1,
    );
    const base = await readFrame(image, { left: 0, top: 0, width: 128, height: 128 });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    const { width, height } = await sharp(input).metadata();
    for (let col = 0; col < 4; col++) {
      // The extended palm crosses the nominal second-cell boundary; the clear gutter is at 1150.
      const cuts =
        id === "mira"
          ? [0, 543, 1150, 1629, width]
          : [0, 1, 2, 3, 4].map((n) => Math.floor((n * width) / 4));
      const left = cuts[col],
        end = cuts[col + 1];
      const frame = await readFrame(input, { left, top: 0, width: end - left, height });
      if (
        frame.box.left < 2 ||
        frame.box.top < 2 ||
        frame.box.left + frame.box.width > end - left - 2 ||
        frame.box.top + frame.box.height > height - 2
      )
        throw Error(`${id}: visit pose touches source edge`);
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
      raw: { width: 512, height: id === "doctor" ? 256 : 2048, channels: 4 },
    })
      .webp({ lossless: true })
      .toBuffer(),
  };
}
export async function brekkaVisitProps(root, emit) {
  const bottle = await source(root, "ale-bottle");
  await emit(
    "prop-ale-bottle",
    bottle,
    await sharp(bottle)
      .extract(await spriteBounds(bottle))
      .resize(128)
      .webp({ lossless: true })
      .toBuffer(),
  );
  const homes = await source(root, "brekka-homes");
  await emit(
    "brekka-homes",
    homes,
    await sharp(homes).resize(960, 640).webp({ lossless: true }).toBuffer(),
  );
}
