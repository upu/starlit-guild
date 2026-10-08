import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { adventureHeroArt as art, adventureHeroIds } from "../lib/adventure-hero-art.ts";
import { residentArt } from "../lib/home-actor.ts";
import { rowCuts, spriteBounds } from "./home-pixel-frames.mjs";
import { adventureRowFrames } from "./adventure-pixel-frames.mjs";

const root = new URL("../", import.meta.url);
const source = new URL("assets/source/adventure-pixel/", root);
const output = new URL("public/adventure-pixel/", root);
const check = process.argv.includes("--check");
const manifest = {};
await mkdir(output, { recursive: true });
async function emit(name, buffer) {
  const file = new URL(name, output);
  if (check) {
    if (!(await readFile(file)).equals(buffer)) throw Error(`Stale adventure pixels: ${name}`);
  } else await writeFile(file, buffer);
  manifest[name] = createHash("sha256").update(buffer).digest("hex");
}

for (const id of adventureHeroIds) {
  const home = await readFile(new URL(`public/home-pixel/${id}.webp`, root));
  const sheet = await readFile(new URL(`${id}-actions-v1.png`, source));
  const cuts = await rowCuts(sheet, 4);
  const frames = (
    await Promise.all(
      cuts.slice(0, -1).map((top, row) => adventureRowFrames(sheet, top, cuts[row + 1])),
    )
  ).flat();
  // One scale for the whole sheet; crouching and leaning retain head size.
  const scale = art.height / frames[14].box.height;
  const pixels = Buffer.alloc(art.cell * 4 * art.cell * 6 * 4);
  const anchors = [];
  async function add(index, buffer, left, top) {
    const meta = await sharp(buffer).metadata();
    if (left < 4 || top < 4 || left + meta.width > art.cell - 4 || top + meta.height > art.cell - 4)
      throw Error(`${id}/${index} exceeds padded cell`);
    const rgba = await sharp(buffer).ensureAlpha().raw().toBuffer();
    const x = (index % 4) * art.cell + left,
      y = Math.floor(index / 4) * art.cell + top;
    for (let row = 0; row < meta.height; row++)
      rgba.copy(
        pixels,
        ((y + row) * art.cell * 4 + x) * 4,
        row * meta.width * 4,
        (row + 1) * meta.width * 4,
      );
  }
  for (let index = 0; index <= 8; index++) {
    const native = await sharp(home)
      .extract({
        left: (index % 4) * residentArt.cell,
        top: Math.floor(index / 4) * residentArt.cell,
        width: residentArt.cell,
        height: residentArt.cell,
      })
      .png()
      .toBuffer();
    await add(index, native, (art.cell - residentArt.cell) / 2, art.foot - residentArt.foot);
  }
  // Delivery slots: blink, attack x4, gather x2, hurt x2, push/pull/pack x2.
  for (const [index, sourceIndex] of [15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].entries()) {
    const f = frames[sourceIndex];
    const width = Math.round(f.box.width * scale),
      height = Math.round(f.box.height * scale);
    const image = await sharp(f.cell)
      .extract(f.box)
      .resize(width, height, { kernel: "lanczos3" })
      .png()
      .toBuffer();
    const feet = await spriteBounds(
      await sharp(image)
        .extract({ left: 0, top: height - 8, width, height: 8 })
        .png()
        .toBuffer(),
    );
    const left = Math.round(art.cell / 2 - feet.left - feet.width / 2),
      top = art.foot - height;
    await add(index + 9, image, left, top);
    anchors.push({ frame: index + 9, sourceIndex, source: f.box, scale, left, top, width, height });
  }
  const image = await sharp(pixels, {
    raw: { width: art.cell * 4, height: art.cell * 6, channels: 4 },
  })
    .webp({ lossless: true })
    .toBuffer();
  await emit(`${id}.webp`, image);
  await emit(`${id}-anchors.json`, Buffer.from(JSON.stringify(anchors, null, 2) + "\n"));
}
await emit("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2) + "\n"));
console.log("冒険のドット絵調素材5人を確認しました。");
