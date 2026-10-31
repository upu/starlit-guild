import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";
import { readFrame } from "./home-pixel-frames.mjs";

const name = process.argv[2] ?? "keeper-basket-handoff-v1";
if (
  ![
    "keeper-basket-handoff-v1",
    "keeper-yard-walk-v1",
    "keeper-hatch-mark-v1",
    "keeper-hatch-mark-v2",
    "keeper-hatch-open-v1",
    "keeper-hatch-carry-walk-v1",
    "keeper-hatch-carry-walk-v2",
    "keeper-tower-signal-v1",
  ].includes(name)
)
  throw Error(`Unknown keeper strip: ${name}`);
const source = `assets/source/storybook/${name}.png`;
const output = `public/storybook-study/${name}.webp`;
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const columns = name === "keeper-tower-signal-v1" ? 2 : 4;
const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: columns,
  columns,
  rows: 1,
});
if (parts.length !== columns) throw Error(`Keeper strip requires ${columns} isolated poses`);
const original = await readFrame("public/storybook-study/keeper-poses-v1.webp", {
  left: 0,
  top: 0,
  width: 128,
  height: 128,
});
const scale = original.box.height / parts[0].height;
const layers = [],
  metrics = [];
for (const [frame, part] of parts.entries()) {
  let foot = 0,
    count = 0;
  for (let y = part.top + Math.floor(part.height * 0.92); y < part.top + part.height; y++)
    for (let x = part.left; x < part.left + part.width; x++)
      if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
        foot += x;
        count++;
      }
  if (!count) throw Error(`Missing keeper feet: ${frame}`);
  const width = Math.round(part.width * scale),
    height = Math.round(part.height * scale);
  const left = Math.round(64 - (foot / count - part.left) * scale),
    top = 120 - height;
  if (left < 3 || left + width > 125 || top < 3) throw Error(`Clipped keeper pose: ${frame}`);
  layers.push({
    input: await sharp(source)
      .extract(part)
      .resize(width, height, { kernel: "nearest" })
      .png()
      .toBuffer(),
    left: frame * 128 + left,
    top,
  });
  metrics.push({ frame, source, scale, left, top, width, height, baseline: 120 });
}
await sharp({ create: { width: columns * 128, height: 128, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile(output);
for (const metric of metrics) {
  const pose = await readFrame(output, {
    left: metric.frame * 128,
    top: 0,
    width: 128,
    height: 128,
  });
  // A bent torso can meet the head inside this upper crop; this is not an anatomical head width.
  metric.upperSilhouetteWidth = pose.head.width;
}
await writeFile(
  `public/storybook-study/${name}-metrics.json`,
  JSON.stringify(metrics, null, 2) + "\n",
);
console.log({
  originalHeight: original.box.height,
  originalHead: original.head.width,
  poses: metrics,
});
