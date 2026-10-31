import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const [sourceName, rows, groups, targetHeight] of [
  ["lico-seedling-defense-v2", 2, ["lico-seedling-paper-v1", "lico-seedling-shield-v1"], 128],
  ["aria-cover-ears-v1", 1, ["aria-cover-ears-v1"], 134],
  [
    "crew-reactions-v2",
    3,
    ["mira-reaction-v1", "lico-reaction-ponytail-v1", "finn-reaction-v1"],
    [126, 128, 148],
  ],
]) {
  const source = `assets/source/storybook/${sourceName}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const all = spriteBounds(data, info.width, info.height, { count: rows * 4, columns: 4, rows });
  if (all.length !== rows * 4 || all.some((p) => p.area < 1000 || p.width > info.width / 4))
    throw Error(`Touching action sprites: ${sourceName}`);
  for (const [group, name] of groups.entries()) {
    const parts = all.slice(group * 4, group * 4 + 4),
      scale = (Array.isArray(targetHeight) ? targetHeight[group] : targetHeight) / parts[0].height;
    const layers = [],
      metrics = [];
    for (const [frame, p] of parts.entries()) {
      const width = Math.round(p.width * scale),
        height = Math.round(p.height * scale);
      let sum = 0,
        count = 0;
      for (let y = p.top + Math.floor(p.height * 0.87); y < p.top + p.height; y++)
        for (let x = p.left; x < p.left + p.width; x++)
          if (data[(y * info.width + x) * 4 + 3] > 128) {
            sum += x;
            count++;
          }
      const left = Math.round(96 - (sum / count - p.left) * scale),
        top = 176 - height;
      if (left < 2 || left + width > 190 || top < 4) throw Error(`Clipped ${name}/${frame}`);
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
    await writeFile(
      `public/storybook-study/${name}-metrics.json`,
      JSON.stringify(metrics, null, 2),
    );
  }
}
const root =
  '.storybook-reader-stage[data-story^="merrill-seedlings-"] .storybook-painted-stage[data-painted="true"]';
let css =
  "/* Live paper actions; ear cover and basket grips remain preparation for future use. */\n";
for (const [who, art, frames] of [
  [
    "lico",
    "lico-seedling-paper-v1",
    [
      [80, 0],
      [81, 1],
      [82, 2],
      [83, 3],
    ],
  ],
])
  for (const [frame, cell] of frames)
    css += `${root} [data-actor="${who}"] .story-stage-sprite[data-atlas="conversation"][data-frame="${frame}"] { background-image: url("/storybook-study/${art}.webp"); background-size: 400% 100%; background-position: ${(cell * 100) / 3}% 0% !important; top: 2.083333%; height: 100%; image-rendering: auto; }\n`;
await writeFile("app/storybook/seedling-actions.css", css);
let reactions =
  "/* Free-hand greetings and surprise retain each character's standing calibration. */\n";
for (const [who, name] of [
  ["mira", "mira-reaction-v1"],
  ["lico", "lico-reaction-ponytail-v1"],
  ["finn", "finn-reaction-v1"],
])
  for (const frame of [1, 2])
    reactions += `.storybook-presentation .storybook-painted-stage[data-painted="true"] [data-actor="${who}"] .story-stage-sprite[data-atlas="conversation"][data-frame="${frame}"] { background-image: url("/storybook-study/${name}.webp"); background-size: 400% 100%; background-position: ${(frame * 100) / 3}% 0% !important; top: 2.083333%; height: 100%; image-rendering: auto; }\n`;
await writeFile("app/storybook/crew-reactions.css", reactions);
