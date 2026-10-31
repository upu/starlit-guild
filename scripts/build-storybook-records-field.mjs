import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const [sourceName, columns, rows, names, shared] of [
  [
    "field-reflector-v1",
    5,
    1,
    [
      "field-reflector-covered",
      "field-reflector",
      "field-reflector-down",
      "field-cover-held",
      "field-cover-flat",
    ],
    true,
  ],
  [
    "records-field-props-v1",
    3,
    2,
    [
      "field-lap-board",
      "field-open-ledger",
      "field-closed-ledger",
      "field-samples",
      "field-seedling",
      "field-basket",
    ],
    false,
  ],
]) {
  const source = `assets/source/storybook/${sourceName}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height, { count: names.length, columns, rows });
  if (parts.length !== names.length || parts.some((p) => p.width > (info.width / columns) * 1.25))
    throw Error(`Overlapping props in ${sourceName}`);
  const commonScale = Math.min(
    240 / Math.max(...parts.map((p) => p.width)),
    232 / Math.max(...parts.map((p) => p.height)),
  );
  const metrics = [];
  for (const [i, p] of parts.entries()) {
    const scale = shared ? commonScale : Math.min(240 / p.width, 232 / p.height);
    const width = Math.round(p.width * scale),
      height = Math.round(p.height * scale);
    if (height > 240 || width > 244) throw Error(`Clipped prop ${names[i]}`);
    const input = await sharp(source).extract(p).resize(width, height).png().toBuffer();
    await sharp({ create: { width: 256, height: 256, channels: 4, background: "#00000000" } })
      .composite([{ input, left: Math.round((256 - width) / 2), top: 248 - height }])
      .webp({ lossless: true })
      .toFile(`public/storybook-study/${names[i]}-v1.webp`);
    metrics.push({ name: names[i], scale, width, height, baseline: 248 });
  }
  await writeFile(
    `public/storybook-study/${sourceName}-metrics.json`,
    JSON.stringify(metrics, null, 2),
  );
  console.log(sourceName, metrics);
}

const foldedSource = "assets/source/storybook/field-cover-folded-v1.png";
const foldedRaw = await sharp(foldedSource)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const foldedBounds = spriteBounds(foldedRaw.data, foldedRaw.info.width, foldedRaw.info.height, {
  count: 1,
  columns: 1,
  rows: 1,
})[0];
const foldedWidth = 199,
  foldedHeight = Math.round((foldedBounds.height * foldedWidth) / foldedBounds.width);
const foldedTop = 248 - foldedHeight;
await sharp({ create: { width: 256, height: 256, channels: 4, background: "#00000000" } })
  .composite([
    {
      input: await sharp(foldedSource)
        .extract(foldedBounds)
        .resize(foldedWidth, foldedHeight)
        .png()
        .toBuffer(),
      left: Math.round((256 - foldedWidth) / 2),
      top: foldedTop,
    },
  ])
  .webp({ lossless: true })
  .toFile("public/storybook-study/field-cover-folded-v1.webp");
await writeFile(
  "public/storybook-study/field-cover-folded-v1-metrics.json",
  JSON.stringify(
    {
      width: foldedWidth,
      height: foldedHeight,
      top: foldedTop,
      gripOffset: (foldedTop / 256) * 18,
    },
    null,
    2,
  ),
);
console.log("folded grip offset", (foldedTop / 256) * 18);

const prefix =
  '.storybook-reader-stage[data-story^="lico-records-"][data-art="moss-beds-v1"] .storybook-painted-stage[data-painted="true"]';
let css = "/* Registered field study: same body scale and separate supported documents. */\n";
function pose(id, frames, name, rows, cell, extra = "") {
  const col = ((cell % 4) * 100) / 3,
    row = (Math.floor(cell / 4) * 100) / Math.max(1, rows - 1);
  css += `${prefix} [data-actor="${id}"] .story-stage-sprite[data-atlas="conversation"]:is(${frames.map((f) => `[data-frame="${f}"]`).join(",")}) { background-image:url("/storybook-study/${name}.webp");background-size:400% ${rows * 100}%;background-position:${col}% ${row}% !important;top:2.083333%;height:100%;image-rendering:auto;${extra}}\n`;
}
for (const [frames, cell] of [
  [[76], 1],
  [[77], 2],
  [[78], 3],
  [[79], 4],
  [[73], 5],
  [[14, 15, 16], 6],
  [[36, 37, 38, 39, 40, 41, 42, 43], 1],
])
  pose("lico", frames, "lico-field-records-ponytail-v1", 2, cell);
pose("lico", [40, 41, 42, 43], "lico-field-records-ponytail-v1", 2, 1, "scale:-1 1;");
pose("lico", [68], "lico-moss-study-ponytail-v1", 3, 1);
css += `${prefix} [data-actor="lico"][data-record-hand-out="true"] .story-stage-sprite[data-frame="79"] {background-position:100% 100% !important;}\n`;
css += `${prefix} [data-actor="lico"] {--stage-name-above:20%;}\n`;
css += `${prefix} [data-actor="lico"]:has(.story-stage-sprite:is(${[36, 37, 38, 39, 40, 41, 42, 43, 76, 77, 78, 79].map((f) => `[data-frame="${f}"]`).join(",")})) {--stage-name-above:30%;}\n`;
for (const [f, c] of [
  [68, 1],
  [69, 2],
  [70, 3],
  [71, 4],
])
  pose("mira", [f], "mira-moss-care-v1", 2, c);
for (const [f, c] of [
  [14, 1],
  [15, 6],
  [16, 1],
  [8, 2],
  [9, 3],
  [22, 4],
  [23, 5],
])
  pose("finn", [f], "finn-cloth-v1", 2, c);
for (const [frames, c] of [
  [[0], 0],
  [[1, 2, 3], 3],
  [[14], 2],
  [[15], 3],
  [[8], 4],
  [[9], 5],
  [[10], 6],
  [[11], 7],
]) {
  css += `${prefix} [data-npc="keeper"] .story-stage-extra-sprite:is(${frames.map((f) => `[data-frame="${f}"]`).join(",")}) {background-image:url("/storybook-study/keeper-restoration-v1.webp") !important;background-size:400% 200% !important;background-position:${((c % 4) * 100) / 3}% ${c < 4 ? 0 : 100}% !important;image-rendering:auto;${frames[0] < 4 ? "transform:none !important;" : ""}}\n`;
}
for (const [art, name] of [
  ["reflector-covered", "field-reflector-covered"],
  ["reflector", "field-reflector"],
  ["reflector-down", "field-reflector-down"],
  ["reflector-cover", "field-cover-folded"],
  ["reflector-cover-flat", "field-cover-flat"],
  ["lap-board", "field-lap-board"],
  ["ledger", "field-open-ledger"],
  ["record-board", "field-closed-ledger"],
  ["closed-ledger", "field-closed-ledger"],
  ["sample-dish", "field-samples"],
  ["moss", "field-seedling"],
  ["basket", "field-basket"],
  ["folded-paper", "shipping-record"],
  ["paper", "shipping-record"],
  ["doctor-satchel", "visiting-satchel"],
  ["plant-label", "bed-label"],
  ["step-stool", "bed-stool"],
  ["work-fence", "work-fence"],
])
  css += `${prefix} .story-stage-item[data-art="${art}"] {background-image:url("/storybook-study/${name}-v1.webp");aspect-ratio:1;image-rendering:auto;}\n`;
css += `${prefix} .story-stage-item[data-art="reflector"][data-glow="bright"]::after {width:280%;height:75%;left:-100%;top:80%;opacity:.65;}\n`;
css += `${prefix} .story-stage-item[data-art="low-smoke"]::before {background:radial-gradient(ellipse at 25% 66%,#fff8e8e6 0%,#eeede9b8 27%,#f0eee54d 50%,transparent 73%),radial-gradient(ellipse at 73% 44%,#faf8f0cc 0%,#eeede980 34%,transparent 72%);filter:blur(4px);border-radius:50%;animation:records-field-smoke 3.2s ease-in-out infinite alternate;}\n`;
css += `@keyframes records-field-smoke {from {transform:translateX(2%);opacity:.68;}to {transform:translateX(-3%);opacity:.85;}}\n`;
css += `${prefix} .story-stage-item[data-art="low-smoke"][data-dissipating="true"]::before {animation:stage-smoke-fade 3s ease-out forwards;}\n`;
css += `@media (prefers-reduced-motion:reduce) {${prefix} .story-stage-item[data-art="low-smoke"]::before {animation:none;opacity:.68;}${prefix} .story-stage-item[data-art="low-smoke"][data-dissipating="true"]::before {animation:none;opacity:0;}}\n`;
await writeFile("app/storybook/records-field.css", css);
