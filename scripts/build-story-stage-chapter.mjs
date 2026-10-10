import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, packFrames, spriteBounds } from "./home-pixel-frames.mjs";

export async function chapterAssets(root, emit) {
  const source = (name) => readFile(new URL(`assets/source/story-stage/${name}-v1.png`, root));
  for (const name of [
    "hill-path",
    "hill-night",
    "meeting-night",
    "tower-foot",
    "forest-floor",
    "drain-blocked",
    "drain-cleared",
  ]) {
    const raw = await source(name === "forest-floor" ? "forest-floor-clear" : name);
    await emit(
      name,
      raw,
      await sharp(raw).resize({ width: 960 }).webp({ lossless: true }).toBuffer(),
    );
  }
  const props = await source("chapter-props"),
    meta = await sharp(props).metadata();
  for (const [i, name] of ["moss", "lantern", "basket", "tools", "map", "cloth"].entries()) {
    const frame = await readFrame(props, {
      left: ((i % 3) * meta.width) / 3,
      top: (Math.floor(i / 3) * meta.height) / 2,
      width: meta.width / 3,
      height: meta.height / 2,
    });
    const image = await sharp(frame.cell)
      .extract(await spriteBounds(frame.cell))
      .resize({ width: 192 })
      .webp({ lossless: true })
      .toBuffer();
    await emit(`prop-${name}`, props, image);
  }
  const npcs = await source("tower-npcs"),
    size = await sharp(npcs).metadata();
  for (const [row, name] of ["keeper", "worker"].entries()) {
    const frames = [];
    for (let col = 0; col < 4; col++)
      frames.push(
        await readFrame(npcs, {
          left: (col * size.width) / 4,
          top: (row * size.height) / 2,
          width: size.width / 4,
          height: size.height / 2,
        }),
      );
    await emit(`${name}-poses`, npcs, (await packFrames(frames, 0.25)).image);
  }
  const shawl = await source("aria-shawl"),
    shawlSize = await sharp(shawl).metadata(),
    frames = [];
  for (let i = 0; i < 4; i++)
    frames.push(
      await readFrame(shawl, {
        left: (i % 2) * Math.floor(shawlSize.width / 2),
        top: (Math.floor(i / 2) * shawlSize.height) / 2,
        width: Math.floor(shawlSize.width / 2),
        height: shawlSize.height / 2,
      }),
    );
  await emit("aria-shawl", shawl, (await packFrames(frames, 0.25)).image);
  const field = await source("field-props"),
    fieldSize = await sharp(field).metadata();
  const width = Math.floor(fieldSize.width / 2),
    height = Math.floor(fieldSize.height / 2);
  for (const [i, name] of ["colony", "dish", "stone", "spatula"].entries()) {
    const f = await readFrame(field, {
      left: (i % 2) * width,
      top: Math.floor(i / 2) * height,
      width,
      height,
    });
    await emit(
      `prop-${name}`,
      field,
      await sharp(f.cell).extract(f.box).resize({ width: 192 }).webp({ lossless: true }).toBuffer(),
    );
  }
}
