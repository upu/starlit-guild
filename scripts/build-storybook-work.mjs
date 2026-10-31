import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const id = process.argv[2] ?? "leon";
if (!["aria", "leon", "finn", "mira", "lico"].includes(id)) throw Error("Unknown work character");
const kind = process.argv[3] ?? "work";
if (
  ![
    "work",
    "packing",
    "shawl",
    "lantern",
    "seat",
    "seat-action",
    "paper-seat",
    "sit-down",
    "conversation",
    "reaction",
    "paper",
    "route-notes",
    "groove-plan",
  ].includes(kind)
)
  throw Error("Unknown pose strip kind");
const version = process.argv[4] ?? "v1";
if (!/^v\d+$/.test(version)) throw Error("Invalid pose strip version");
const source = `assets/source/storybook/${id}-${kind}-${version}.png`;
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const rows = ["shawl", "lantern"].includes(kind) ? 2 : 1;
const parts = spriteBounds(data, info.width, info.height, { count: rows * 4, columns: 4, rows });
if (parts.length !== rows * 4)
  throw Error("Expected complete pose cells including standing reference");
// All poses share the scale measured from the standing reference, not their bent height.
let scale = { aria: 134, leon: 144, finn: 148, mira: 126, lico: 128 }[id] / parts[0].height;
let seatAnchor = 96;
if (kind === "paper-seat") {
  const reference = await sharp(`public/storybook-study/${id}-seat-v2.webp`)
    .extract({ left: 192, top: 0, width: 192, height: 192 })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const part = spriteBounds(reference, 192, 192, { count: 1, columns: 1, rows: 1 })[0];
  scale = part.height / Math.max(...parts.slice(1).map((pose) => pose.height));
  let sum = 0,
    count = 0;
  for (let y = part.top + Math.floor(part.height * 0.85); y < part.top + part.height; y++)
    for (let x = part.left; x < part.left + part.width; x++)
      if (reference[(y * 192 + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  seatAnchor = sum / count;
}
const layers = [],
  metrics = [];
for (const [index, part] of parts.entries()) {
  const { left, top, width, height } = part;
  const w = Math.round(width * scale),
    h = Math.round(height * scale);
  let sum = 0,
    count = 0;
  for (let y = top + Math.floor(height * 0.85); y < top + height; y++)
    for (let x = left; x < left + width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  if (!count) throw Error("Missing foot contact");
  const anchor =
    kind === "paper-seat" ? seatAnchor : kind === "seat-action" && index > 0 ? 113 : 96;
  const x =
    kind === "seat" ? Math.round((192 - w) / 2) : Math.round(anchor - (sum / count - left) * scale);
  if (x < 0 || x + w > 192 || h > 176) throw Error("Working pose exceeds cell");
  const input = await sharp(source)
    .extract({ left, top, width, height })
    .resize(w, h)
    .png()
    .toBuffer();
  layers.push({ input, left: (index % 4) * 192 + x, top: Math.floor(index / 4) * 192 + 176 - h });
  metrics.push({ frame: index, scale, width: w, height: h, left: x, top: 176 - h });
}
await sharp({ create: { width: 768, height: rows * 192, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile(`public/storybook-study/${id}-${kind}-${version}.webp`);
await writeFile(
  `public/storybook-study/${id}-${kind}-metrics.json`,
  JSON.stringify(metrics, null, 2),
);
console.log(metrics);
