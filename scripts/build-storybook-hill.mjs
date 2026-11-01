import sharp from "sharp";
import { copyFile } from "node:fs/promises";

// Backgrounds stay pixel-identical; only the transparent landmark is cropped and packed.
for (const name of ["hill-lane-loop-v1", "hill-night-lane-loop-v1"])
  await copyFile(`assets/source/storybook/${name}.png`, `public/storybook-study/${name}.png`);
await sharp("assets/source/storybook/hill-tower-landmark-v1.png")
  .trim()
  .resize({ width: 512 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/hill-tower-landmark-v1.webp");
console.log("Hill day/night ground and tower landmark packed.");
