import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds, spriteBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

export async function mossBedPoses(root, name, raw, image) {
  const id = name.replace(/-poses$/, "");
  if (!name.endsWith("-poses") || !["aria", "leon", "mira", "finn", "lico"].includes(id))
    return { raw, image };
  const original = await sharp(image).ensureAlpha().raw().toBuffer();
  const extra = Buffer.alloc(512 * 256 * 4);
  let input;
  if (id === "lico" || id === "mira") {
    input = await readFile(
      new URL(
        `assets/source/story-stage/${id === "lico" ? "lico-study" : "mira-moss-care"}-v1.png`,
        root,
      ),
    );
    const base = await readFrame(image, { left: 0, top: 0, width: 128, height: 128 });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    const { width, height } = await sharp(input).metadata();
    const rows = id === "lico" ? 2 : 1;
    for (let i = 0; i < rows * 4; i++) {
      const left = Math.round(((i % 4) * width) / 4),
        top = Math.round((Math.floor(i / 4) * height) / rows);
      const frame = await readFrame(input, {
        left,
        top,
        width: Math.round((((i % 4) + 1) * width) / 4) - left,
        height: Math.round(((Math.floor(i / 4) + 1) * height) / rows) - top,
      });
      const pose = await registerHeroPose(
        frame,
        head.width,
        id === "lico" && i === 7 ? undefined : 96,
      );
      const cell = await sharp({
        create: { width: 128, height: 128, channels: 4, background: "#00000000" },
      })
        .composite([pose])
        .raw()
        .toBuffer();
      for (let y = 0; y < 128; y++)
        cell.copy(
          extra,
          ((Math.floor(i / 4) * 128 + y) * 512 + (i % 4) * 128) * 4,
          y * 512,
          (y + 1) * 512,
        );
    }
    if (id === "mira") original.copy(extra, 512 * 128 * 4, 0, 512 * 128 * 4);
  } else {
    original.copy(extra, 0, 0, extra.length);
  }
  return {
    raw: input ? Buffer.concat([raw, input]) : raw,
    image: await sharp(Buffer.concat([original, extra]), {
      raw: { width: 512, height: 2432, channels: 4 },
    })
      .webp({ lossless: true })
      .toBuffer(),
  };
}

export async function mossBedProps(root, emit) {
  const raw = await readFile(new URL("assets/source/story-stage/doctor-satchel-v1.png", root));
  await emit(
    "prop-doctor-satchel",
    raw,
    await sharp(raw)
      .extract(await spriteBounds(raw))
      .resize(256, 256, { fit: "contain", background: "#00000000" })
      .webp({ lossless: true })
      .toBuffer(),
  );
}
