import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const [id, height, walkHeight] of [
  ["leon", 144, 138],
  ["mira", 126, 125],
]) {
  const layers = [],
    metrics = [];
  for (const walking of [false, true]) {
    const source = `assets/source/storybook/${id}-handheld${walking ? "-walk" : ""}-v1.png`;
    const { data, info } = await sharp(source)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const parts = spriteBounds(data, info.width, info.height, {
      count: walking ? 4 : 8,
      columns: 4,
      rows: walking ? 1 : 2,
    });
    const indices = walking ? [0, 1, 2, 3] : [0, 5, 6, 7];
    const scale = walking
      ? walkHeight / (parts.reduce((sum, p) => sum + p.height, 0) / 4)
      : height / parts[0].height;
    for (const [out, index] of indices.entries()) {
      const p = parts[index],
        frame = walking ? out + 4 : out;
      let foot = 0,
        count = 0;
      for (let y = p.top + Math.floor(p.height * 0.92); y < p.top + p.height; y++)
        for (let x = p.left; x < p.left + p.width; x++)
          if (data[(y * info.width + x) * 4 + 3] > 128) {
            foot += x;
            count++;
          }
      const w = Math.round(p.width * scale),
        h = Math.round(p.height * scale),
        left = Math.round(96 - (foot / count - p.left) * scale),
        top = 176 - h;
      if (left < 3 || left + w > 189 || top < 3) throw Error(`Clipped ${id}/${frame}`);
      layers.push({
        input: await sharp(source).extract(p).resize(w, h).png().toBuffer(),
        left: (frame % 4) * 192 + left,
        top: Math.floor(frame / 4) * 192 + top,
      });
      metrics.push({ frame, source, index, scale, left, top, width: w, height: h, baseline: 176 });
    }
  }
  await sharp({ create: { width: 768, height: 384, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${id}-handheld-v1.webp`);
  await writeFile(
    `public/storybook-study/${id}-handheld-v1-metrics.json`,
    JSON.stringify(metrics, null, 2) + "\n",
  );
}
const source = "assets/source/storybook/workshop-landmark-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const [p] = spriteBounds(data, info.width, info.height, { count: 1, columns: 1, rows: 1 });
await sharp(source)
  .extract(p)
  .resize({ width: 512 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/workshop-landmark-v1.webp");
