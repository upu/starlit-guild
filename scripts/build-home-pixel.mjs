import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { residentArt } from "../lib/home-actor.ts";
import { spriteBounds as bounds, readFrame, packFrames, rowCuts } from "./home-pixel-frames.mjs";
import { readWalkFrames } from "./home-walk-frames.mjs";
import { buildWorkAtlas } from "./home-work-frames.mjs";

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
const anchors = {};
for (const name of names) {
  const restyled = name === "mira" || name === "lico";
  const version = name === "lico" ? 3 : restyled ? 2 : 1;
  // Original overnight artwork remains the style master; retakes refine contours and Lico hair.
  const original = await readFile(
    new URL(`${name}-v${name === "lico" ? 4 : restyled ? 3 : 1}.png`, source),
  );
  const originalCuts = await rowCuts(original, 3);
  const frames = await readWalkFrames(source, name);
  for (let i = 8; i < residentArt.frames; i++) {
    const index = i - 4;
    const top = originalCuts[Math.floor(index / 4)];
    const bottom = originalCuts[Math.floor(index / 4) + 1];
    frames.push(
      await readFrame(original, {
        left: (index % 4) * 384,
        top,
        width: 384,
        height: bottom - top,
      }),
    );
  }
  const atlas = await packFrames(frames);
  anchors[name] = atlas.anchors;
  await emit(`${name}.webp`, atlas.image);
  const actionSource = await readFile(new URL(`${name}-actions-v${version}.png`, source));
  const cuts = await rowCuts(actionSource, 3),
    actions = [];
  for (let i = 0; i < 12; i++) {
    // Leon's generator placed six walkers on row one; record this source layout.
    const row = name === "leon" ? (i < 6 ? 0 : i < 10 ? 1 : 2) : Math.floor(i / 4);
    const col = name === "leon" ? (i < 6 ? i : i < 10 ? i - 6 : i - 10) : i % 4;
    const edges =
      name === "leon" && row === 0
        ? [0, 314, 587, 840, 1080, 1310, 1536]
        : [0, 384, 768, 1152, 1536];
    actions.push(
      await readFrame(actionSource, {
        left: edges[col],
        top: cuts[row],
        width: edges[col + 1] - edges[col],
        height: cuts[row + 1] - cuts[row],
      }),
    );
  }
  {
    const rear = await readFile(
      new URL(`${name}-rear-walk-v${name === "lico" ? 4 : 3}.png`, source),
    );
    for (let i = 0; i < 6; i++)
      actions[i] = await readFrame(rear, {
        left: (i % 3) * 512,
        top: Math.floor(i / 3) * 512,
        width: 512,
        height: 512,
      });
  }
  const actionAtlas = await packFrames(actions);
  anchors[`${name}-actions`] = actionAtlas.anchors;
  await emit(`${name}-actions.webp`, actionAtlas.image);
  const tea = [];
  for (const direction of ["right", "left"]) {
    const sheet = await readFile(new URL(`${name}-tea-v1-${direction}.png`, source));
    for (let i = 0; i < 4; i++)
      tea.push(
        await readFrame(sheet, {
          left: (i % 2) * 768,
          top: Math.floor(i / 2) * 512,
          width: 768,
          height: 512,
        }),
      );
  }
  const teaAtlas = await packFrames(tea);
  anchors[`${name}-tea`] = teaAtlas.anchors;
  await emit(`${name}-tea.webp`, teaAtlas.image);
  const workAtlas = await buildWorkAtlas(source, name);
  anchors[`${name}-work`] = workAtlas.anchors;
  await emit(`${name}-work.webp`, workAtlas.image);
  const gardenAtlas = await buildWorkAtlas(source, name, "garden");
  anchors[`${name}-garden`] = gardenAtlas.anchors;
  await emit(`${name}-garden.webp`, gardenAtlas.image);
}
await emit("anchors.json", Buffer.from(JSON.stringify(anchors, null, 2) + "\n"));
for (const sheet of ["icons", "decor"]) {
  const buffer = await readFile(new URL(`${sheet}-v1.png`, source));
  for (let i = 0; i < 6; i++) {
    // Decorations have uneven generated columns, with clear gutters at 582/1024.
    const edges = sheet === "decor" ? [0, 582, 1024, 1536] : [0, 512, 1024, 1536];
    const cell = await sharp(buffer)
      .extract({
        left: edges[i % 3],
        top: Math.floor(i / 3) * 512,
        width: edges[(i % 3) + 1] - edges[i % 3],
        height: 512,
      })
      .png()
      .toBuffer();
    const box = await bounds(cell);
    await emit(
      `${sheet}-${i}.webp`,
      await sharp(cell)
        .extract(box)
        .resize({
          width: sheet === "icons" ? 96 : Math.round(box.width / 2),
          kernel: sheet === "icons" ? "nearest" : "lanczos3",
        })
        .webp({ lossless: true })
        .toBuffer(),
    );
  }
}
const props = await readFile(new URL("furniture-v1.png", source));
for (let i = 0; i < regions.length; i++) {
  const [left, top, width, height] = regions[i];
  const cell =
    i === 0
      ? await readFile(new URL("table-v2.png", source))
      : await sharp(props).extract({ left, top, width, height }).png().toBuffer();
  const box = await bounds(cell);
  const image = await sharp(cell)
    .extract(box)
    .resize({ width: i === 0 ? 450 : Math.round(box.width / 2), kernel: "nearest" })
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
