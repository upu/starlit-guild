import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const background = path.join(root, "assets/source/social/x-card-background.webp");
const logo = path.join(root, "public/title/starlit-guild-logo.webp");
const output = path.join(root, "public/social/x-card.png");

const logoImage = await sharp(logo)
  .trim({ background: "#00000000", threshold: 10 })
  .resize({ width: 340 })
  .png()
  .toBuffer();

const card = await sharp(background)
  .resize(1200, 630, { fit: "cover" })
  .composite([{ input: logoImage, left: 12, top: 205 }])
  .png({ compressionLevel: 9 })
  .toBuffer();

if (process.argv.includes("--check")) {
  const existing = await readFile(output);
  if (!existing.equals(card)) {
    throw new Error(`${path.relative(root, output)} needs regeneration`);
  }
} else {
  await writeFile(output, card);
  console.log("Generated one 1200x630 Open Graph and X card image.");
}
