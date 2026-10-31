import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const kind = process.argv[2] ?? "poses";
if (!["poses", "service", "placement"].includes(kind)) throw Error("Unknown merchant strip");
const actor = process.argv[3] ?? "merchant";
const version = process.argv[4] ?? "v1";
if (!/^v\d+$/.test(version)) throw Error("Invalid strip version");
if (!["merchant", "keeper", "worker"].includes(actor) || (actor !== "merchant" && kind !== "poses"))
  throw Error("Unknown office character strip");
const name =
  actor !== "merchant"
    ? `${actor}-poses-v1`
    : kind === "placement"
      ? `merchant-placement-${version}`
      : kind === "service"
        ? "merchant-service-v1"
        : "merchant-poses-v2";
const horizontal = kind !== "poses" || actor !== "merchant";
const source = `assets/source/storybook/${name}.png`;
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, {
  count: 4,
  columns: horizontal ? 4 : 2,
  rows: horizontal ? 1 : 2,
});
if (parts.length !== 4) throw Error("Expected four merchant poses");
const scale = 94 / parts[0].height;
const layers = [];
const metrics = [];
for (const [index, part] of parts.entries()) {
  const { left, top, width, height } = part;
  // Hands extend in different directions; use the boots, not the whole silhouette, as anchor.
  let sum = 0,
    pixels = 0;
  for (let y = top + Math.floor(height * 0.85); y < top + height; y++) {
    for (let x = left; x < left + width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        sum += x;
        pixels++;
      }
    }
  }
  if (!pixels) throw Error("Missing merchant foot anchor");
  const anchor = sum / pixels;
  const w = Math.round(width * scale),
    h = Math.round(height * scale);
  const input = await sharp(source)
    .extract({ left, top, width, height })
    .resize(w, h)
    .png()
    .toBuffer();
  layers.push({
    input,
    left: index * 128 + Math.round(64 - (anchor - left) * scale),
    top: 120 - h,
  });
  metrics.push({ width: w, height: h, footAnchor: anchor, scale });
}
await sharp({ create: { width: 512, height: 128, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile(`public/storybook-study/${name}.webp`);
await writeFile(
  `public/storybook-study/${kind !== "poses" || actor !== "merchant" ? name : "merchant"}-metrics.json`,
  JSON.stringify(metrics, null, 2),
);
