import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const [id, standing] of [
  ["aria", 134],
  ["leon", 144],
  ["mira", 132],
  ["finn", 148],
  ["lico", 128],
]) {
  const name = `${id}-earthwork-v1`;
  const source = `assets/source/storybook/${id}-earthwork-v${["mira", "lico"].includes(id) ? 2 : 1}.png`;
  const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
    count: 4,
    columns: 4,
    rows: 1,
  });
  const scale = standing / parts[0].height;
  const layers = [],
    metrics = [];
  for (const [frame, p] of parts.entries()) {
    // The tool lies to the right. Register to the supporting knee/boot, not
    // the combined silhouette's centre or the trowel's changing reach.
    const foot = p.left + p.width * (frame ? 0.4 : 0.5);
    const width = Math.round(p.width * scale),
      height = Math.round(p.height * scale);
    const left = Math.round(96 - (foot - p.left) * scale),
      top = 176 - height;
    if (left < 3 || left + width > 189 || top < 4) throw Error(`Clipped ${name}/${frame}`);
    if (frame && height >= standing * 0.89)
      throw Error(`Kneeling figure too tall: ${name}/${frame}`);
    layers.push({
      input: await sharp(source).extract(p).resize(width, height).png().toBuffer(),
      left: frame * 192 + left,
      top,
    });
    metrics.push({ frame, scale, width, height, left, top, baseline: 176 });
  }
  await sharp({ create: { width: 768, height: 192, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  await writeFile(`public/storybook-study/${name}-metrics.json`, JSON.stringify(metrics, null, 2));
  console.log(
    name,
    metrics.map((m) => m.height),
  );
}
await sharp("assets/source/storybook/earthwork-patch-v1.png")
  .trim({ threshold: 1 })
  .resize({ width: 768 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/earthwork-patch-v1.webp");
