import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/lico-label-ponytail-v3.png";
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 4,
  columns: 4,
  rows: 1,
});
const scale = 128 / parts[0].height,
  layers = [],
  metrics = [];
for (const [frame, p] of parts.entries()) {
  const width = Math.round(p.width * scale),
    height = Math.round(p.height * scale);
  let sum = 0,
    count = 0;
  for (let y = p.top + Math.floor(p.height * 0.87); y < p.top + p.height; y++)
    for (let x = p.left; x < p.left + p.width; x++)
      if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  const left = Math.round(96 - (sum / count - p.left) * scale),
    top = 176 - height;
  if (left < 2 || left + width > 190 || top < 4) throw Error(`Clipped Lico label/${frame}`);
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
  .toFile("public/storybook-study/lico-label-v1.webp");
await writeFile(
  "public/storybook-study/lico-label-v1-metrics.json",
  JSON.stringify(metrics, null, 2),
);
const bowl = "assets/source/storybook/founding-moss-bowl-v1.png";
const b = await sharp(bowl).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const [bounds] = spriteBounds(b.data, b.info.width, b.info.height, {
  count: 1,
  columns: 1,
  rows: 1,
});
const prop = await sharp(bowl)
  .extract(bounds)
  .resize({ width: 240, height: 181, fit: "inside" })
  .png()
  .toBuffer();
const propSize = await sharp(prop).metadata();
await sharp({ create: { width: 256, height: 197, channels: 4, background: "#00000000" } })
  .composite([
    { input: prop, left: Math.round((256 - propSize.width) / 2), top: 197 - 8 - propSize.height },
  ])
  .webp({ lossless: true })
  .toFile("public/storybook-study/founding-moss-bowl-v1.webp");

const root =
  '.storybook-reader-stage[data-story="starlit-guild-founding-return"] .storybook-painted-stage[data-painted="true"]';
let css = "/* Registration uses the same body scale as the courtyard and journey. */\n";
css += `${root} [data-actor="aria"][data-held-art="sample-dish"] .story-stage-sprite[data-atlas="conversation"]:is([data-frame="14"], [data-frame="15"], [data-frame="16"]) { background-image: url("/storybook-study/aria-carry-v1.webp"); background-size: 400% 100%; background-position: 0% 0% !important; top: 2.083333%; height: 100%; image-rendering: auto; }\n`;
for (const [frame, cell] of [
  [69, 2],
  [70, 2],
  [73, 1],
  [14, 1],
  [15, 1],
  [16, 1],
])
  css += `${root} [data-actor="lico"] .story-stage-sprite[data-atlas="conversation"][data-frame="${frame}"] { background-image: url("/storybook-study/lico-label-v1.webp"); background-size: 400% 100%; background-position: ${(cell / 3) * 100}% 0% !important; top: 2.083333%; height: 100%; image-rendering: auto; }\n`;
for (const [frame, cell] of [
  [8, 4],
  [9, 5],
  [22, 6],
  [23, 7],
])
  css += `${root} [data-actor="lico"] .story-stage-sprite[data-atlas="conversation"][data-frame="${frame}"] { background-image: url("/storybook-study/lico-notebook-walk-ponytail-v1.webp"); background-size: 400% 200%; background-position: ${((cell % 4) / 3) * 100}% 100% !important; top: 2.083333%; height: 100%; image-rendering: auto; }\n`;
for (const [art, file, ratio] of [
  ["sample-dish", "founding-moss-bowl-v1", "1.3"],
  ["tool-rucksack", "tool-rucksack-v1", "1"],
  ["paper", "shipping-record-v1", "1"],
  ["folded-paper", "folded-request-v1", "1"],
])
  css += `${root} .story-stage-item[data-art="${art}"] { background-image: url("/storybook-study/${file}.webp"); aspect-ratio: ${ratio}; image-rendering: auto; }\n`;
css += `${root} [data-actor="lico"] { --stage-name-above: 22%; }\n`;
css +=
  '@media (max-width: 600px) { .storybook-reader-stage[data-story="starlit-guild-founding-return"] .story-stage-space { transform: none; } .storybook-reader-stage[data-story="starlit-guild-founding-return"] .story-stage-name { font-size: 12px; } }\n';
await writeFile("app/storybook/founding-return.css", css);
