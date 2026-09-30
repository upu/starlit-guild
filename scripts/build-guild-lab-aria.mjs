import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { format } from "prettier";
import { guildLabArt } from "../lib/guild-lab-art.ts";
import { guildLabSourceConfig } from "./guild-lab-source-config.mjs";

const config = guildLabSourceConfig.aria;
const source = config.parts;
const faceSource = config.head;
const expressionsSource = config.expressions;
const output = config.atlas;
// Connected-component bounds reviewed against the transparent generated sheet.
// Order follows the same semantic slots as Leon; 13/14 are back hair and skirt.
const bounds = [
  [26, 24, 355, 324],
  [404, 143, 232, 131],
  [679, 65, 264, 244],
  [971, 63, 348, 261],
  [68, 345, 154, 212],
  [430, 347, 208, 216],
  [774, 344, 158, 215],
  [1083, 347, 201, 232],
  [110, 588, 174, 231],
  [447, 588, 185, 266],
  [773, 585, 183, 244],
  [1070, 588, 192, 262],
  [150, 843, 154, 300],
  [720, 876, 453, 263],
];
const originalCell = async (rect) =>
  sharp(source)
    .extract({ left: rect[0], top: rect[1], width: rect[2], height: rect[3] })
    .ensureAlpha()
    .raw()
    .toBuffer();
const replacements = new Map();
for (const [frame, key] of [
  [2, "torso"],
  [1, "shoulderCape"],
  [12, "hairLock"],
]) {
  const [left, top, width, height] = config.replacements[key];
  const [, , w, h] = bounds[frame];
  replacements.set(
    frame,
    await sharp(config.costumeHair)
      .extract({ left, top, width, height })
      .resize(w, h)
      .ensureAlpha()
      .raw()
      .toBuffer(),
  );
}
for (const [frame, file] of [
  [3, config.backCape],
  [5, config.farPalm],
]) {
  const [, , w, h] = bounds[frame];
  replacements.set(
    frame,
    await sharp(file).trim({ threshold: 20 }).resize(w, h).ensureAlpha().raw().toBuffer(),
  );
}
// Flip only the near forearm artwork, before measuring its joint centres.
const [, , nearW, nearH] = bounds[7];
replacements.set(
  7,
  await sharp(await originalCell(bounds[7]), {
    raw: { width: nearW, height: nearH, channels: 4 },
  })
    .flop()
    .raw()
    .toBuffer(),
);
// Both feet and thighs face right; the far leg reuses the same drawing darkened.
for (const [from, to] of [
  [8, 10],
  [9, 11],
]) {
  const [, , width, height] = bounds[from];
  const [, , w, h] = bounds[to];
  replacements.set(
    to,
    await sharp(await originalCell(bounds[from]), { raw: { width, height, channels: 4 } })
      .resize(w, h)
      .raw()
      .toBuffer(),
  );
  const far = Buffer.from(await originalCell(bounds[from]));
  for (let p = 0; p < far.length; p += 4)
    for (let c = 0; c < 3; c++) far[p + c] = Math.round(far[p + c] * [0.95, 0.9, 0.86][c]);
  replacements.set(from, far);
}
const cell = async (rect) => replacements.get(bounds.indexOf(rect)) ?? originalCell(rect);
function bandCenter(pixels, width, height, from, to) {
  let xSum = 0,
    ySum = 0,
    count = 0;
  for (let y = Math.floor(height * from); y < Math.ceil(height * to); y++)
    for (let x = 0; x < width; x++) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha < 180) continue;
      xSum += x;
      ySum += y;
      count++;
    }
  if (count < 100) throw Error("Missing painted joint band");
  return [Math.round(xSum / count), Math.round(ySum / count)];
}
const joints = async (frame) => {
  const [, , width, height] = bounds[frame];
  const pixels = await cell(bounds[frame]);
  return {
    proximal: bandCenter(pixels, width, height, 0.05, 0.18),
    distal: bandCenter(pixels, width, height, 0.82, 0.95),
  };
};
const art = {
  width: 1332,
  height: 1530,
  frames: bounds.slice(0, 12),
  armJoints: Object.fromEntries(
    await Promise.all([4, 5, 6, 7].map(async (i) => [i, await joints(i)])),
  ),
  legJoints: Object.fromEntries(
    await Promise.all([8, 9, 10, 11].map(async (i) => [i, await joints(i)])),
  ),
  head: {
    displayHeight: 85.5,
    neck: { center: [170, 265] },
    mouth: { x: 259, y: 258, bounds: [244, 246, 30, 24] },
    blink: null,
    expressions: {},
  },
  torso: {
    neck: {
      center: [
        ((config.replacements.neck[0] - config.replacements.torso[0]) * bounds[2][2]) /
          config.replacements.torso[2],
        ((config.replacements.neck[1] - config.replacements.torso[1]) * bounds[2][3]) /
          config.replacements.torso[3],
      ],
      source: config.replacements.neck,
    },
  },
  hairLock: {
    root: bandCenter(await cell(bounds[12]), bounds[12][2], bounds[12][3], 0.01, 0.06),
    reviewed: { ears: 0, flowers: 0, skull: false, view: "right" },
  },
  backCape: { reviewed: { flowers: 0, knots: 0, frontClasp: false } },
  nearGlove: {
    mirrored: config.nearGlove.flip,
    thumb: [nearW - 1 - config.nearGlove.thumb[0], config.nearGlove.thumb[1]],
    outerEdge: [nearW - 1 - config.nearGlove.outerEdge[0], config.nearGlove.outerEdge[1]],
  },
  extras: { backHair: 23, skirt: 24 },
  asset: "/guild/aria-parts-v1.webp",
};
const layers = [];
for (const [frame, pixels] of replacements) {
  const [left, top, width, height] = bounds[frame];
  const clearWidth = frame === 12 ? 502 : width;
  const clearHeight = frame === 12 ? 323 : height;
  layers.push({
    input: await sharp({
      create: { width: clearWidth, height: clearHeight, channels: 4, background: "#000" },
    })
      .png()
      .toBuffer(),
    left,
    top,
    blend: "dest-out",
  });
  layers.push({
    input: await sharp(pixels, { raw: { width, height, channels: 4 } })
      .png()
      .toBuffer(),
    left,
    top,
  });
}
art.seams = {};
for (const [frame, end] of [
  [5, "top"],
  [7, "top"],
  [8, "bottom"],
  [10, "bottom"],
]) {
  const [left, top, width, height] = bounds[frame];
  const pixels = Buffer.from(await cell(bounds[frame]));
  const original = Buffer.from(pixels);
  const anchor = end === "top" ? art.armJoints[frame].proximal[1] : art.legJoints[frame].distal[1];
  const first = end === "top" ? Math.max(0, anchor - 14) : Math.max(0, anchor - 12);
  const last = end === "top" ? Math.min(height, anchor + 10) : height;
  let changedPixels = 0;
  const at = (x, y) => (y * width + x) * 4;
  for (let y = first; y < last; y++)
    for (let x = 0; x < width; x++) {
      const p = at(x, y);
      if (original[p + 3] < 80) continue;
      const nearEdge = [-3, 3].some(
        (dx) =>
          x + dx < 0 ||
          x + dx >= width ||
          original[at(Math.max(0, Math.min(width - 1, x + dx)), y) + 3] < 64,
      );
      if (!nearEdge || (original[p] + original[p + 1] + original[p + 2]) / 3 > 115) continue;
      let found = -1;
      for (let dy = -10; dy <= 10 && found < 0; dy++)
        for (let dx = -10; dx <= 10; dx++) {
          const xx = x + dx,
            yy = y + dy;
          if (xx < 0 || xx >= width || yy < 0 || yy >= height) continue;
          const q = at(xx, yy);
          if (
            original[q + 3] > 230 &&
            (original[q] + original[q + 1] + original[q + 2]) / 3 > 135
          ) {
            found = q;
            break;
          }
        }
      if (found >= 0) {
        pixels[p] = original[found];
        pixels[p + 1] = original[found + 1];
        pixels[p + 2] = original[found + 2];
        changedPixels++;
      }
    }
  for (let y = first; y < last; y++) {
    const progress = end === "top" ? (y - first) / (last - first) : (last - y) / (last - first);
    const alpha = 0.45 + 0.55 * Math.max(0, Math.min(1, progress));
    for (let x = 0; x < width; x++) pixels[at(x, y) + 3] = Math.round(pixels[at(x, y) + 3] * alpha);
  }
  const clear = await sharp({ create: { width, height, channels: 4, background: "#000" } })
    .png()
    .toBuffer();
  layers.push({ input: clear, left, top, blend: "dest-out" });
  layers.push({
    input: await sharp(pixels, { raw: { width, height, channels: 4 } })
      .png()
      .toBuffer(),
    left,
    top,
  });
  art.seams[frame] = { end, band: [first, last], changedPixels };
}
const [hx, hy, hw, hh] = bounds[0];
const head = await sharp(faceSource).trim({ threshold: 20 }).resize(hw, hh).png().toBuffer();
const headPixels = await sharp(head).ensureAlpha().raw().toBuffer();
// Lowest painted skin band of the chin; exclude hair/outline by colour and ROI.
const chin = [];
for (let y = 260; y < hh; y++)
  for (let x = 180; x < 280; x++) {
    const p = (y * hw + x) * 4;
    if (
      headPixels[p + 3] > 220 &&
      headPixels[p] > 235 &&
      headPixels[p + 1] > 175 &&
      headPixels[p + 1] < 225 &&
      headPixels[p + 2] > 150 &&
      headPixels[p + 2] < 210
    )
      chin.push([x, y]);
  }
const chinY = Math.max(...chin.map((p) => p[1]));
const chinBand = chin.filter((p) => p[1] >= chinY - 2);
if (chinBand.length < 3) throw Error("Missing measured Aria chin skin band");
art.head.neck.chinUnder = [chinBand.reduce((sum, p) => sum + p[0], 0) / chinBand.length, chinY];
art.head.neck.chinPixels = chinBand.length;
layers.push({
  input: await sharp({ create: { width: hw, height: hh, channels: 4, background: "#000" } })
    .png()
    .toBuffer(),
  left: hx,
  top: hy,
  blend: "dest-out",
});
layers.push({ input: head, left: hx, top: hy });
// Reuse the same tea cup drawing so the shared rim/grip calculation stays honest.
const [cx, cy, cw, ch] = guildLabArt.frames[12];
const cup = await sharp(`public${guildLabArt.asset}`)
  .extract({ left: cx, top: cy, width: cw, height: ch })
  .png()
  .toBuffer();
art.frames.push([1110, 1180, cw, ch]);
layers.push({ input: cup, left: 1110, top: 1180 });

const eyeRoi = [120, 132, 195, 108];
const mouthRoi = [194, 232, 102, 66];
const expressionImage = await sharp(expressionsSource).metadata();
const panelWidth = expressionImage.width / 4;
for (const [index, key] of ["smile", "surprised", "tired", "yawn"].entries()) {
  const panel = await sharp(expressionsSource)
    .extract({
      left: Math.round(panelWidth * index),
      top: 0,
      width: Math.round(panelWidth),
      height: expressionImage.height,
    })
    .png()
    .toBuffer();
  const aligned = await sharp(panel)
    .trim({ threshold: 20 })
    .resize(hw, hh)
    .ensureAlpha()
    .raw()
    .toBuffer();
  const patches = [];
  for (const [region, rect, y] of [
    ["eyes", eyeRoi, 1190],
    ["mouth", mouthRoi, 1350],
  ]) {
    const [x, ry, width, height] = rect;
    let changedPixels = 0;
    for (let py = ry; py < ry + height; py++)
      for (let px = x; px < x + width; px++) {
        const p = (py * hw + px) * 4;
        if (Math.max(...[0, 1, 2, 3].map((c) => Math.abs(headPixels[p + c] - aligned[p + c]))) > 24)
          changedPixels++;
      }
    if (changedPixels < 50) throw Error(`Missing Aria ${key} ${region} difference`);
    const pixels = await sharp(aligned, { raw: { width: hw, height: hh, channels: 4 } })
      .extract({ left: x, top: ry, width, height })
      .raw()
      .toBuffer();
    for (let py = 0; py < height; py++)
      for (let px = 0; px < width; px++) {
        const edge = Math.min(px, py, width - 1 - px, height - 1 - py);
        pixels[(py * width + px) * 4 + 3] *= Math.min(1, edge / 6);
      }
    const frame = art.frames.length;
    const left = 20 + index * 260;
    layers.push({
      input: await sharp(pixels, { raw: { width, height, channels: 4 } })
        .png()
        .toBuffer(),
      left,
      top: y,
    });
    art.frames.push([left, y, width, height]);
    patches.push({ frame, rect, roi: rect, region, changedPixels });
  }
  art.head.expressions[key] = { patches, closedEyes: key === "smile" };
}
art.head.blink = {
  frame: art.head.expressions.smile.patches[0].frame,
  rect: eyeRoi,
  roi: eyeRoi,
  changedPixels: art.head.expressions.smile.patches[0].changedPixels,
};
art.head.expressions.neutral = { patches: [], closedEyes: false };
// Separate hair and skirt remain in source positions; their frame IDs follow
// the expression patches, while the rig only cares about the indexed values.
art.extras.backHair = art.frames.length;
art.frames.push(bounds[12]);
art.extras.skirt = art.frames.length;
art.frames.push(bounds[13]);
const base = await sharp(source)
  .extend({ bottom: art.height - 1181, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
await sharp(base).composite(layers).webp({ lossless: true }).toFile(output);
writeFileSync(
  config.art,
  await format(
    "// Generated: node scripts/build-guild-lab-aria.mjs\nexport const guildLabAriaArt = " +
      JSON.stringify(art) +
      " as const;\n",
    { parser: "typescript", printWidth: 100 },
  ),
);
console.log(`Built ${output}: ${art.frames.length} parts and patches`);
