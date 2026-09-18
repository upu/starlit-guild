import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findTool } from "./story-video-tools.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const tracks = ["camp", "journey"];
const digest = (data) => createHash("sha256").update(data).digest("hex");
const fileHash = (file) => (existsSync(file) ? digest(readFileSync(file)) : null);
// Both 40s and 48s are whole AAC frames at 48 kHz; this avoids padding at the loop seam.
const profileHash = digest("aac-mono-48000hz-96k-pipeline-1");

function encode(source, target, ffmpeg) {
  const temporary = `${target}.${randomUUID()}.tmp.m4a`;
  try {
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
    renameSync(temporary, target);
  } finally {
    rmSync(temporary, { force: true });
  }
}

export function optimizeBgm({ base = root, check = false, log = console.log, ffmpeg } = {}) {
  const manifestFile = path.join(base, "assets/bgm.manifest.json");
  const lockFile = path.join(base, "assets/.bgm.lock");
  const previous = existsSync(manifestFile)
    ? JSON.parse(readFileSync(manifestFile, "utf8"))
    : { version: 1, files: {} };
  if (
    previous.version !== 1 ||
    !previous.files ||
    Object.keys(previous.files).some((name) => !tracks.includes(name))
  )
    throw Error("BGM manifest が不正です。");
  let fd;
  if (!check) fd = openSync(lockFile, "wx");
  try {
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
    if (!check) {
      const temporary = `${manifestFile}.${randomUUID()}.tmp`;
      try {
        writeFileSync(temporary, JSON.stringify(manifest, null, 2) + "\n");
        renameSync(temporary, manifestFile);
      } finally {
        rmSync(temporary, { force: true });
      }
    }
    log(`BGM ${tracks.length} 曲を確認しました。`);
    return manifest;
  } finally {
    if (fd !== undefined) {
      closeSync(fd);
      rmSync(lockFile, { force: true });
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  optimizeBgm({ check: process.argv.includes("--check") });
