import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const root =
  '.storybook-reader-stage[data-story="interlude-promised-walnuts"] .storybook-painted-stage[data-painted="true"]';
let css = "/* Shared body scale and separate snack props. */\n";
const actions = ["idle", "lap", "split", "offer", "bite", "reach", "drink"];
for (const [id, standingHeight] of [
  ["aria", 134],
  ["leon", 144],
]) {
  const source = `assets/source/storybook/${id}-snack-v2.png`;
  const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
    count: 8,
    columns: 4,
    rows: 2,
  });
  if (parts.length !== 8) throw Error(`Incomplete ${id} snacks`);
  const scale = standingHeight / parts[0].height;
  const layers = [],
    metrics = [];
  for (const [frame, p] of parts.entries()) {
    const width = Math.round(p.width * scale),
      height = Math.round(p.height * scale);
    let sum = 0,
      count = 0;
    for (let y = p.top + Math.floor(p.height * 0.88); y < p.top + p.height; y++)
      for (let x = p.left; x < p.left + p.width; x++)
        if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    const left = Math.round(96 - (sum / count - p.left) * scale),
      top = 176 - height;
    if (left < 3 || left + width > 189 || top < 4) throw Error(`Clipped ${id} snack/${frame}`);
    layers.push({
      input: await sharp(source).extract(p).resize(width, height).png().toBuffer(),
      left: (frame % 4) * 192 + left,
      top: Math.floor(frame / 4) * 192 + top,
    });
    metrics.push({ frame, width, height, left, top, scale, baseline: 176 });
  }
  await sharp({ create: { width: 768, height: 384, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${id}-snack-v1.webp`);
  await writeFile(
    `public/storybook-study/${id}-snack-v1-metrics.json`,
    JSON.stringify(metrics, null, 2),
  );
  for (const [index, action] of actions.entries()) {
    const frame = index + 1;
    css += `${root} [data-actor="${id}"][data-snack-action="${action}"] .story-stage-sprite[data-atlas="conversation"] { background-image:url("/storybook-study/${id}-snack-v1.webp"); background-size:400% 200%; background-position:${((frame % 4) / 3) * 100}% ${frame >= 4 ? 100 : 0}% !important; top:2.083333%;height:100%;image-rendering:auto; }\n`;
  }
}
const source = "assets/source/storybook/walnut-props-v1.png";
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 9,
  columns: 3,
  rows: 3,
});
const names = [
  "walnut-light",
  "walnut-medium",
  "walnut-dark",
  "walnut-light-half",
  "walnut-medium-half",
  "walnut-dark-half",
  "walnut-underside",
  "walnut-piece",
  "low-bench",
];
for (const [i, name] of names.entries()) {
  const p = parts[i];
  const width = name === "low-bench" ? 480 : 240;
  const height = Math.round((width * p.height) / p.width);
  await sharp(source)
    .extract(p)
    .resize(width, height)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}-v1.webp`);
  css += `${root} .story-stage-item[data-art="${name}"] { background-image:url("/storybook-study/${name}-v1.webp");aspect-ratio:${width} / ${height};image-rendering:auto; }\n`;
}
const flaskSource = "assets/source/storybook/water-flask-v1.png";
const clothSource = "assets/source/storybook/walnut-cloth-v1.png";
const clothRaw = await sharp(clothSource).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const [cloth] = spriteBounds(clothRaw.data, clothRaw.info.width, clothRaw.info.height, {
  count: 1,
  columns: 1,
  rows: 1,
});
await sharp(clothSource)
  .extract(cloth)
  .resize({ width: 480 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/walnut-cloth-v1.webp");
css += `${root} [data-snack-action] { --stage-name-above:20%; }\n`;
const benchSource = "assets/source/storybook/walnut-bench-v1.png";
const b = await sharp(benchSource).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const [bench] = spriteBounds(b.data, b.info.width, b.info.height, {
  count: 1,
  columns: 1,
  rows: 1,
});
await sharp(benchSource)
  .extract(bench)
  .resize({ width: 480 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/low-bench-v1.webp");
css += `${root} .story-stage-item[data-art="low-bench"] { aspect-ratio:${bench.width} / ${bench.height}; }\n`;
const f = await sharp(flaskSource).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const [flask] = spriteBounds(f.data, f.info.width, f.info.height, {
  count: 1,
  columns: 1,
  rows: 1,
});
await sharp(flaskSource)
  .extract(flask)
  .resize({ height: 320 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/water-flask-v1.webp");
for (const [art, file, ratio] of [
  ["picnic-cloth", "walnut-cloth-v1", "4"],
  ["packing-cloth", "spare-cloth-folded-v1", "2"],
  ["basket", "basket-v1", "1.3"],
  ["travel-flask", "water-flask-v1", `${flask.width} / ${flask.height}`],
])
  css += `${root} .story-stage-item[data-art="${art}"] { background-image:url("/storybook-study/${file}.webp");aspect-ratio:${ratio};image-rendering:auto; }\n`;
css +=
  '@media(max-width:600px){.storybook-reader-stage[data-story="interlude-promised-walnuts"] .story-stage-space {transform:none;} .storybook-reader-stage[data-story="interlude-promised-walnuts"] .story-stage-name{font-size:12px;}}\n';
await writeFile("app/storybook/walnuts.css", css);
