import "./build-guild-lab-rig.mjs";
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { format } from "prettier";

const art = JSON.parse(readFileSync("work/lab-base-art.json", "utf8"));
const source = "assets/source/guild/leon-costume-v4.png";
const meta = await sharp(source).metadata();
const layers = [];
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
layers.push({
  input: await sharp("assets/source/guild/leon-far-palm-v4.png")
    .trim({ threshold: 20 })
    .resize({ width: fw, height: fh, fit: "fill" })
    .png()
    .toBuffer(),
  left: fx,
  top: fy,
});
art.armJoints[5] = { proximal: [52, 27], distal: [74, 166], wrist: [65, 121] };
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
layers.push({
  input: await sharp("public/guild/leon-parts-v2.webp")
    .extract({ left: gx, top: gy, width: gw, height: gh })
    .flop()
    .png()
    .toBuffer(),
  left: gx,
  top: gy,
});
for (const key of ["proximal", "distal", "wrist"])
  art.armJoints[7][key][0] = gw - 1 - art.armJoints[7][key][0];
for (const [frame, start, end] of [
  [2, 0, 0.375],
  [1, 0.375, 0.7],
  [3, 0.7, 1],
]) {
  const height = art.frames[frame][3];
  const left = Math.round(meta.width * start),
    right = Math.round(meta.width * end);
  const region = await sharp(source)
    .extract({ left, top: 0, width: right - left, height: meta.height })
    .png()
    .toBuffer();
  const input = await sharp(region).trim({ threshold: 20 }).resize({ height }).png().toBuffer();
  const size = await sharp(input).metadata();
  const x = [0, 360, 730, 1030][frame],
    y = 110;
  art.frames[frame] = [x, y, size.width, height];
  layers.push({ input, left: x, top: y });
}
const clear = await sharp({ create: { width: 982, height: 350, channels: 4, background: "#000" } })
  .png()
  .toBuffer();
const base = await sharp("public/guild/leon-parts-v2.webp")
  .composite([{ input: clear, left: 350, top: 0, blend: "dest-out" }])
  .png()
  .toBuffer();
const [hx, hy, hw, hh] = art.frames[0];
const opened = await sharp("assets/source/guild/leon-parts-v2.png")
  .extract({ left: hx, top: hy, width: hw, height: hh })
  .ensureAlpha()
  .raw()
  .toBuffer();
const expressions = {};
// Reviewed face regions exclude the silhouette, hair and ear. Alpha-bounds
// registration matches the generated heads to the unchanged original head.
const regions = { eyes: [120, 159, 122, 77], mouth: [161, 233, 42, 28] };
for (const [index, key] of ["neutral", "smile", "surprised", "tired", "yawn"].entries()) {
  const name = key === "neutral" ? "normal" : key;
  const aligned = await sharp(`assets/source/guild/leon-head-${name}-v3.png`)
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
art.height = 1340;
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
  .toFile("public/guild/leon-parts-v3.webp");
writeFileSync(
  "lib/guild-lab-art.ts",
  await format(
    "// Generated: node scripts/build-guild-lab-affection.mjs\nexport const guildLabArt = " +
      JSON.stringify(art) +
      " as const;\n",
    { parser: "typescript", printWidth: 100 },
  ),
);
console.log("Built costume and measured expression patches", Object.keys(expressions));
