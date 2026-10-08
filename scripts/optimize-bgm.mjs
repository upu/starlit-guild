import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  digest,
  fileHash,
  projectRoot,
  readManifest,
  replaceFileSync,
  runAsScript,
  withLock,
  writeManifest,
} from "./asset-pipeline.mjs";
import { findTool } from "./story-video-tools.mjs";

const tracks = ["camp", "journey"];
// Both 40s and 48s are whole AAC frames at 48 kHz; this avoids padding at the loop seam.
const profileHash = digest("aac-mono-48000hz-96k-pipeline-1");

function encode(source, target, ffmpeg) {
  // The extension tells ffmpeg to write an M4A container.
  replaceFileSync(
    target,
    (temporary) => {
      const result = spawnSync(
        ffmpeg,
        [
          "-hide_banner",
          "-loglevel",
          "error",
          "-y",
          "-i",
          source,
          "-vn",
          "-c:a",
          "aac",
          "-b:a",
          "96k",
          "-ar",
          "48000",
          "-ac",
          "1",
          "-movflags",
          "+faststart",
          temporary,
        ],
        { encoding: "utf8", windowsHide: true },
      );
      if (result.error) throw result.error;
      if (result.status !== 0) throw Error(`BGM の変換に失敗しました: ${result.stderr}`);
    },
    ".tmp.m4a",
  );
}

export function optimizeBgm({ base = projectRoot, check = false, log = console.log, ffmpeg } = {}) {
  const manifestFile = path.join(base, "assets/bgm.manifest.json");
  const lockFile = path.join(base, "assets/.bgm.lock");
  const previous = readManifest(manifestFile, { version: 1, files: {} });
  if (
    previous.version !== 1 ||
    !previous.files ||
    Object.keys(previous.files).some((name) => !tracks.includes(name))
  )
    throw Error("BGM manifest が不正です。");
  return withLock(lockFile, !check, () => {
    if (!check) mkdirSync(path.join(base, "public/music"), { recursive: true });
    const manifest = { version: 1, files: {} };
    for (const name of tracks) {
      const source = path.join(base, "assets/source/music", `${name}.wav`);
      const target = path.join(base, "public/music", `${name}.m4a`);
      const sourceHash = fileHash(source);
      if (!sourceHash) throw Error(`BGM の元 WAV がありません: ${name}`);
      const fresh =
        previous.files[name]?.sourceHash === sourceHash &&
        previous.files[name]?.profileHash === profileHash &&
        previous.files[name]?.outputHash === fileHash(target);
      if (!fresh) {
        if (check)
          throw Error(
            `生成 BGM が未更新です: ${name}。npm run music:optimize を実行してください。`,
          );
        ffmpeg ??= findTool("ffmpeg");
        encode(source, target, ffmpeg);
        log(`生成: ${path.relative(base, target)}`);
      }
      if (fileHash(source) !== sourceHash) throw Error("生成中に元 BGM が変更されました。");
      manifest.files[name] = {
        sourceHash,
        sourceBytes: readFileSync(source).length,
        profileHash,
        outputHash: fileHash(target),
        outputBytes: readFileSync(target).length,
      };
    }
    if (!check) writeManifest(manifestFile, manifest);
    log(`BGM ${tracks.length} 曲を確認しました。`);
    return manifest;
  });
}

if (runAsScript(import.meta.url)) optimizeBgm({ check: process.argv.includes("--check") });
