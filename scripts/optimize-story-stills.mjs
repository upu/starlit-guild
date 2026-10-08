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

const variants = ["detail", "thumbnail"];

export async function optimizeStoryStills({
  base = projectRoot,
  check = false,
  log = console.log,
} = {}) {
  const sourceDir = path.join(base, "assets/source/stories");
  const outputDir = path.join(base, "public/stories");
  const manifestFile = path.join(base, "assets/story-stills.manifest.json");
  const lockFile = path.join(base, "assets/.story-stills.lock");
  const profiles = readImageProfiles(
    path.join(base, "config/story-stills.json"),
    variants,
    "スチル",
  );
  // The sharp version is left out so dependency updates alone don't regenerate committed images.
  // Bump `pipeline` when a conversion change should replace them.
  const profileHash = digest(JSON.stringify({ pipeline: 1, profiles }));
  const sources = readdirSync(sourceDir)
    .filter((name) => name !== "README.md")
    .sort();
  if (!sources.length || sources.some((name) => !/^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/.test(name)))
    throw Error("元スチルは英小文字・数字・ハイフンの PNG で配置してください。");
  const previous = readManifest(manifestFile, { version: 1, files: {} });
  if (
    previous.version !== 1 ||
    !previous.files ||
    Object.keys(previous.files).some((name) => !sources.includes(name))
  )
    throw Error("スチル manifest と元画像の対応が不正です。");
  return withLock(lockFile, !check, async () => {
    if (!check) {
      mkdirSync(outputDir, { recursive: true });
      mkdirSync(path.join(outputDir, "thumbnails"), { recursive: true });
    }
    const manifest = { version: 1, files: {} };
    for (const name of sources) {
      const source = path.join(sourceDir, name);
      const sourceHash = fileHash(source);
      const outputs = {};
      for (const variant of variants) {
        const target = path.join(
          outputDir,
          variant === "thumbnail" ? "thumbnails" : "",
          name.replace(/\.png$/, ".webp"),
        );
        const fresh =
          previous.files[name]?.sourceHash === sourceHash &&
          previous.files[name]?.profileHash === profileHash &&
          previous.files[name]?.outputs?.[variant]?.hash === fileHash(target);
        if (!fresh) {
          if (check)
            throw Error(
              `生成スチルが未更新です: ${name} (${variant})。npm run stills:optimize を実行してください。`,
            );
          await resizeToWebp(source, target, profiles[variant]);
          log(`生成: ${path.relative(base, target)}`);
        }
        outputs[variant] = { hash: fileHash(target), bytes: readFileSync(target).length };
      }
      if (fileHash(source) !== sourceHash) throw Error("生成中に元スチルが変更されました。");
      manifest.files[name] = {
        sourceHash,
        sourceBytes: readFileSync(source).length,
        profileHash,
        outputs,
      };
    }
    if (!check) writeManifest(manifestFile, manifest);
    log(
      `スチル ${sources.length} 点・WebP ${sources.length * variants.length} ファイルを確認しました。`,
    );
    return manifest;
  });
}

if (runAsScript(import.meta.url))
  await optimizeStoryStills({ check: process.argv.includes("--check") });
