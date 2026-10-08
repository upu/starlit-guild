import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  digest,
  fileHash,
  projectRoot,
  readImageProfiles,
  readManifest,
  resizeToWebp,
  runAsScript,
  withLock,
  writeManifest,
} from "./asset-pipeline.mjs";

const variants = ["thumbnail", "detail", "background"];

export async function optimizeScenery({
  base = projectRoot,
  check = false,
  log = console.log,
} = {}) {
  const sourceDir = path.join(base, "assets/source/scenery"),
    outputDir = path.join(base, "public/scenery");
  const manifestFile = path.join(base, "assets/scenery.manifest.json"),
    lock = path.join(base, "assets/.scenery.lock");
  // The sharp version is left out so dependency updates alone don't regenerate committed images.
  // Bump `pipeline` when a conversion change should replace them.
  const profiles = readImageProfiles(
      path.join(base, "config/scenery-images.json"),
      variants,
      "画像",
    ),
    profileHash = digest(JSON.stringify({ pipeline: 1, profiles }));
  const sources = readdirSync(sourceDir, { withFileTypes: true }).filter(
    (entry) => entry.name !== "README.md",
  );
  if (!sources.length) throw Error("背景の元画像がありません。");
  if (sources.some((entry) => !entry.isFile() || !/^([a-z0-9]+-)*[a-z0-9]+\.png$/.test(entry.name)))
    throw Error("元画像は英小文字・数字・ハイフンのPNGで配置してください。");
  const previous = readManifest(manifestFile, { version: 1, files: {} });
  if (previous.version !== 1 || !previous.files) throw Error("画像manifestが不正です。");
  if (Object.keys(previous.files).some((name) => !sources.some((entry) => entry.name === name)))
    throw Error("元画像が削除されています。参照先とmanifestを確認してください。");
  return withLock(lock, !check, async () => {
    const manifest = { version: 1, files: {} };
    if (!check) mkdirSync(outputDir, { recursive: true });
    for (const { name } of sources.sort((a, b) => a.name.localeCompare(b.name))) {
      const source = path.join(sourceDir, name),
        sourceHash = fileHash(source),
        outputs = {};
      for (const variant of variants) {
        const target = path.join(outputDir, name.replace(".png", `-${variant}.webp`));
        const saved = previous.files[name];
        const fresh =
          saved?.sourceHash === sourceHash &&
          saved.profileHash === profileHash &&
          saved.outputs[variant]?.hash === fileHash(target);
        if (!fresh) {
          if (check)
            throw Error(
              `生成画像が未更新です: ${name} (${variant})。npm run images:optimize を実行してください。`,
            );
          await resizeToWebp(source, target, profiles[variant]);
          log(`生成: ${path.basename(target)}`);
        }
        outputs[variant] = { hash: fileHash(target), bytes: readFileSync(target).length };
      }
      if (fileHash(source) !== sourceHash)
        throw Error("生成中に元画像が変更されました。再実行してください。");
      manifest.files[name] = {
        sourceHash,
        profileHash,
        sourceBytes: readFileSync(source).length,
        outputs,
      };
    }
    if (!check) writeManifest(manifestFile, manifest);
    log(
      `背景画像 ${sources.length} 点・${sources.length * variants.length} ファイルを確認しました。`,
    );
    return manifest;
  });
}

if (runAsScript(import.meta.url))
  await optimizeScenery({ check: process.argv.includes("--check") });
