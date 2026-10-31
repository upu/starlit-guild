import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const props = [
  [
    "packing-cloth",
    "common-packing-cloth-v1",
    "assets/source/storybook/common-packing-cloth-v1.png",
  ],
  [
    "dragging-cloth",
    "common-dragging-cloth-v1",
    "assets/source/storybook/common-dragging-cloth-v1.png",
  ],
  ["delivery-bag", "common-delivery-bag-v1", "public/storybook-study/honey-bag-v1.webp"],
  ["old-wrapper", "common-old-wrapper-v1", "assets/source/storybook/common-old-wrapper-v1.png"],
  ["paper", "common-paper-v1", "assets/source/storybook/common-paper-v1.png"],
  ["lap-napkin", "common-lap-napkin-v1", "assets/source/storybook/common-lap-napkin-v1.png"],
  ["bread-half", "common-bread-half-v1", "assets/source/storybook/common-bread-half-v1.png"],
  ["bread", "common-wrapped-bread-v1", "assets/source/storybook/common-wrapped-bread-v1.png"],
  ["picnic-cloth", "common-picnic-cloth-v1", "public/storybook-study/walnut-cloth-v1.webp"],
  ["dish", "common-dish-v1", "public/storybook-study/sample-bowl-v1.webp"],
  ["moss", "common-moss-bowl-v1", "public/storybook-study/moss-bowl-v1.webp"],
  ["stone", "common-flat-stone-v1", "assets/source/storybook/common-flat-stone-v1.png"],
  ["quill", "common-quill-v1", "assets/source/storybook/common-quill-v1.png"],
  ["spatula", "common-spatula-v1", "assets/source/storybook/common-spatula-v1.png"],
  [
    "travel-bundle",
    "common-travel-bundle-v1",
    "assets/source/storybook/common-travel-bundle-v1.png",
  ],
];

async function visiblePart(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const [bounds] = spriteBounds(data, info.width, info.height, { count: 1, columns: 1, rows: 1 });
  if (!bounds) throw Error(`Empty prop: ${file}`);
  return { bounds, width: info.width, height: info.height };
}

function referenceBox(reference, canvas) {
  const fit = Math.min(canvas.width / reference.width, canvas.height / reference.height);
  const b = reference.bounds;
  return {
    left: (canvas.width - reference.width * fit) / 2 + b.left * fit,
    top: (canvas.height - reference.height * fit) / 2 + b.top * fit,
    width: b.width * fit,
    height: b.height * fit,
  };
}

async function build([art, name, source]) {
  const reference = `public/story-stage/${art === "travel-bundle" ? art : `prop-${art}`}.webp`;
  const canvas = { width: 256, height: art === "travel-bundle" ? 205 : 197 };
  const old = referenceBox(await visiblePart(reference), canvas);
  const { bounds } = await visiblePart(source);
  const scale = Math.min(old.width / bounds.width, old.height / bounds.height);
  const width = Math.max(1, Math.round(bounds.width * scale));
  const height = Math.max(1, Math.round(bounds.height * scale));
  const left = Math.round(old.left + (old.width - width) / 2);
  const top = Math.round(old.top + old.height - height);
  const input = await sharp(source).extract(bounds).resize(width, height).png().toBuffer();
  const pixels = await sharp({ create: { ...canvas, channels: 4, background: "#00000000" } })
    .composite([{ input, left, top }])
    .webp({ lossless: true })
    .toBuffer();
  const output = `public/storybook-study/${name}.webp`;
  await writeFile(output, pixels);
  return {
    art,
    source,
    reference,
    output,
    canvas,
    referenceBox: old,
    sourceBounds: bounds,
    registered: { left, top, width, height },
    sha256: createHash("sha256").update(pixels).digest("hex"),
  };
}

const metrics = [];
for (const prop of props) metrics.push(await build(prop));
await writeFile(
  "public/storybook-study/common-props-v1-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
const recordPath = "docs/art-generation/storybook-common-props-20261031.json";
const record = JSON.parse(await readFile(recordPath, "utf8"));
record.builder = "scripts/build-storybook-common-props.mjs";
record.registration =
  "Preserve each authored visible footprint and bottom contact in the existing 1.3 item container (5/4 luggage). Fit without distortion; do not normalize objects to fill the image.";
record.outputs = metrics.map(({ art, output, sha256 }) => ({ art, output, sha256 }));
await writeFile(recordPath, JSON.stringify(record, null, 2) + "\n");
console.log(
  JSON.stringify({
    props: metrics.length,
    output: "public/storybook-study/common-props-v1-metrics.json",
  }),
);
