import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { residentArt } from "../lib/home-actor.ts";

const root = new URL("../", import.meta.url);
const source = new URL("assets/source/home-pixel/", root);
const output = new URL("public/home-pixel/", root);
const check = process.argv.includes("--check");
const names = ["leon", "aria", "mira", "finn", "lico"];
const regions = [
  [0, 30, 478, 312],
  [500, 45, 248, 297],
  [804, 40, 263, 302],
  [1100, 40, 436, 302],
  [0, 350, 430, 350],
  [441, 343, 323, 357],
  [786, 425, 382, 275],
  [1180, 475, 356, 225],
  [0, 735, 369, 289],
  [408, 707, 232, 317],
  [654, 737, 474, 287],
  [1131, 735, 405, 289],
];
await mkdir(output, { recursive: true });
const manifest = {};
async function emit(name, buffer) {
  manifest[name] = createHash("sha256").update(buffer).digest("hex");
  const path = new URL(name, output);
  if (check) {
    if (!(await readFile(path)).equals(buffer)) throw Error(`Stale pixel delivery: ${name}`);
  } else await writeFile(path, buffer);
}
async function bounds(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width,
    top = info.height,
    right = 0,
    bottom = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] < 96) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  if (right <= left) throw Error("Empty sprite");
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}
for (const name of names) {
  const original = await readFile(new URL(`${name}-v1.png`, source));
  const walking = await readFile(new URL(`${name}-walk-v2.png`, source));
  const frames = [];
  for (let i = 0; i < residentArt.frames; i++) {
    const index = i < 8 ? i : i - 4;
    const rows = i < 8 ? 2 : 3;
    const top = Math.floor((Math.floor(index / 4) * 1024) / rows),
      bottom = Math.floor(((Math.floor(index / 4) + 1) * 1024) / rows);
    const cell = await sharp(i < 8 ? walking : original)
      .extract({ left: (index % 4) * 384, top, width: 384, height: bottom - top })
      .png()
      .toBuffer();
    frames.push({ cell, box: await bounds(cell) });
  }
  const idleScale = residentArt.height / frames[8].box.height;
  const walkHeights = frames
    .slice(0, 8)
    .map((f) => f.box.height)
    .sort((a, b) => a - b);
  const walkScale = residentArt.height / ((walkHeights[3] + walkHeights[4]) / 2);
  const size = residentArt.cell;
  const composite = [];
  for (let i = 0; i < frames.length; i++) {
    const { cell, box } = frames[i];
    const scale = i < 8 ? walkScale : idleScale;
    const width = Math.round(box.width * scale),
      height = Math.round(box.height * scale);
    const image = await sharp(cell)
      .extract(box)
      .resize(width, height, { kernel: "lanczos3" })
      .png()
      .toBuffer();
    composite.push({
      input: image,
      left:
        (i % 4) * size +
        (i < 8
          ? Math.round((size - 384 * scale) / 2 + box.left * scale)
          : Math.floor((size - width) / 2)),
      top: Math.floor(i / 4) * size + residentArt.foot - height,
    });
  }
  const atlas = await sharp({
    create: { width: size * 4, height: size * 4, channels: 4, background: "#00000000" },
  })
    .composite(composite)
    .webp({ lossless: true })
    .toBuffer();
  await emit(`${name}.webp`, atlas);
}
const props = await readFile(new URL("furniture-v1.png", source));
for (let i = 0; i < regions.length; i++) {
  const [left, top, width, height] = regions[i];
  const cell = await sharp(props).extract({ left, top, width, height }).png().toBuffer();
  const box = await bounds(cell);
  const image = await sharp(cell)
    .extract(box)
    .resize({ width: Math.round(box.width / 2), kernel: "nearest" })
    .webp({ lossless: true })
    .toBuffer();
  await emit(`prop-${i}.webp`, image);
}
const tiles = await readFile(new URL("tiles-v1.png", source));
for (let i = 0; i < 6; i++) {
  const image = await sharp(tiles)
    .extract({ left: (i % 3) * 512, top: Math.floor(i / 3) * 512, width: 512, height: 512 })
    .resize(48, 48, { kernel: "nearest" })
    .webp({ lossless: true })
    .toBuffer();
  await emit(`tile-${i}.webp`, image);
}
if (check) {
  const recorded = JSON.parse(await readFile(new URL("manifest.json", output), "utf8"));
  if (JSON.stringify(recorded) !== JSON.stringify(manifest))
    throw Error("Stale home-pixel manifest");
} else await writeFile(new URL("manifest.json", output), JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `Home pixel art: ${check ? "verified" : "built"} ${Object.keys(manifest).length} images.`,
);
