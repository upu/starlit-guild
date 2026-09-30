import "./build-guild-lab-rig.mjs";
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { format } from "prettier";
import { guildLabSourceConfig } from "./guild-lab-source-config.mjs";
const config = guildLabSourceConfig.leon;

const art = JSON.parse(readFileSync("work/lab-base-art.json", "utf8"));
const source = config.costume;
const meta = await sharp(source).metadata();
const layers = [];
// A foreground cutout must not carry a black contour along the cap that sits
// on top of the upper sleeve. Repaint only dark perimeter pixels in the
// measured elbow-side band using nearby opaque ivory sleeve pixels. Fade the
// cap into the upper sleeve; leave the glove and all pixels below the band intact.
async function softenElbowCap(input, width, height, proximal) {
  const pixels = await sharp(input).ensureAlpha().raw().toBuffer();
  const original = Buffer.from(pixels);
  const edgeRadius = 5;
  const maxY = proximal[1] + 15;
  const fadeStartY = Math.max(0, proximal[1] - 18);
  let changedPixels = 0;
  const at = (x, y) => (y * width + x) * 4;
  for (let y = 0; y <= maxY; y++)
    for (let x = 0; x < width; x++) {
      const p = at(x, y);
      if (original[p + 3] <= 8) continue;
      if ((original[p] + original[p + 1] + original[p + 2]) / 3 >= 175) continue;
      let perimeter = false;
      for (let dy = -edgeRadius; dy <= edgeRadius && !perimeter; dy++)
        for (let dx = -edgeRadius; dx <= edgeRadius; dx++) {
          const nx = x + dx,
            ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height || original[at(nx, ny) + 3] < 64) {
            perimeter = true;
            break;
          }
        }
      if (!perimeter) continue;
      let nearest = -1,
        distance = Infinity;
      for (let dy = -15; dy <= 15; dy++)
        for (let dx = -15; dx <= 15; dx++) {
          const nx = x + dx,
            ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const q = at(nx, ny);
          if (
            original[q + 3] < 235 ||
            original[q] < 190 ||
            original[q + 1] < 175 ||
            original[q + 2] < 145
          )
            continue;
          const d = dx * dx + dy * dy;
          if (d < distance) {
            nearest = q;
            distance = d;
          }
        }
      if (nearest < 0) continue;
      pixels[p] = original[nearest];
      pixels[p + 1] = original[nearest + 1];
      pixels[p + 2] = original[nearest + 2];
      changedPixels++;
    }
  for (let y = 0; y <= maxY; y++) {
    const progress = Math.max(0, Math.min(1, (y - fadeStartY) / (maxY - fadeStartY)));
    const opacity = progress * progress * (3 - 2 * progress);
    for (let x = 0; x < width; x++) {
      const p = at(x, y);
      pixels[p + 3] = Math.round(original[p + 3] * opacity);
    }
  }
  if (changedPixels < 50) throw Error("Elbow outline was not found");
  return {
    input: await sharp(pixels, { raw: { width, height, channels: 4 } })
      .png()
      .toBuffer(),
    measurement: { proximal, maxY, fadeStartY, edgeRadius, changedPixels },
  };
}
art.armSeams = {};
// The far hand's palm faces the body; keep the same atlas cell and measured
// joint anchors while replacing the back-of-hand drawing.
const [fx, fy, fw, fh] = art.frames[5];
layers.push({
  input: await sharp({ create: { width: fw, height: fh, channels: 4, background: "#000" } })
    .png()
    .toBuffer(),
  left: fx,
  top: fy,
  blend: "dest-out",
});
art.armJoints[5] = structuredClone(config.affection.farForearmJoints);
const farForearm = await softenElbowCap(
  await sharp(config.farPalm)
    .trim({ threshold: 20 })
    .resize({ width: fw, height: fh, fit: "fill" })
    .png()
    .toBuffer(),
  fw,
  fh,
  art.armJoints[5].proximal,
);
layers.push({
  input: farForearm.input,
  left: fx,
  top: fy,
});
art.armSeams[5] = farForearm.measurement;
// Reflect the near glove in the atlas, then reflect its measured landmarks.
// Runtime joint origins must follow the artwork instead of flipping around 0.5.
const [gx, gy, gw, gh] = art.frames[7];
layers.push({
  input: await sharp({ create: { width: gw, height: gh, channels: 4, background: "#000" } })
    .png()
    .toBuffer(),
  left: gx,
  top: gy,
  blend: "dest-out",
});
for (const key of ["proximal", "distal", "wrist"])
  art.armJoints[7][key][0] = gw - 1 - art.armJoints[7][key][0];
const nearForearm = await softenElbowCap(
  await sharp(config.baseAtlas)
    .extract({ left: gx, top: gy, width: gw, height: gh })
    .flop()
    .png()
    .toBuffer(),
  gw,
  gh,
  art.armJoints[7].proximal,
);
layers.push({ input: nearForearm.input, left: gx, top: gy });
art.armSeams[7] = nearForearm.measurement;
for (const [frame, start, end] of config.affection.costumeFrames) {
  const height = art.frames[frame][3];
  const left = Math.round(meta.width * start),
    right = Math.round(meta.width * end);
  const region = await sharp(source)
    .extract({ left, top: 0, width: right - left, height: meta.height })
    .png()
    .toBuffer();
  const input = await sharp(region).trim({ threshold: 20 }).resize({ height }).png().toBuffer();
  const size = await sharp(input).metadata();
  if (frame === 2) {
    // The pale stand collar identifies the neck opening on the final sideways
    // torso, after its crop and resize. Use its horizontal bounds, not a hand-
    // adjusted character offset.
    const pixels = await sharp(input).ensureAlpha().raw().toBuffer();
    let leftmost = size.width,
      rightmost = -1,
      count = 0;
    for (let y = 0; y < 30; y++)
      for (let x = 0; x < size.width; x++) {
        const p = (y * size.width + x) * 4;
        const [r, g, b, alpha] = pixels.subarray(p, p + 4);
        if (alpha <= 220 || r <= 180 || g <= 160 || b <= 125 || r <= g || g <= b) continue;
        leftmost = Math.min(leftmost, x);
        rightmost = Math.max(rightmost, x);
        count++;
      }
    if (count < 100) throw Error("Missing painted torso collar");
    art.torso = {
      neck: {
        collarBounds: [leftmost, rightmost],
        center: [(leftmost + rightmost) / 2, 15],
        scanRows: [0, 30],
        pixels: count,
      },
    };
  }
  const x = config.affection.frameX[frame],
    y = 110;
  art.frames[frame] = [x, y, size.width, height];
  layers.push({ input, left: x, top: y });
}
const clear = await sharp({ create: { width: 982, height: 350, channels: 4, background: "#000" } })
  .png()
  .toBuffer();
const base = await sharp(config.baseAtlas)
  .composite([{ input: clear, left: 350, top: 0, blend: "dest-out" }])
  .png()
  .toBuffer();
const [hx, hy, hw, hh] = art.frames[0];
const opened = await sharp(config.parts)
  .extract({ left: hx, top: hy, width: hw, height: hh })
  .ensureAlpha()
  .raw()
  .toBuffer();
const expressions = {};
// Reviewed face regions exclude the silhouette, hair and ear. Alpha-bounds
// registration matches the generated heads to the unchanged original head.
const regions = config.affection.faceRegions;
for (const [index, key] of ["neutral", "smile", "surprised", "tired", "yawn"].entries()) {
  const name = key === "neutral" ? "normal" : key;
  const aligned = await sharp(config.headExpression(name))
    .trim({ threshold: 20 })
    .resize(hw, hh)
    .ensureAlpha()
    .raw()
    .toBuffer();
  const patches = [];
  for (const [region, roi] of Object.entries(regions)) {
    if (key === "neutral" && region === "mouth") continue;
    const [rx, ry, rw, rh] = roi;
    let x0 = hw,
      y0 = hh,
      x1 = 0,
      y1 = 0,
      changed = 0;
    for (let y = ry; y < ry + rh; y++)
      for (let x = rx; x < rx + rw; x++) {
        const i = (y * hw + x) * 4;
        if (Math.max(...[0, 1, 2].map((c) => Math.abs(opened[i + c] - aligned[i + c]))) < 24)
          continue;
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
        changed++;
      }
    if (!changed) throw Error(`Missing ${key} ${region} difference`);
    const rect = [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
    const pixels = await sharp(aligned, { raw: { width: hw, height: hh, channels: 4 } })
      .extract({ left: x0, top: y0, width: rect[2], height: rect[3] })
      .raw()
      .toBuffer();
    for (let y = 0; y < rect[3]; y++)
      for (let x = 0; x < rect[2]; x++) {
        const edge = Math.min(x, y, rect[2] - 1 - x, rect[3] - 1 - y);
        pixels[(y * rect[2] + x) * 4 + 3] *= Math.min(1, edge / 3);
      }
    const input = await sharp(pixels, { raw: { width: rect[2], height: rect[3], channels: 4 } })
      .png()
      .toBuffer();
    const left = 20 + index * 250,
      top = 1200 + (region === "mouth" ? 95 : 0),
      frame = art.frames.length;
    layers.push({ input, left, top });
    art.frames.push([left, top, rect[2], rect[3]]);
    patches.push({ frame, rect, roi, region, changedPixels: changed });
  }
  expressions[key] = { patches, closedEyes: key === "smile" };
  const overlays = patches.map((p) => ({
    input: layers.find((l) => l.left === art.frames[p.frame][0] && l.top === art.frames[p.frame][1])
      .input,
    left: p.rect[0],
    top: p.rect[1],
  }));
  await sharp(opened, { raw: { width: hw, height: hh, channels: 4 } })
    .composite(overlays)
    .png()
    .toFile(`work/lab-face-${key}.png`);
}
art.height = config.affection.atlasHeight;
art.asset = "/guild/leon-parts-v3.webp";
art.head.expressions = expressions;
const rendered = await sharp(base)
  .extend({ bottom: art.height - 1181, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .composite(layers)
  .ensureAlpha()
  .raw()
  .toBuffer();
// Keep every original head pixel, including RGB below antialiased alpha edges.
for (let row = 0; row < hh; row++)
  opened.copy(rendered, ((hy + row) * art.width + hx) * 4, row * hw * 4, (row + 1) * hw * 4);
await sharp(rendered, { raw: { width: art.width, height: art.height, channels: 4 } })
  .webp({ lossless: true })
  .toFile(config.atlas);
writeFileSync(
  config.art,
  await format(
    "// Generated: node scripts/build-guild-lab-affection.mjs\nexport const guildLabArt = " +
      JSON.stringify(art) +
      " as const;\n",
    { parser: "typescript", printWidth: 100 },
  ),
);
console.log("Built costume and measured expression patches", Object.keys(expressions));
