import sharp from "sharp";
import { readFile } from "node:fs/promises";

export async function keystoneAssets(root, emit) {
  for (const name of [
    "berne-foundation-grass",
    "berne-foundation-open",
    "berne-foundation-restored",
  ]) {
    const raw = await readFile(new URL(`assets/source/story-stage/${name}-v1.png`, root));
    await emit(name, raw, await sharp(raw).resize(960).webp({ lossless: true }).toBuffer());
  }
}
