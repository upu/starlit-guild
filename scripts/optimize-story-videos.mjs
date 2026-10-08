import { randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import {
  digest,
  fileHash,
  projectRoot,
  runAsScript,
  withLock,
  writeManifest,
} from "./asset-pipeline.mjs";
import { encodeVideo, findTool } from "./story-video-tools.mjs";

const sourcePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(mp4|mov|webm|mkv)$/;

function regular(file) {
  if (!existsSync(file)) return false;
  if (!lstatSync(file).isFile() || lstatSync(file).isSymbolicLink())
    throw new Error(`通常ファイルを使用してください: ${file}`);
  return true;
}

function directory(dir) {
  mkdirSync(dir, { recursive: true });
  if (lstatSync(dir).isSymbolicLink() || !lstatSync(dir).isDirectory())
    throw new Error(`通常フォルダーを使用してください: ${dir}`);
}

function readProfile(base) {
  const p = JSON.parse(readFileSync(path.join(base, "config/story-video.json"), "utf8"));
  if (
    typeof p.id !== "string" ||
    !Number.isInteger(p.crf) ||
    p.crf < 0 ||
    p.crf > 51 ||
    !["slow", "medium", "fast", "veryslow"].includes(p.preset)
  )
    throw new Error("動画圧縮設定が不正です。");
  for (const key of ["maxWidth", "maxHeight", "maxFps"]) {
    if (!Number.isInteger(p[key]) || p[key] < 2)
      throw new Error(`動画圧縮設定 ${key} が不正です。`);
  }
  if (p.maxWidth % 2 || p.maxHeight % 2) throw new Error("解像度の上限は偶数にしてください。");
  return p;
}

function inputs(dir) {
  const files = [];
  const names = new Set();
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (entry.name === "README.md" || entry.name === ".gitkeep") continue;
    if (!entry.isFile() || !sourcePattern.test(entry.name))
      throw new Error(
        `元動画は英小文字・数字・ハイフンの名前で直下に置いてください: ${entry.name}`,
      );
    const target = entry.name.replace(/\.[^.]+$/, ".mp4");
    if (names.has(target)) throw new Error(`出力名が重複しています: ${target}`);
    names.add(target);
    files.push({ name: entry.name, target });
  }
  return files;
}

function readManifest(file) {
  if (!regular(file)) return { schemaVersion: 1, files: {} };
  const m = JSON.parse(readFileSync(file, "utf8"));
  if (m.schemaVersion !== 1 || !m.files || typeof m.files !== "object" || Array.isArray(m.files))
    throw new Error("動画manifestが不正です。");
  for (const name of Object.keys(m.files))
    if (!sourcePattern.test(name)) throw new Error("動画manifestのファイル名が不正です。");
  return m;
}

function refreshVideo({ source, target, previous, profile, profileHash, sourceHash, encode }) {
  if (regular(target) && !previous)
    throw new Error(`管理対象外の動画を上書きできません: ${target}`);
  const temporary = path.join(path.dirname(target), `.video-${randomUUID()}.mp4`);
  try {
    const media = encode(source, temporary, profile);
    if (fileHash(source) !== sourceHash)
      throw new Error("処理中に元動画が変わりました。もう一度実行してください。");
    const outputHash = fileHash(temporary),
      outputSize = lstatSync(temporary).size;
    renameSync(temporary, target);
    return {
      sourceHash,
      profileHash,
      outputHash,
      sourceSize: lstatSync(source).size,
      outputSize,
      media,
    };
  } finally {
    rmSync(temporary, { force: true });
  }
}

// The root/encoder arguments also let tests exercise invalidation without external binaries.
export function optimizeStoryVideos({
  base = projectRoot,
  check = false,
  encode,
  log = console.log,
} = {}) {
  const inputDir = path.join(base, "assets/source/story-videos"),
    outputDir = path.join(base, "public/stories/videos");
  const manifestFile = path.join(base, "assets/story-videos.manifest.json");
  directory(path.join(base, "assets"));
  directory(path.join(base, "assets/source"));
  directory(inputDir);
  directory(path.join(base, "public"));
  directory(path.join(base, "public/stories"));
  directory(outputDir);
  const lock = path.join(base, "assets/.story-videos.lock");
  const busy = "動画処理が実行中です。停止済みなら assets/.story-videos.lock を削除してください。";
  return withLock(
    lock,
    true,
    () => {
      const profile = readProfile(base),
        manifest = readManifest(manifestFile),
        files = inputs(inputDir);
      const profileHash = digest(JSON.stringify({ pipeline: 1, profile }));
      const missing = Object.keys(manifest.files).filter(
        (name) => !files.some((f) => f.name === name),
      );
      if (missing.length)
        throw new Error(
          `元動画がありません: ${missing.join(", ")}。削除する場合は対応する配信用MP4とmanifestの項目も削除してください。`,
        );
      let converted = 0,
        skipped = 0;
      for (const file of files) {
        const source = path.join(inputDir, file.name),
          target = path.join(outputDir, file.target);
        const sourceHash = fileHash(source),
          previous = manifest.files[file.name];
        const current =
          previous?.sourceHash === sourceHash &&
          previous?.profileHash === profileHash &&
          regular(target) &&
          previous.outputHash === fileHash(target);
        if (current) {
          skipped++;
          log(`skip ${file.name}`);
          continue;
        }
        if (check)
          throw new Error(
            `${file.name}: 配信用動画が未生成か古い状態です。npm run videos:optimize を実行してください。`,
          );
        encode ??= (
          (ffmpeg, ffprobe) => (src, dst, p) =>
            encodeVideo(src, dst, p, ffmpeg, ffprobe)
        )(findTool("ffmpeg"), findTool("ffprobe"));
        manifest.files[file.name] = refreshVideo({
          source,
          target,
          previous,
          profile,
          profileHash,
          sourceHash,
          encode,
        });
        writeManifest(manifestFile, manifest);
        const result = manifest.files[file.name];
        converted++;
        log(`encode ${file.name}: ${result.sourceSize} → ${result.outputSize} bytes`);
      }
      log(`story videos: ${converted} generated, ${skipped} unchanged`);
      return { converted, skipped };
    },
    busy,
  );
}

if (runAsScript(import.meta.url)) {
  try {
    if (process.argv.slice(2).some((arg) => arg !== "--check"))
      throw new Error("Usage: node scripts/optimize-story-videos.mjs [--check]");
    optimizeStoryVideos({ check: process.argv.includes("--check") });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
