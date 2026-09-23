import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const background = path.join(root, "assets/source/social/x-card-background.png");
const logo = path.join(root, "public/title/starlit-guild-logo.webp");
const outputs = ["app/opengraph-image.png", "app/twitter-image.png"].map((file) =>
  path.join(root, file),
);

const logoImage = await sharp(logo)
  .trim({ background: "#00000000", threshold: 10 })
  .resize({ width: 300 })
  .png()
  .toBuffer();

const shade = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="shade"><stop stop-color="#10243c" stop-opacity=".99"/>
    <stop offset=".25" stop-color="#10243c" stop-opacity=".99"/>
    <stop offset=".32" stop-color="#10243c" stop-opacity=".4"/>
    <stop offset=".36" stop-color="#10243c" stop-opacity="0"/></linearGradient></defs>
  <path fill="url(#shade)" d="M0 0h1200v630H0z"/>
</svg>`);

const card = await sharp(background)
  .resize(1200, 630, { fit: "cover" })
  .composite([
    { input: shade, left: 0, top: 0 },
    { input: logoImage, left: 12, top: 205 },
  ])
  .png({ compressionLevel: 9 })
  .toBuffer();

if (process.argv.includes("--check")) {
  for (const output of outputs) {
    const existing = await readFile(output);
    if (!existing.equals(card)) {
      throw new Error(`${path.relative(root, output)} needs regeneration`);
    }
  }
} else {
  await Promise.all(outputs.map((output) => writeFile(output, card)));
  console.log("Generated 1200x630 Open Graph and X card images.");
}
