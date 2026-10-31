import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const spec of [
  { name: "porter-service-v1", count: 12, columns: 4, rows: 3, cell: 128, sole: 120, height: 94 },
  { name: "porter-pickup-v1", count: 4, columns: 4, rows: 1, cell: 128, sole: 120, height: 94 },
  { name: "lantern-heroes-v1", count: 8, columns: 4, rows: 2, cell: 192, sole: 176, height: 134 },
  { name: "aria-weed-v1", count: 3, columns: 3, rows: 1, cell: 192, sole: 176, height: 134 },
]) {
  const source = `assets/source/storybook/${spec.name}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height, spec);
  const layers = [],
    metrics = [];
  for (const [i, p] of parts.entries()) {
    const height = spec.name === "lantern-heroes-v1" && i >= 4 ? 144 : spec.height;
    const reference = spec.name === "lantern-heroes-v1" && i >= 4 ? parts[4] : parts[0];
    const scale = height / reference.height;
    const w = Math.round(p.width * scale),
      h = Math.round(p.height * scale);
    let sum = 0,
      count = 0;
    for (let y = p.top + Math.floor(p.height * 0.83); y < p.top + p.height; y++)
      for (let x = p.left; x < p.left + p.width; x++)
        if (data[(y * info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    const left = Math.round(spec.cell / 2 - (sum / count - p.left) * scale);
    if (left < 0 || left + w >= spec.cell || h > spec.sole)
      throw Error(`Clipped ${spec.name}/${i}`);
    const input = await sharp(source).extract(p).resize(w, h).png().toBuffer();
    layers.push({
      input,
      left: (i % 4) * spec.cell + left,
      top: Math.floor(i / 4) * spec.cell + spec.sole - h,
    });
    metrics.push({ width: w, height: h, left, top: spec.sole - h, scale });
  }
  await sharp({
    create: {
      width: spec.cell * 4,
      height: spec.cell * spec.rows,
      channels: 4,
      background: "#00000000",
    },
  })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${spec.name}.webp`);
  await writeFile(
    `public/storybook-study/${spec.name}-metrics.json`,
    JSON.stringify(metrics, null, 2),
  );
}

for (const spec of [
  {
    name: "roadside-lantern-v1",
    names: ["closed-sooty", "sooty", "empty", "unlit", "closed-lit"],
    cellW: 256,
    cellH: 384,
    base: 376,
    columns: 5,
  },
  {
    name: "lantern-service-props-v1",
    names: ["oil-pan", "oil-bottle", "work-rucksack", "travel-map"],
    cellW: 256,
    cellH: 256,
    base: 248,
    columns: 4,
  },
  {
    name: "roadside-grass-v1",
    names: ["roadside-grass", "roadside-stubble"],
    cellW: 256,
    cellH: 256,
    base: 248,
    columns: 2,
  },
]) {
  const source = `assets/source/storybook/${spec.name}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height, {
    count: spec.names.length,
    columns: spec.columns,
    rows: 1,
  });
  const metrics = [];
  for (const [i, p] of parts.entries()) {
    const scale =
      spec.name === "roadside-lantern-v1"
        ? 360 / parts[0].height
        : Math.min(240 / p.width, 232 / p.height);
    const width = Math.round(p.width * scale),
      height = Math.round(p.height * scale);
    const left = Math.round((spec.cellW - width) / 2),
      top = spec.base - height;
    if (left < 0 || top < 0) throw Error(`Clipped ${spec.name}/${i}`);
    const input = await sharp(source).extract(p).resize(width, height).png().toBuffer();
    await sharp({
      create: { width: spec.cellW, height: spec.cellH, channels: 4, background: "#00000000" },
    })
      .composite([{ input, left, top }])
      .webp({ lossless: true })
      .toFile(
        `public/storybook-study/${spec.name === "roadside-lantern-v1" ? "stone-lantern-" : ""}${spec.names[i]}-v1.webp`,
      );
    metrics.push({ name: spec.names[i], width, height, left, top, scale });
  }
  await writeFile(
    `public/storybook-study/${spec.name}-metrics.json`,
    JSON.stringify(metrics, null, 2),
  );
}
