import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  adventureEnemyArt as art,
  adventureEnemyIds,
  originalEnemyArt,
} from "../lib/adventure-enemy-art.ts";
import { largestComponent } from "../lib/sprite-silhouette.ts";
import { spriteBounds } from "./home-pixel-frames.mjs";

const root = new URL("../", import.meta.url),
  output = new URL("public/adventure-enemies/", root);
const check = process.argv.includes("--check"),
  manifest = {},
  anchors = {};
await mkdir(output, { recursive: true });
async function emit(name, buffer) {
  const path = new URL(name, output);
  if (check) {
    if (!(await readFile(path)).equals(buffer)) throw Error(`Stale enemy art: ${name}`);
  } else await writeFile(path, buffer);
  manifest[name] = createHash("sha256").update(buffer).digest("hex");
}
async function originalHeight(id) {
  const original = originalEnemyArt[id];
  const image = sharp(await readFile(new URL(`public${original.asset}`, root)));
  const meta = await image.metadata();
  const [left, top, width, height] =
    original.rect ??
    (original.index !== undefined
      ? [
          Math.round(((original.index % 4) * meta.width) / 4),
          Math.round((Math.floor(original.index / 4) * meta.height) / 3),
          Math.floor(meta.width / 4),
          Math.floor(meta.height / 3),
        ]
      : [0, 0, meta.width, meta.height]);
  const { data, info } = await image
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = largestComponent(new Uint8ClampedArray(data), info.width, info.height);
  const ys = pixels.map((p) => Math.floor(p / info.width));
  let first = height,
    last = 0;
  for (const y of ys) {
    first = Math.min(first, y);
    last = Math.max(last, y);
  }
  return (last - first + 1) / height;
}
for (const id of adventureEnemyIds) {
  const source = await readFile(new URL(`assets/source/adventure-enemies/${id}-v1.png`, root));
  const box = await spriteBounds(source);
  const ratio = await originalHeight(id);
  const height = Math.round(art.height * ratio),
    width = Math.round((box.width * height) / box.height);
  const image = await sharp(source)
    .extract(box)
    .resize(width, height, { kernel: "lanczos3" })
    .png()
    .toBuffer();
  const feet = await spriteBounds(
    await sharp(image)
      .extract({ left: 0, top: height - 16, width, height: 16 })
      .png()
      .toBuffer(),
  );
  const left = Math.round(art.cell / 2 - feet.left - feet.width / 2),
    top = art.foot - height;
  if (left < 8 || left + width > art.cell - 8) throw Error(`Enemy ${id} exceeds padded cell`);
  const delivery = await sharp({
    create: { width: art.cell, height: art.cell, channels: 4, background: "#00000000" },
  })
    .composite([{ input: image, left, top }])
    .webp({ lossless: true })
    .toBuffer();
  await emit(`${id}.webp`, delivery);
  if (id === "mushroom")
    await emit("mushroom-projectile.webp", await sharp(image).webp({ lossless: true }).toBuffer());
  anchors[id] = { source: box, left, top, width, height, originalVisibleFraction: ratio };
}
await emit("anchors.json", Buffer.from(JSON.stringify(anchors, null, 2) + "\n"));
await emit("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2) + "\n"));
console.log("Enemy restyle: checked 11 isolated sprites.");
