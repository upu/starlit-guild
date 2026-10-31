import sharp from "sharp";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";
import { mkdir, writeFile } from "node:fs/promises";

// Use one scale per character, including the seated and crouched poses.
await mkdir("public/storybook-study", { recursive: true });
const report = {};
for (const [id, height] of [
  ["aria", 134],
  ["leon", 144],
]) {
  const source = `assets/source/storybook/${id}-poses-v1.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const cells = spriteBounds(data, info.width, info.height).map((part) => ({
    bounds: { left: part.left, top: part.top, width: part.width, height: part.height },
  }));
  if (cells.length !== 8) throw Error(`Expected eight poses for ${id}`);
  const scale = height / cells[0].bounds.height;
  const layers = [];
  report[id] = { scale, frames: [] };
  for (const [i, { bounds }] of cells.entries()) {
    const w = Math.round(bounds.width * scale),
      h = Math.round(bounds.height * scale);
    const input = await sharp(source).extract(bounds).resize(w, h).png().toBuffer();
    layers.push({
      input,
      left: (i % 4) * 192 + Math.round((192 - w) / 2),
      top: Math.floor(i / 4) * 192 + 176 - h,
    });
    report[id].frames.push({ bounds, width: w, height: h });
  }
  await sharp({ create: { width: 768, height: 384, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${id}-poses-v1.webp`);
}
await writeFile("public/storybook-study/pose-metrics.json", JSON.stringify(report, null, 2));
