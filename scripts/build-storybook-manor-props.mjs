import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/manor-display-props-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height);
if (parts.length !== 8) throw Error("Expected eight manor props");
const names = [
  "display-covered",
  "display-closed",
  "display-open",
  "display-cloth",
  "tower-stone",
  "tower-stone-bottom",
  "light-cloth",
  "case-key",
];
const commonCaseScale = 224 / parts[1].width;
const commonStoneScale = 224 / parts[4].width;
const metrics = [];
for (const [index, part] of parts.entries()) {
  const scale =
    index < 3
      ? commonCaseScale
      : index === 4 || index === 5
        ? commonStoneScale
        : Math.min(224 / part.width, 280 / part.height);
  const width = Math.round(part.width * scale),
    height = Math.round(part.height * scale);
  const left = Math.round((256 - width) / 2),
    top = 308 - height;
  if (left < 0 || top < 0 || left + width > 256) throw Error(`Clipped prop: ${names[index]}`);
  const input = await sharp(source)
    .extract({ left: part.left, top: part.top, width: part.width, height: part.height })
    .resize(width, height)
    .png()
    .toBuffer();
  await sharp({ create: { width: 256, height: 320, channels: 4, background: "#00000000" } })
    .composite([{ input, left, top }])
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${names[index]}-v1.webp`);
  metrics.push({ name: names[index], width, height, left, top, scale });
}
await writeFile(
  "public/storybook-study/manor-display-props-metrics.json",
  JSON.stringify(metrics, null, 2),
);
