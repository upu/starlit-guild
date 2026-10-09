import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const root = new URL("../", import.meta.url);
const output = new URL("public/story-stage/", root);
const check = process.argv.includes("--check");
const manifest = {};
await mkdir(output, { recursive: true });
for (const [name, width] of [
  ["meeting-path", 960],
  ["loaded-cart", 420],
  ["travel-bundle", 144],
]) {
  const source = await readFile(new URL(`assets/source/story-stage/${name}-v1.png`, root));
  const image = await sharp(source)
    .resize({ width, kernel: "lanczos3" })
    .webp({ lossless: true })
    .toBuffer();
  const path = new URL(`${name}.webp`, output);
  if (check) {
    if (!(await readFile(path)).equals(image)) throw Error(`Stale story stage art: ${name}`);
  } else await writeFile(path, image);
  manifest[name] = {
    source: createHash("sha256").update(source).digest("hex"),
    output: createHash("sha256").update(image).digest("hex"),
  };
}
const serialized = JSON.stringify(manifest, null, 2) + "\n";
const manifestPath = new URL("manifest.json", output);
if (check) {
  if ((await readFile(manifestPath, "utf8")).replaceAll("\r\n", "\n") !== serialized)
    throw Error("Stale story stage manifest");
} else await writeFile(manifestPath, serialized);
console.log("Story stage art: verified background, loaded cart, and travel bundle");
