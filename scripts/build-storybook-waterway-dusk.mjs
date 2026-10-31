import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
const name = process.argv[2] ?? "drain-cleared-dusk-v1";
if (!["drain-cleared-dusk-v1", "drain-inspection-dusk-v1"].includes(name))
  throw new Error(`Unknown dusk view: ${name}`);
const source = `assets/source/storybook/${name}.png`;
const output = `public/storybook-study/${name}.png`;
const bytes = await readFile(source),
  meta = await sharp(bytes).metadata();
if (meta.width !== 1536 || meta.height !== 1024)
  throw new Error("Expected the approved 3:2 composition");
await sharp(bytes).png({ compressionLevel: 9 }).toFile(output);
const out = await readFile(output);
console.log(
  JSON.stringify(
    {
      source,
      output,
      width: meta.width,
      height: meta.height,
      sourceSha256: createHash("sha256").update(bytes).digest("hex"),
      outputSha256: createHash("sha256").update(out).digest("hex"),
    },
    null,
    2,
  ),
);
