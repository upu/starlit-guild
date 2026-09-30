import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { format } from "prettier";
import { guildLabArt } from "../lib/guild-lab-art.ts";
import { guildLabSourceConfig } from "./guild-lab-source-config.mjs";
import { isolatedParts, fitPadded } from "./guild-lab-image-tools.mjs";
import { registerHead, faceMask, ariaFaceRegions } from "./guild-lab-face-masks.mjs";
import { addFramePadding } from "./guild-lab-frame-padding.mjs";

const config = guildLabSourceConfig.aria;
const source = config.parts;
const faceSource = config.head;
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
const costumeParts = await isolatedParts(config.costumeHair);
if (costumeParts.length !== 5) throw Error("Expected a torso/cape pair and three isolated locks");
function fittedLandmark(part, point, width, height) {
  const scale = Math.min((width - 12) / part.width, (height - 12) / part.height);
  const w = Math.round(part.width * scale),
    h = Math.round(part.height * scale);
  return [
    ((point[0] - part.rect[0]) * w) / part.width + (width - w) / 2,
    ((point[1] - part.rect[1]) * h) / part.height + (height - h) / 2,
  ];
}
for (const [frame, index] of [
  [2, 0],
  [1, 1],
  [12, 3],
]) {
  const [, , w, h] = bounds[frame];
  const part = costumeParts[index];
  const input = await sharp(part.pixels, {
    raw: { width: part.width, height: part.height, channels: 4 },
  })
    .png()
    .toBuffer();
  replacements.set(
    frame,
    await sharp(await fitPadded(input, w, h))
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
    await sharp(await fitPadded(file, w, h))
      .ensureAlpha()
      .raw()
      .toBuffer(),
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
function bandCenter(pixels, width, height, from, to, minimum = 100) {
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
  if (count < minimum) throw Error(`Missing painted joint band ${width}x${height}: ${count}`);
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
function hairRoot(pixels, width, height) {
  let top = height;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (pixels[(y * width + x) * 4 + 3] > 180) top = Math.min(top, y);
  return bandCenter(pixels, width, height, (top + 2) / height, (top + 14) / height, 20);
}
const art = {
  width: 1332,
  height: 1900,
  frames: bounds.slice(0, 12),
  sourceCells: bounds.slice(0, 12),
  armJoints: Object.fromEntries(
    await Promise.all([4, 5, 6, 7].map(async (i) => [i, await joints(i)])),
  ),
  legJoints: Object.fromEntries(
    await Promise.all([8, 9, 10, 11].map(async (i) => [i, await joints(i)])),
  ),
  head: {
    displayHeight: 85.5,
    neck: { center: [183, 280] },
    mouth: { x: 253, y: 268, bounds: [244, 260, 24, 16] },
    blink: null,
    expressions: {},
  },
  torso: {
    neck: {
      center: fittedLandmark(costumeParts[0], config.costumeNeck, bounds[2][2], bounds[2][3]),
      source: config.costumeNeck,
    },
  },
  hairLock: {
    root: hairRoot(await cell(bounds[12]), bounds[12][2], bounds[12][3]),
    reviewed: { ears: 0, flowers: 0, skull: false, view: "right" },
  },
  backCape: { reviewed: { flowers: 0, knots: 0, frontClasp: false } },
  nearGlove: {
    mirrored: config.nearGlove.flip,
    thumb: [nearW - 1 - config.nearGlove.thumb[0], config.nearGlove.thumb[1]],
    outerEdge: [nearW - 1 - config.nearGlove.outerEdge[0], config.nearGlove.outerEdge[1]],
  },
  extras: { backHair: 23, skirt: 24 },
  costume: {
    parts: costumeParts.map((p) => ({ rect: p.rect, pixels: p.count })),
    matchedPair: true,
  },
  asset: "/guild/aria-parts-v1.webp",
};
const contents = new Map();
art.seams = {};
for (const [frame, end] of [
  [5, "top"],
  [7, "top"],
  [8, "bottom"],
  [10, "bottom"],
]) {
  const [, , width, height] = bounds[frame];
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
  art.seams[frame] = { end, band: [first, last], changedPixels };
  replacements.set(frame, pixels);
}
const [, , hw, hh] = bounds[0];
const head = await fitPadded(faceSource, hw, hh);
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
const ear = [];
for (let y = 200; y < 260; y++)
  for (let x = 70; x < 145; x++) {
    const p = (y * hw + x) * 4;
    if (
      headPixels[p + 3] > 220 &&
      headPixels[p] > 235 &&
      headPixels[p + 1] > 150 &&
      headPixels[p + 1] < 225 &&
      headPixels[p + 2] > 130 &&
      headPixels[p + 2] < 210
    )
      ear.push([x, y]);
  }
const earY = Math.max(...ear.map((p) => p[1]));
const earBand = ear.filter((p) => p[1] >= earY - 2);
if (earBand.length < 3) throw Error("Missing Aria ear attachment band");
art.head.neck.earUnder = [earBand.reduce((sum, p) => sum + p[0], 0) / earBand.length, earY];
art.head.neck.center = art.head.neck.chinUnder.map((v, i) => (v + art.head.neck.earUnder[i]) / 2);
art.head.neck.visibleNeck = false;
const lips = [];
for (let y = 256; y < 281; y++)
  for (let x = 230; x < 277; x++) {
    const p = (y * hw + x) * 4;
    if (
      headPixels[p + 3] > 220 &&
      headPixels[p] < 210 &&
      headPixels[p] - headPixels[p + 1] > 25 &&
      headPixels[p + 1] < 155
    )
      lips.push([x, y]);
  }
if (lips.length < 3) throw Error("Missing Aria mouth line");
art.head.mouth.x = lips.reduce((sum, p) => sum + p[0], 0) / lips.length;
art.head.mouth.y = lips.reduce((sum, p) => sum + p[1], 0) / lips.length;
art.head.mouth.pixels = lips.length;
contents.set(0, head);
// Reuse the same tea cup drawing so the shared rim/grip calculation stays honest.
const cp = guildLabArt.framePadding;
const cupFrame = guildLabArt.frames[12];
const [cx, cy, cw, ch] = [
  cupFrame[0] + cp,
  cupFrame[1] + cp,
  cupFrame[2] - 2 * cp,
  cupFrame[3] - 2 * cp,
];
const cup = await sharp(`public${guildLabArt.asset}`)
  .extract({ left: cx, top: cy, width: cw, height: ch })
  .png()
  .toBuffer();
art.frames.push([1110, 1180, cw, ch]);
contents.set(12, cup);

for (const [index, key] of ["smile", "surprised", "tired", "yawn"].entries()) {
  const aligned = await registerHead(config.headExpression(key), headPixels, hw, hh);
  const patches = [];
  for (const [region, y] of [
    ["eyes", 1190],
    ["mouth", 1350],
  ]) {
    const patch = faceMask(
      headPixels,
      aligned.pixels,
      hw,
      hh,
      region,
      key === "smile" || key === "yawn",
    );
    const { pixels, rect, ...measurement } = patch;
    const width = rect[2],
      height = rect[3];
    const frame = art.frames.length;
    const left = 20 + index * 260;
    contents.set(
      frame,
      await sharp(pixels, { raw: { width, height, channels: 4 } })
        .png()
        .toBuffer(),
    );
    art.frames.push([left, y, width, height]);
    patches.push({ frame, rect, roi: rect, region, ...measurement, alignment: aligned.alignment });
  }
  art.head.expressions[key] = { patches, closedEyes: key === "smile" || key === "yawn" };
  await sharp(head)
    .composite(
      patches.map((p) => ({
        input: contents.get(p.frame),
        left: p.rect[0],
        top: p.rect[1],
      })),
    )
    .png()
    .toFile(`work/aria-face-${key}.png`);
}
art.head.blink = {
  frame: art.head.expressions.smile.patches[0].frame,
  rect: art.head.expressions.smile.patches[0].rect,
  roi: art.head.expressions.smile.patches[0].rect,
  changedPixels: art.head.expressions.smile.patches[0].changedPixels,
};
art.head.expressions.neutral = { patches: [], closedEyes: false };
// Separate hair and skirt remain in source positions; their frame IDs follow
// the expression patches, while the rig only cares about the indexed values.
art.extras.backHair = art.frames.length;
art.frames.push(bounds[12]);
contents.set(
  art.extras.backHair,
  await sharp(await cell(bounds[12]), {
    raw: { width: bounds[12][2], height: bounds[12][3], channels: 4 },
  })
    .png()
    .toBuffer(),
);
art.extras.skirt = art.frames.length;
art.frames.push(bounds[13]);
contents.set(
  art.extras.skirt,
  await sharp(await originalCell(bounds[13]), {
    raw: { width: bounds[13][2], height: bounds[13][3], channels: 4 },
  })
    .png()
    .toBuffer(),
);
art.hairLocks = [];
for (const [name, index, left] of [
  ["far", 2, 20],
  ["front", 4, 300],
]) {
  const part = costumeParts[index],
    width = 154,
    height = 300;
  const input = await sharp(part.pixels, {
    raw: { width: part.width, height: part.height, channels: 4 },
  })
    .png()
    .toBuffer();
  const fitted = await fitPadded(input, width, height);
  const root = hairRoot(await sharp(fitted).ensureAlpha().raw().toBuffer(), width, height);
  const frame = art.frames.length;
  art.frames.push([left, 1570, width, height]);
  contents.set(frame, fitted);
  art.hairLocks.push({ name, frame, root, source: part.rect });
}
art.hairLocks.splice(1, 0, {
  name: "back",
  frame: art.extras.backHair,
  root: art.hairLock.root,
  source: costumeParts[3].rect,
});
art.head.faceRegions = ariaFaceRegions;
// Pack independently extracted cells; expanding the original sheet's head frame
// would otherwise include the next row's upper arm in its transparent gutter.
let x = 4,
  y = 4,
  rowHeight = 0;
const packed = [];
for (let frame = 0; frame < art.frames.length; frame++) {
  const [, , width, height] = art.frames[frame];
  if (x + width + 8 > art.width) {
    x = 4;
    y += rowHeight + 12;
    rowHeight = 0;
  }
  const input =
    contents.get(frame) ??
    (await sharp(await cell(bounds[frame]), { raw: { width, height, channels: 4 } })
      .png()
      .toBuffer());
  packed.push({ input, left: x + 4, top: y + 4 });
  art.frames[frame] = [x + 4, y + 4, width, height];
  x += width + 12;
  rowHeight = Math.max(rowHeight, height);
}
art.height = y + rowHeight + 12;
await sharp({
  create: {
    width: art.width,
    height: art.height,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(packed)
  .webp({ lossless: true })
  .toFile(output);
writeFileSync(
  config.art,
  await format(
    "// Generated: node scripts/build-guild-lab-aria.mjs\nexport const guildLabAriaArt = " +
      JSON.stringify(addFramePadding(art)) +
      " as const;\n",
    { parser: "typescript", printWidth: 100 },
  ),
);
console.log(`Built ${output}: ${art.frames.length} parts and patches`);
