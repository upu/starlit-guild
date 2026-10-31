import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

function headBounds(data, stride, part) {
  let left = stride,
    right = 0;
  for (let y = part.top; y < part.top + part.height * 0.28; y++)
    for (let x = part.left; x < part.left + part.width; x++)
      if (data[(y * stride + x) * 4 + 3] > 128) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
  return { center: (left + right) / 2, width: right - left + 1 };
}

const id = process.argv[2] ?? "finn";
if (!["aria", "leon", "finn", "mira", "lico", "merchant"].includes(id))
  throw Error("Unknown walking character");
const cell = id === "merchant" ? 128 : 192;
const baseline = id === "merchant" ? 120 : 176;
const outputVersion = process.argv[3] ?? "v1";
if (!/^v\d+$/.test(outputVersion)) throw Error("Invalid walk version");
const kind = process.argv[4] ?? "walk";
if (
  !["walk", "paper-walk"].includes(kind) ||
  (kind === "paper-walk" && !["aria", "leon", "mira"].includes(id))
)
  throw Error("Unknown walk strip kind");
const source = `assets/source/storybook/${id}-${kind}-${outputVersion}.png`;
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 4,
  columns: 4,
  rows: 1,
});
if (parts.length !== 4) throw Error("Expected four walking frames");
const version = ["finn", "lico"].includes(id) ? "v2" : "v1";
const paperReference = {
  aria: "aria-paper-v1",
  leon: "leon-carry-v1",
  mira: "mira-conversation-v1",
};
const referencePath =
  kind === "paper-walk"
    ? paperReference[id]
    : id === "merchant"
      ? "merchant-poses-v2"
      : `${id}-conversation-${version}`;
const reference = await sharp(`public/storybook-study/${referencePath}.webp`)
  .extract({ left: 0, top: 0, width: cell, height: cell })
  .ensureAlpha()
  .raw()
  .toBuffer();
const referencePart = spriteBounds(reference, cell, cell, { count: 1, rows: 1, columns: 1 })[0];
const head = headBounds(reference, cell, referencePart);
// One scale for the whole cycle. Passing frames must not be enlarged to standing height.
const headScale = head.width / headBounds(raw.data, raw.info.width, parts[0]).width;
const scale =
  kind === "paper-walk"
    ? Math.min(headScale, referencePart.height / Math.max(...parts.map((part) => part.height)))
    : headScale;
const layers = [],
  metrics = [];
for (const [frame, part] of parts.entries()) {
  const h = headBounds(raw.data, raw.info.width, part);
  const width = Math.round(part.width * scale),
    height = Math.round(part.height * scale);
  const left = Math.round(head.center - (h.center - part.left) * scale);
  if (left < 0 || left + width > cell || height > baseline - 4)
    throw Error("Walking pose exceeds cell");
  const input = await sharp(source)
    .extract({ left: part.left, top: part.top, width: part.width, height: part.height })
    .resize(width, height)
    .png()
    .toBuffer();
  layers.push({ input, left: frame * cell + left, top: baseline - height });
  metrics.push({ frame, scale, width, height, headWidth: h.width * scale, left, baseline });
}
await sharp({ create: { width: cell * 4, height: cell, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile(`public/storybook-study/${id}-${kind}-${outputVersion}.webp`);
await writeFile(
  `public/storybook-study/${id}-${kind}-metrics.json`,
  JSON.stringify({ referenceHeadWidth: head.width, frames: metrics }, null, 2),
);
console.log(metrics);
