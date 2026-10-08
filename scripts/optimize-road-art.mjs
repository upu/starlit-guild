import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
  digest,
  fileHash,
  projectRoot,
  readManifest,
  replaceFile,
  runAsScript,
  writeManifest,
} from "./asset-pipeline.mjs";

// Preserve atlas dimensions, alpha and visible pixels; no resizing or lossy edges.
const profile = { lossless: true, effort: 6 };
// The sharp version is left out so dependency updates alone don't regenerate committed images.
// Bump `pipeline` when a conversion change should replace them.
const profileHash = digest(JSON.stringify({ pipeline: 1, profile }));

export async function optimizeRoadArt({
  base = projectRoot,
  check = false,
  log = console.log,
} = {}) {
  const sourceDir = path.join(base, "assets/source/road"),
    outputDir = path.join(base, "public/animations/road"),
    manifestFile = path.join(base, "assets/road-art.manifest.json");
  const names = readdirSync(sourceDir)
    .filter((name) => name !== "README.md")
    .sort();
  if (!names.length || names.some((name) => !/^[a-z0-9-]+\.png$/.test(name)))
    throw Error("横スクロール画像の原本はPNGで配置してください。");
  const previous = readManifest(manifestFile, { files: {} });
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
      await replaceFile(target, (temporary) => sharp(source).webp(profile).toFile(temporary));
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
  if (!check) writeManifest(manifestFile, manifest);
  log(`横スクロール画像 ${names.length} 点を確認しました。`);
  return manifest;
}

if (runAsScript(import.meta.url))
  await optimizeRoadArt({ check: process.argv.includes("--check") });
