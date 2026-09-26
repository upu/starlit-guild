import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const hash = (data) => createHash("sha256").update(data).digest("hex");
const fileHash = (file) => (existsSync(file) ? hash(readFileSync(file)) : null);
// Preserve atlas dimensions, alpha and visible pixels; no resizing or lossy edges.
const profile = { lossless: true, effort: 6 };
// The sharp version is left out so dependency updates alone don't regenerate committed images.
// Bump `pipeline` when a conversion change should replace them.
const profileHash = hash(JSON.stringify({ pipeline: 1, profile }));

export async function optimizeRoadArt({ base = root, check = false, log = console.log } = {}) {
  const sourceDir = path.join(base, "assets/source/road"),
    outputDir = path.join(base, "public/animations/road"),
    manifestFile = path.join(base, "assets/road-art.manifest.json");
  const names = readdirSync(sourceDir)
    .filter((name) => name !== "README.md")
    .sort();
  if (!names.length || names.some((name) => !/^[a-z0-9-]+\.png$/.test(name)))
    throw Error("横スクロール画像の原本はPNGで配置してください。");
  const previous = existsSync(manifestFile)
    ? JSON.parse(readFileSync(manifestFile, "utf8"))
    : { files: {} };
  const expected = names.map((name) => name.replace(/\.png$/, ".webp"));
  if (existsSync(outputDir) && readdirSync(outputDir).some((name) => !expected.includes(name)))
    throw Error("配信フォルダーに余分な画像があります。参照先と原本を確認してください。");
  if (!check) mkdirSync(outputDir, { recursive: true });
  const manifest = { version: 1, files: {} };
  for (const name of names) {
    const source = path.join(sourceDir, name),
      output = name.replace(/\.png$/, ".webp"),
      target = path.join(outputDir, output),
      sourceHash = fileHash(source),
      saved = previous.files[name];
    const fresh =
      saved?.sourceHash === sourceHash &&
      saved.profileHash === profileHash &&
      saved.outputHash === fileHash(target);
    if (!fresh) {
      if (check)
        throw Error(
          `生成画像が未更新です: ${name}。npm run road-art:optimize を実行してください。`,
        );
      const temporary = target + ".tmp";
      try {
        await sharp(source).webp(profile).toFile(temporary);
        renameSync(temporary, target);
      } finally {
        rmSync(temporary, { force: true });
      }
    }
    manifest.files[name] = {
      sourceHash,
      profileHash,
      output,
      outputHash: fileHash(target),
      sourceBytes: readFileSync(source).length,
      outputBytes: readFileSync(target).length,
    };
  }
  if (!check) writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
  log(`横スクロール画像 ${names.length} 点を確認しました。`);
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await optimizeRoadArt({ check: process.argv.includes("--check") });
