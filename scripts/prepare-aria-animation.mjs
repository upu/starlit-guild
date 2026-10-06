import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";

const cell = 384;
const baseline = 346;
const sourceDir = "assets/source/animations";
const targetDir = "assets/source/road";

// Find entire figures, including boots/weapons that cross the generator's equal-cell cuts.
function figures(data, width, height, columns, rows) {
  const labels = new Int16Array(width * height).fill(-1);
  const visited = new Uint8Array(width * height);
  const found = [];
  for (let start = 0; start < visited.length; start++) {
    if (visited[start] || data[start * 4 + 3] < 16) continue;
    const pixels = [start];
    visited[start] = 1;
    let left = width,
      top = height,
      right = 0,
      bottom = 0;
    for (let n = 0; n < pixels.length; n++) {
      const p = pixels[n],
        x = p % width,
        y = Math.floor(p / width);
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
      for (const next of [
        x ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        y ? p - width : -1,
        y < height - 1 ? p + width : -1,
      ]) {
        if (next >= 0 && !visited[next] && data[next * 4 + 3] >= 16) {
          visited[next] = 1;
          pixels.push(next);
        }
      }
    }
    if (pixels.length > 1000) found.push({ pixels, left, top, right, bottom });
  }
  if (found.length !== columns * rows)
    throw Error(`Expected ${columns * rows} figures, got ${found.length}`);
  const queue = [],
    distances = new Uint8Array(labels.length);
  for (const item of found) {
    item.index =
      Math.floor(((item.top + item.bottom) / 2 / height) * rows) * columns +
      Math.floor(((item.left + item.right) / 2 / width) * columns);
    for (const p of item.pixels) {
      labels[p] = item.index;
      queue.push(p);
    }
  }
  if (new Set(found.map((item) => item.index)).size !== found.length)
    throw Error("Ambiguous pose layout");
  // Assign the original faint antialiased edge pixels to the nearest figure. No repainting,
  // color-keying or alpha replacement; unlike a rectangular crop, adjacent figures stay separate.
  for (let n = 0; n < queue.length; n++) {
    const p = queue[n];
    if (distances[p] >= 16) continue;
    const x = p % width,
      y = Math.floor(p / width);
    for (const next of [
      x ? p - 1 : -1,
      x < width - 1 ? p + 1 : -1,
      y ? p - width : -1,
      y < height - 1 ? p + width : -1,
    ]) {
      if (next >= 0 && labels[next] < 0) {
        labels[next] = labels[p];
        distances[next] = distances[p] + 1;
        queue.push(next);
      }
    }
  }
  return { found: found.sort((a, b) => a.index - b.index), labels };
}

async function atlas(name, columns, rows, standing) {
  const { data, info } = await sharp(`${sourceDir}/${name}-generated.png`)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { found, labels } = figures(data, info.width, info.height, columns, rows);
  const cutouts = [];
  for (const item of found) {
    const pixels = Buffer.alloc(data.length);
    let left = info.width,
      top = info.height,
      right = 0,
      bottom = 0;
    for (let p = 0; p < labels.length; p++) {
      if (labels[p] !== item.index || !data[p * 4 + 3]) continue;
      data.copy(pixels, p * 4, p * 4, p * 4 + 4);
      left = Math.min(left, p % info.width);
      right = Math.max(right, p % info.width);
      top = Math.min(top, Math.floor(p / info.width));
      bottom = Math.max(bottom, Math.floor(p / info.width));
    }
    const box = { left, top, width: right - left + 1, height: bottom - top + 1 };
    const png = await sharp(pixels, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .extract(box)
      .png()
      .toBuffer();
    cutouts.push({ png, box, coreHeight: item.bottom - item.top + 1 });
  }
  const heights = standing.map((index) => cutouts[index].coreHeight).sort((a, b) => a - b);
  const scale = Math.min(
    312 / heights[Math.floor(heights.length / 2)],
    ...cutouts.map((item) => Math.min(352 / item.box.width, 330 / item.box.height)),
  );
  const composites = [],
    frames = [];
  for (const [index, item] of cutouts.entries()) {
    const width = Math.round(item.box.width * scale),
      height = Math.round(item.box.height * scale);
    const input = await sharp(item.png).resize(width, height).png().toBuffer();
    const left = Math.round((cell - width) / 2),
      top = baseline - height;
    composites.push({
      input,
      left: (index % columns) * cell + left,
      top: Math.floor(index / columns) * cell + top,
    });
    frames.push({ index, sourceBox: item.box, width, height, left, top });
  }
  await sharp({
    create: {
      width: cell * columns,
      height: cell * rows,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(`${targetDir}/${name}.png`);
  return {
    sourceDimensions: [info.width, info.height],
    outputDimensions: [cell * columns, cell * rows],
    scale,
    frames,
  };
}

mkdirSync(targetDir, { recursive: true });
const main = await atlas("aria-v2", 4, 4, [0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15]);
const work = await atlas("aria-work-v1", 2, 2, [0, 1]);
// Existing adventure renderer has twelve semantic slots, separate from the road's gather/work slots.
const legacyOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 12, 11, 13];
await sharp(`${targetDir}/aria-v2.png`)
  .extract({ left: 0, top: cell * 2, width: cell, height: cell })
  .webp({ lossless: true, effort: 6 })
  .toFile("public/characters/aria-mini-v2.webp");
const legacyWidth = cell * 4;
const legacyHeight = cell * 3;
const legacy = Buffer.alloc(legacyWidth * legacyHeight * 4);
for (const [index, pose] of legacyOrder.entries()) {
  const input = await sharp(`${targetDir}/aria-v2.png`)
    .extract({
      left: (pose % 4) * cell,
      top: Math.floor(pose / 4) * cell,
      width: cell,
      height: cell,
    })
    .ensureAlpha()
    .raw()
    .toBuffer();
  for (let y = 0; y < cell; y++) {
    const target = ((Math.floor(index / 4) * cell + y) * legacyWidth + (index % 4) * cell) * 4;
    input.copy(legacy, target, y * cell * 4, (y + 1) * cell * 4);
  }
}
await sharp(legacy, { raw: { width: legacyWidth, height: legacyHeight, channels: 4 } })
  .png()
  .toFile("public/animations/aria-v2.png");
const recordPath = "docs/art-generation/aria-mini-refresh-20261006.json";
const record = JSON.parse(readFileSync(recordPath, "utf8"));
record.preparation = {
  script: "scripts/prepare-aria-animation.mjs",
  cell,
  baseline,
  main,
  work,
  legacyOrder,
};
writeFileSync(recordPath, JSON.stringify(record, null, 2) + "\n");
console.log("Prepared 16 road poses, 4 work poses and the 12-slot adventure atlas.");
