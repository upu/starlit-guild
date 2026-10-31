import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/tea-kit-v1.png";
const metrics = {};
const cells = [
  ["medicine-closed", 0, 0, 512, 600],
  ["medicine", 512, 0, 512, 600],
  ["kettle", 1024, 0, 512, 600],
  ["teapot", 0, 600, 512, 424],
  ["teapot-open", 512, 600, 576, 424],
  ["empty-cup", 1088, 600, 448, 424],
];
for (const [name, left, top, width, height] of cells) {
  const crop = await sharp(source).extract({ left, top, width, height }).png().toBuffer();
  const { data, info } = await sharp(crop)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // The loose teapot lid is a separate component; its closed state already draws it.
  const [bounds] = spriteBounds(data, info.width, info.height, { count: 1, columns: 1, rows: 1 });
  const box = name.startsWith("medicine");
  const targetWidth = box ? 220 : 240;
  const targetHeight = Math.round((bounds.height * targetWidth) / bounds.width);
  const canvasHeight = 260;
  if (targetHeight > canvasHeight) throw Error(`Tea prop exceeds cell: ${name}`);
  const input = await sharp(crop)
    .extract({ left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height })
    .resize(targetWidth, targetHeight)
    .png()
    .toBuffer();
  await sharp({
    create: { width: 256, height: canvasHeight, channels: 4, background: "#00000000" },
  })
    .composite([
      { input, left: Math.round((256 - targetWidth) / 2), top: canvasHeight - targetHeight },
    ])
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}-v1.webp`);
  metrics[name] = { width: targetWidth, height: targetHeight, foot: canvasHeight };
}
await writeFile("public/storybook-study/tea-kit-metrics.json", JSON.stringify(metrics, null, 2));
