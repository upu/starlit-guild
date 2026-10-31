import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

// Single-pose sources share the same 1024px-wide drawing scale.
// Anchor to the head rather than the cape's bounding-box centre.
const metrics = [];
for (const pose of [
  "contact-a-v1",
  "contact-b-v1",
  "contact-b-v2",
  "pass-b-v2",
  "pass-b-v3",
  "pass-a-v1",
]) {
  const source = `assets/source/storybook/leon-${pose}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.width !== 1024) throw Error("Contact source scale changed");
  const bounds = spriteBounds(data, info.width, info.height).sort((a, b) => b.area - a.area)[0];
  const { left, top, width, height } = bounds;
  const scale = 0.1;
  const w = Math.round(width * scale),
    h = Math.round(height * scale);
  metrics.push({ pose, scale, width: w, height: h, top: 176 - h, baseline: 176 });
  const input = await sharp(source)
    .extract({ left, top, width, height })
    .resize(w, h)
    .png()
    .toBuffer();
  await sharp({ create: { width: 192, height: 192, channels: 4, background: "#00000000" } })
    .composite([{ input, left: Math.round(96 + (left - 620) * scale), top: 176 - h }])
    .webp({ lossless: true })
    .toFile(`public/storybook-study/leon-${pose}.webp`);
}
await writeFile("public/storybook-study/contact-metrics.json", JSON.stringify(metrics, null, 2));

// Reuse the registered cells unchanged: no per-frame resizing during travel.
const walking = ["contact-a-v1", "pass-a-v1", "contact-b-v2", "pass-b-v3"];
await sharp({ create: { width: 768, height: 192, channels: 4, background: "#00000000" } })
  .composite(
    walking.map((pose, index) => ({
      input: `public/storybook-study/leon-${pose}.webp`,
      left: index * 192,
      top: 0,
    })),
  )
  .webp({ lossless: true })
  .toFile("public/storybook-study/leon-walk-v1.webp");
