import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/wrapped-moss-jar-v1.png";
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const [bounds] = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 1,
  columns: 1,
  rows: 1,
});
const wrapped = await sharp(source)
  .extract(bounds)
  .resize({ width: 144, height: 184, fit: "inside" })
  .png()
  .toBuffer();
await sharp({ create: { width: 160, height: 200, channels: 4, background: "#00000000" } })
  .composite([{ input: wrapped, left: 8, top: 8 }])
  .webp({ lossless: true })
  .toFile("public/storybook-study/wrapped-moss-jar-v1.webp");
const root =
  '.storybook-reader-stage[data-story="starlit-guild-founding-departure"] .storybook-painted-stage[data-painted="true"]';
let css =
  "/* Founding journey: one body registration through packing, gifting and roadside study. */\n";
function poses(who, atlas, art, columns, rows, frames, extra = "") {
  for (const [frame, cell] of frames)
    css += `${root} [data-actor="${who}"] .story-stage-sprite[data-atlas="${atlas}"][data-frame="${frame}"] { background-image: url("/storybook-study/${art}.webp"); background-size: ${columns * 100}% ${rows * 100}%; background-position: ${((cell % columns) / (columns - 1)) * 100}% ${rows > 1 ? (Math.floor(cell / columns) / (rows - 1)) * 100 : 0}% ${art === "finn-pull-v1" ? "" : "!important"}; top: 2.083333%; height: 100%; image-rendering: auto; ${extra} }\n`;
}
poses("lico", "conversation", "lico-transplant-care-v1", 4, 2, [
  [73, 3],
  [86, 4],
  [87, 5],
  [13, 6],
]);
poses("lico", "conversation", "lico-work-ponytail-v1", 4, 1, [
  [14, 1],
  [15, 1],
  [16, 1],
]);
poses("lico", "conversation", "lico-notebook-walk-ponytail-v1", 4, 2, [
  [8, 4],
  [9, 5],
  [22, 6],
  [23, 7],
]);
poses(
  "finn",
  "adventure",
  "finn-pull-v1",
  4,
  1,
  [
    [20, 1],
    [21, 1],
  ],
  "animation: storybook-cart-stride 720ms steps(1, end) infinite;",
);
for (const [frame, cell] of [
  [4, 1],
  [5, 2],
  [6, 3],
  [7, 2],
  [16, 4],
  [17, 5],
  [18, 6],
  [19, 7],
])
  css += `${root} :is([data-npc="keeper"], [data-npc-hand="keeper"]) .story-stage-extra-sprite[data-frame="${frame}"] { background-image: url("/storybook-study/keeper-registry-v1.webp") !important; background-size: 400% 200% !important; background-position: ${((cell % 4) / 3) * 100}% ${Math.floor(cell / 4) * 100}% !important; image-rendering: auto; }\n`;
const props = [
  ["dining-table", "office-table-v2", "384 / 167"],
  ["ledger", "bed-open-ledger-v1", "1"],
  ["basket", "field-basket-v1", "1"],
  ["tool-rucksack", "tool-rucksack-v1", "1"],
  ["delivery-bag", "visiting-satchel-v1", "1"],
  ["sample-jar", "moss-jar-v1", ".8"],
  ["empty-cart", "garden-handcart-v2", "504 / 312"],
  ["sealed-letter", "shipping-record-v1", "1"],
];
for (const [art, file, ratio] of props)
  css += `${root} .story-stage-item[data-art="${art}"] { background-image: url("/storybook-study/${file}.webp"); aspect-ratio: ${ratio}; image-rendering: auto; }\n`;
css += `${root} .story-stage-item[data-item="comparison-jar"][data-art="packing-cloth"] { background-image: url("/storybook-study/wrapped-moss-jar-v1.webp"); aspect-ratio: .8; image-rendering: auto; }\n`;
css += `${root} [data-npc="keeper"] .story-stage-name { top: 10%; }\n`;
css += `${root} [data-actor="lico"] .story-stage-name { top: 20%; }\n`;
css += `${root} [data-actor="lico"]:has(.story-stage-sprite:is([data-frame="13"], [data-frame="86"], [data-frame="87"])) .story-stage-name { top: 30%; }\n`;
css += `${root} [data-actor="finn"]:not([data-moving="true"]) .story-stage-sprite[data-atlas="adventure"] { animation: none; }\n`;
css +=
  '@media (max-width: 600px) { .storybook-reader-stage[data-story="starlit-guild-founding-departure"] .story-stage-space { transform: none; } .storybook-reader-stage[data-story="starlit-guild-founding-departure"] .story-stage-name { font-size: 12px; } }\n';
css += `@media (prefers-reduced-motion: reduce) { ${root} [data-actor="finn"] .story-stage-sprite { animation: none !important; } }\n`;
await writeFile("app/storybook/founding-departure.css", css);
