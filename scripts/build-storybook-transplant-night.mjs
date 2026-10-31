import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/finn-pull-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
const scale = 148 / parts[0].height;
const layers = [],
  metrics = [];
for (const [frame, p] of parts.entries()) {
  const width = Math.round(p.width * scale),
    height = Math.round(p.height * scale);
  const left = Math.round(96 - width / 2),
    top = 176 - height;
  if (left < 2 || top < 4 || left + width > 190) throw Error(`Clipped Finn/${frame}`);
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
  .toFile("public/storybook-study/finn-pull-v1.webp");
await writeFile(
  "public/storybook-study/finn-pull-v1-metrics.json",
  JSON.stringify(metrics, null, 2),
);
// Remove transparent floor padding without changing the cart's painted geometry.
await sharp("public/storybook-study/brekka-basket-cart-v1.webp")
  .extract({ left: 0, top: 0, width: 512, height: 288 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/transplant-cart-v1.webp");

const plank = "assets/source/storybook/transplant-plank-v1.png";
const plankRaw = await sharp(plank).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const [plankBounds] = spriteBounds(plankRaw.data, plankRaw.info.width, plankRaw.info.height, {
  count: 1,
  columns: 1,
  rows: 1,
});
const plankImage = await sharp(plank)
  .extract(plankBounds)
  .resize({ width: 240, height: 48, fit: "inside" })
  .png()
  .toBuffer();
await sharp({ create: { width: 256, height: 64, channels: 4, background: "#00000000" } })
  .composite([{ input: plankImage, left: 8, top: 8 }])
  .webp({ lossless: true })
  .toFile("public/storybook-study/transplant-plank-v1.webp");
await sharp("assets/source/storybook/slime-v1.png")
  .trim()
  .resize({ width: 240, height: 200, fit: "inside" })
  .extend({ top: 8, bottom: 8, left: 8, right: 8 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/slime-v1.webp");
const root =
  '.storybook-reader-stage[data-art="transplant-night-path-v1"] .storybook-painted-stage[data-painted="true"]';
let css = "/* Night scene: shared calibrated bodies, never fit low poses to standing height. */\n";
function poses(who, atlas, art, columns, rows, frames, extra = "") {
  for (const [frame, cell] of frames)
    css += `${root} [data-actor="${who}"] .story-stage-sprite[data-atlas="${atlas}"][data-frame="${frame}"] {\n background-image: url("/storybook-study/${art}.webp"); background-size: ${columns * 100}% ${rows * 100}%; background-position: ${((cell % columns) / (columns - 1)) * 100}% ${rows > 1 ? (Math.floor(cell / columns) / (rows - 1)) * 100 : 0}% ${art === "finn-pull-v1" ? "" : "!important"}; top: 2.083333%; height: 100%; image-rendering: auto; ${extra}\n}\n`;
}
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
poses("finn", "conversation", "finn-cloth-v1", 4, 2, [
  [14, 1],
  [15, 1],
  [16, 1],
  [8, 2],
  [9, 3],
  [22, 4],
  [23, 5],
]);
poses("finn", "conversation", "finn-reaction-v1", 4, 1, [[13, 3]]);
poses("mira", "conversation", "mira-reaction-v1", 4, 1, [[13, 3]]);
poses("mira", "conversation", "mira-healing-v1", 4, 2, [
  [44, 1],
  [45, 2],
  [46, 3],
  [47, 4],
]);
poses("leon", "conversation", "leon-battle-v1", 4, 1, [[21, 0]], "width: 133.333333%; left: 0;");
poses(
  "leon",
  "adventure",
  "leon-battle-v1",
  4,
  1,
  [
    [10, 0],
    [11, 1],
    [12, 2],
    [13, 3],
  ],
  "width: 133.333333%; left: 0;",
);
// Lico's empty-hand notebook walk cells keep the same body registration as her grip.
poses("lico", "conversation", "lico-work-ponytail-v1", 4, 1, [
  [14, 1],
  [15, 1],
  [16, 1],
]);
const props = [
  ["basket-cart", "transplant-cart-v1", "512 / 288"],
  ["rope-coil", "snag-rope-v1", "1"],
  ["lap-board", "transplant-plank-v1", "4"],
  ["picnic-cloth", "spare-cloth-spread-v1", "1"],
  ["packing-cloth", "spare-cloth-folded-v1", "1"],
  ["slime", "slime-v1", "1.3"],
];
for (const [art, file, ratio] of props)
  css += `${root} .story-stage-item[data-art="${art}"] { background-image: url("/storybook-study/${file}.webp"); aspect-ratio: ${ratio}; image-rendering: auto; }\n`;
css += `${root} .story-stage-ground { background-color: transparent; background-blend-mode: normal; }\n`;
css += `${root} .story-stage-item[data-art="moss"] { filter: drop-shadow(0 0 7px #c9ffacb0) drop-shadow(0 0 18px #bdff9b60); }\n`;
css += `${root} .story-stage-item[data-art="moss"]::after { content: ""; position: absolute; inset: -20%; border-radius: 50%; background: radial-gradient(ellipse, #d6ffc130, #d6ffc100 70%); animation: storybook-moss-breathe 4.8s ease-in-out infinite alternate; }\n`;
css += `${root} [data-actor="finn"]:not([data-moving="true"]) .story-stage-sprite[data-atlas="adventure"] { animation: none; }\n`;
css +=
  '@media (max-width: 600px) { .storybook-reader-stage[data-art="transplant-night-path-v1"] .story-stage-space { transform: none; } .storybook-reader-stage[data-art="transplant-night-path-v1"] .story-stage-name { font-size: 12px; } }\n';
css += `@media (prefers-reduced-motion: reduce) { ${root} [data-actor="finn"] .story-stage-sprite { animation: none !important; } }\n`;
await writeFile("app/storybook/transplant-night.css", css);
