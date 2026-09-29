import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";
import { format } from "prettier";
mkdirSync("work", { recursive: true });
const source = "assets/source/guild/leon-parts-v2.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const w = info.width,
  h = info.height,
  seen = new Uint8Array(w * h),
  cells = Array.from({ length: 16 }, () => [w, h, 0, 0]);
for (let i = 0; i < w * h; i++) {
  if (seen[i] || data[i * 4 + 3] < 100) continue;
  const q = [i];
  let x0 = w,
    y0 = h,
    x1 = 0,
    y1 = 0;
  seen[i] = 1;
  for (let k = 0; k < q.length; k++) {
    const p = q[k],
      x = p % w,
      y = Math.floor(p / w);
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
    for (const v of [
      x > 0 ? p - 1 : -1,
      x < w - 1 ? p + 1 : -1,
      y > 0 ? p - w : -1,
      y < h - 1 ? p + w : -1,
    ])
      if (v >= 0 && !seen[v] && data[v * 4 + 3] >= 100) {
        seen[v] = 1;
        q.push(v);
      }
  }
  if (q.length < 30) continue;
  const c =
    cells[
      Math.min(3, Math.floor(((y0 + y1) / 2 / h) * 4)) * 4 +
        Math.min(3, Math.floor(((x0 + x1) / 2 / w) * 4))
    ];
  c[0] = Math.min(c[0], x0);
  c[1] = Math.min(c[1], y0);
  c[2] = Math.max(c[2], x1);
  c[3] = Math.max(c[3], y1);
}
const rects = cells.map(([x, y, r, b]) => [x, y, r - x + 1, b - y + 1]);
const [hx, hy, hw, hh] = rects[0];
// Alpha-bounds registration removes the generator's change of canvas size.
const closed = await sharp("assets/source/guild/leon-head-blink-v2.png")
  .trim({ threshold: 20 })
  .resize(hw, hh)
  .ensureAlpha()
  .raw()
  .toBuffer();
const opened = await sharp(source)
  .extract({ left: hx, top: hy, width: hw, height: hh })
  .ensureAlpha()
  .raw()
  .toBuffer();
// Reviewed eye-only region, in source-atlas pixels. Exclude hair, brows and mouth.
const roi = { x: 153 - hx, y: 218 - hy, width: 107, height: 45 };
let left = hw,
  top = hh,
  right = 0,
  bottom = 0,
  changed = 0;
for (let y = roi.y; y < roi.y + roi.height; y++)
  for (let x = roi.x; x < roi.x + roi.width; x++) {
    const i = (y * hw + x) * 4;
    if (Math.max(...[0, 1, 2].map((c) => Math.abs(opened[i + c] - closed[i + c]))) < 24) continue;
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
    changed++;
  }
if (!changed) throw Error("Missing eyelid difference");
const patchRect = [left, top, right - left + 1, bottom - top + 1];
const patchPixels = await sharp(closed, { raw: { width: hw, height: hh, channels: 4 } })
  .extract({ left, top, width: patchRect[2], height: patchRect[3] })
  .raw()
  .toBuffer();
// A three-pixel feather hides small skin-color differences from the image edit.
for (let y = 0; y < patchRect[3]; y++)
  for (let x = 0; x < patchRect[2]; x++) {
    const edge = Math.min(x, y, patchRect[2] - 1 - x, patchRect[3] - 1 - y);
    patchPixels[(y * patchRect[2] + x) * 4 + 3] *= Math.min(1, edge / 3);
  }
const patch = await sharp(patchPixels, {
  raw: { width: patchRect[2], height: patchRect[3], channels: 4 },
})
  .png()
  .toBuffer();
// Measure the dark painted mouth line within the annotated mouth region.
let mx0 = hw,
  my0 = hh,
  mx1 = 0,
  my1 = 0,
  count = 0,
  sx = 0,
  sy = 0;
for (let y = 271 - hy; y < 285 - hy; y++)
  for (let x = 195 - hx; x < 222 - hx; x++) {
    const i = (y * hw + x) * 4;
    if (opened[i] < 180 && opened[i + 1] < 120 && opened[i + 2] < 105 && opened[i + 3] > 240) {
      mx0 = Math.min(mx0, x);
      my0 = Math.min(my0, y);
      mx1 = Math.max(mx1, x);
      my1 = Math.max(my1, y);
      sx += x;
      sy += y;
      count++;
    }
  }
if (!count) throw Error("Missing painted mouth");
const mouth = {
  x: sx / count,
  y: sy / count,
  bounds: [mx0, my0, mx1 - mx0 + 1, my1 - my0 + 1],
  pixels: count,
};
const clear = await sharp({
  create: { width: 1000, height: h - 950, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
})
  .png()
  .toBuffer();
const clean = await sharp(source)
  .composite([{ input: clear, left: 0, top: 950, blend: "dest-out" }])
  .png()
  .toBuffer();
await sharp(clean)
  .composite([{ input: patch, left: 40, top: 1000 }])
  .webp({ lossless: true })
  .toFile("public/guild/leon-parts-v2.webp");
const frames = [...rects.slice(0, 12), rects[15], [40, 1000, patchRect[2], patchRect[3]]];
const art = {
  width: w,
  height: h,
  frames,
  head: {
    displayHeight: 90,
    mouth,
    blink: { frame: 13, rect: patchRect, roi, changedPixels: changed },
  },
};
writeFileSync(
  "lib/guild-lab-art.ts",
  await format(
    "// Generated measurements: node scripts/build-guild-lab-rig.mjs\nexport const guildLabArt = " +
      JSON.stringify(art) +
      " as const;\n",
    { parser: "typescript", printWidth: 100 },
  ),
);
await sharp(opened, { raw: { width: hw, height: hh, channels: 4 } })
  .png()
  .toFile("work/lab-head-open.png");
await sharp(opened, { raw: { width: hw, height: hh, channels: 4 } })
  .composite([{ input: patch, left, top }])
  .png()
  .toFile("work/lab-head-blink.png");
console.log(art);
