import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { storyArt, storyThumbnail } from "../lib/story-art.ts";

const root = new URL("../public/", import.meta.url);
const check = process.argv.includes("--check");
if (!check) await mkdir(new URL("stories/thumbnails/", root), { recursive: true });
let sourceBytes = 0,
  thumbnailBytes = 0;
const images = [...new Map(Object.values(storyArt).map((art) => [art.src, art])).values()];
for (const art of images) {
  const source = await readFile(new URL(art.src.slice(1), root));
  const target = new URL(storyThumbnail(art).slice(1), root);
  const output = await sharp(source)
    .rotate()
    .resize(320, 320, { fit: "cover", position: "centre" })
    .webp({ quality: 74, effort: 6 })
    .toBuffer();
  const previous = await readFile(target).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!previous?.equals(output)) {
    if (check)
      throw new Error(
        `サムネイルが未更新です: ${art.src}。npm run thumbnails:optimize を実行してください。`,
      );
    await writeFile(target, output);
  }
  sourceBytes += source.length;
  thumbnailBytes += output.length;
}
console.log(
  `アルバム ${images.length} 点: 元画像 ${sourceBytes} bytes → サムネイル ${thumbnailBytes} bytes`,
);
