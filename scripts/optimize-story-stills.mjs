import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const digest = (data) => createHash("sha256").update(data).digest("hex");
const fileHash = (file) => (existsSync(file) ? digest(readFileSync(file)) : null);
const variants = ["detail", "thumbnail"];

async function generate(source, target, profile) {
  const temporary = `${target}.${randomUUID()}.tmp.webp`;
  try {
    await sharp(source)
      .rotate()
      .resize({
        width: profile.width,
        height: profile.height,
        fit: profile.fit,
        withoutEnlargement: true,
      })
      .webp({ quality: profile.quality, effort: 6 })
      .toFile(temporary);
    renameSync(temporary, target);
  } finally {
    rmSync(temporary, { force: true });
  }
}

export async function optimizeStoryStills({ base = root, check = false, log = console.log } = {}) {
  const sourceDir = path.join(base, "assets/source/stories");
  const outputDir = path.join(base, "public/stories");
  const manifestFile = path.join(base, "assets/story-stills.manifest.json");
  const lockFile = path.join(base, "assets/.story-stills.lock");
  const profiles = JSON.parse(readFileSync(path.join(base, "config/story-stills.json"), "utf8"));
  if (Object.keys(profiles).sort().join() !== variants.sort().join())
    throw Error("スチルの用途設定が不正です。");
  for (const profile of Object.values(profiles)) {
    if (
      !Number.isInteger(profile.width) ||
      profile.width < 1 ||
      !Number.isInteger(profile.height) ||
      profile.height < 1 ||
      !["inside", "cover"].includes(profile.fit) ||
      !Number.isInteger(profile.quality) ||
      profile.quality < 1 ||
      profile.quality > 100
    )
      throw Error("スチルのサイズ・品質設定が不正です。");
  }
  // The sharp version is left out so dependency updates alone don't regenerate committed images.
  // Bump `pipeline` when a conversion change should replace them.
  const profileHash = digest(JSON.stringify({ pipeline: 1, profiles }));
  const sources = readdirSync(sourceDir)
    .filter((name) => name !== "README.md")
    .sort();
  if (!sources.length || sources.some((name) => !/^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/.test(name)))
    throw Error("元スチルは英小文字・数字・ハイフンの PNG で配置してください。");
  const previous = existsSync(manifestFile)
    ? JSON.parse(readFileSync(manifestFile, "utf8"))
    : { version: 1, files: {} };
  if (
    previous.version !== 1 ||
    !previous.files ||
    Object.keys(previous.files).some((name) => !sources.includes(name))
  )
    throw Error("スチル manifest と元画像の対応が不正です。");
  let fd;
  if (!check) fd = openSync(lockFile, "wx");
  try {
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
          await generate(source, target, profiles[variant]);
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
    if (!check) {
      const temporary = `${manifestFile}.${randomUUID()}.tmp`;
      try {
        writeFileSync(temporary, JSON.stringify(manifest, null, 2) + "\n");
        renameSync(temporary, manifestFile);
      } finally {
        rmSync(temporary, { force: true });
      }
    }
    log(
      `スチル ${sources.length} 点・WebP ${sources.length * variants.length} ファイルを確認しました。`,
    );
    return manifest;
  } finally {
    if (fd !== undefined) {
      closeSync(fd);
      rmSync(lockFile, { force: true });
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await optimizeStoryStills({ check: process.argv.includes("--check") });
