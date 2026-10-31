import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const [name, sourceName, rows, cell, height, sole] of [
  ["lico-transplant-care-v1", "lico-transplant-care-ponytail-v2", 2, 192, 128, 176],
  ["worker-transplant-v1", "worker-transplant-v2", 3, 128, 84, 120],
  ["doctor-bag-v1", "doctor-bag-v2", 1, 128, 94, 120],
]) {
  const source = `assets/source/storybook/${sourceName}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const parts =
    name === "doctor-bag-v1"
      ? doctorBounds(data, info.width, info.height)
      : spriteBounds(data, info.width, info.height, { count: rows * 4, columns: 4, rows });
  if (parts.length !== rows * 4 || parts.some((p) => p.width >= info.width / 4))
    throw Error(`Touching ${name}`);
  const baseScale = height / parts[0].height,
    layers = [],
    metrics = [];
  for (const [frame, p] of parts.entries()) {
    const scale =
      name === "worker-transplant-v1" && frame >= 8 ? height / parts[8].height : baseScale;
    const width = Math.round(p.width * scale),
      h = Math.round(p.height * scale);
    let sum = 0,
      count = 0;
    for (let y = p.top + Math.floor(p.height * 0.87); y < p.top + p.height; y++)
      for (let x = p.left; x < p.left + p.width; x++)
        if (data[(y * info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    const center = name === "doctor-bag-v1" ? headCenter(data, info.width, p) : sum / count;
    const left = Math.round(cell / 2 - (center - p.left) * scale),
      top = sole - h;
    if (left < 2 || left + width > cell - 2 || top < 3) throw Error(`Clipped ${name}/${frame}`);
    layers.push({
      input: await sharp(source).extract(p).resize(width, h).png().toBuffer(),
      left: (frame % 4) * cell + left,
      top: Math.floor(frame / 4) * cell + top,
    });
    metrics.push({ frame, scale, width, height: h, left, top, baseline: sole });
  }
  await sharp({
    create: { width: cell * 4, height: cell * rows, channels: 4, background: "#00000000" },
  })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  await writeFile(`public/storybook-study/${name}-metrics.json`, JSON.stringify(metrics, null, 2));
  console.log(
    name,
    metrics.map((f) => f.height),
  );
}
await sharp("assets/source/storybook/new-moss-beds-v1.png")
  .png()
  .toFile("public/storybook-study/new-moss-beds-v1.png");
const root =
  '.storybook-reader-stage[data-story="moss-transplant-return"] .storybook-painted-stage[data-painted="true"]';
let css = "/* Shared body scales; low care poses are never enlarged to fill their cells. */\n";
for (const [who, name, rows, frames] of [
  [
    "lico",
    "lico-transplant-care-v1",
    2,
    [
      [73, 3],
      [84, 1],
      [85, 2],
      [86, 4],
      [87, 5],
      [13, 6],
    ],
  ],
  [
    "worker",
    "worker-transplant-v1",
    3,
    [
      [1, 5],
      [10, 2],
      [11, 4],
      [4, 8],
      [5, 9],
      [6, 10],
      [7, 11],
    ],
  ],
  ["finn", "finn-reaction-v1", 1, [[13, 3]]],
  [
    "finn",
    "finn-cloth-v1",
    2,
    [
      [14, 1],
      [15, 1],
      [16, 1],
      [8, 2],
      [9, 3],
      [22, 4],
      [23, 5],
    ],
  ],
  [
    "doctor",
    "doctor-bag-v1",
    1,
    [
      [8, 0],
      [9, 1],
      [10, 2],
      [11, 3],
    ],
  ],
])
  for (const [frame, cell] of frames) {
    const npc = who === "worker" || who === "doctor";
    css += `${root} [data-${npc ? "npc" : "actor"}="${who}"] .story-stage-${npc ? "extra-" : ""}sprite${npc ? "" : '[data-atlas="conversation"]'}[data-frame="${frame}"] { background-image:url("/storybook-study/${name}.webp")${npc ? " !important" : ""}; background-size:400% ${rows * 100}% !important; background-position:${((cell % 4) * 100) / 3}% ${rows === 1 ? 0 : (Math.floor(cell / 4) * 100) / (rows - 1)}% !important; image-rendering:auto; ${npc ? "" : "top:2.083333%;height:100%;"} }\n`;
  }
for (const [art, file] of [
  ["basket", "field-basket-v1"],
  ["cloth", "spare-cloth-folded-v1"],
  ["moss", "bed-sprig-v1"],
  ["colony", "moss-colony-v1"],
  ["tools", "mason-tools-v1"],
  ["doctor-satchel", "visiting-satchel-v1"],
])
  css += `${root} .story-stage-item[data-art="${art}"] {background-image:url("/storybook-study/${file}.webp");aspect-ratio:1;image-rendering:auto;}\n`;
css +=
  '@media(max-width:600px){.storybook-reader-stage[data-story="moss-transplant-return"] .story-stage-space{transform:none;}.storybook-reader-stage[data-story="moss-transplant-return"] .story-stage-name{font-size:14px;}}\n';
await writeFile("app/storybook/transplant-return.css", css);
await sharp("assets/source/storybook/brekka-tower-drain-v1.png")
  .png()
  .toFile("public/storybook-study/brekka-tower-drain-v1.png");

function doctorBounds(data, width, height) {
  return Array.from({ length: 4 }, (_, frame) => {
    let left = width,
      right = 0,
      top = height,
      bottom = 0;
    for (let y = 0; y < height; y++)
      for (
        let x = Math.floor((frame * width) / 4);
        x < Math.floor(((frame + 1) * width) / 4);
        x++
      ) {
        if (data[(y * width + x) * 4 + 3] <= 16) continue;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    return { left, top, width: right - left + 1, height: bottom - top + 1 };
  });
}
function headCenter(data, width, p) {
  let sum = 0,
    count = 0;
  for (let y = p.top; y < p.top + p.height * 0.25; y++)
    for (let x = p.left; x < p.left + p.width; x++)
      if (data[(y * width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  return sum / count;
}
