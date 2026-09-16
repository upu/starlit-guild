import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  renameSync,
  rmSync,
  openSync,
  closeSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const hash = (data) => createHash("sha256").update(data).digest("hex");
const fileHash = (file) => (existsSync(file) ? hash(readFileSync(file)) : null);
const variants = ["thumbnail", "detail", "background"];

function readProfiles(base) {
  const profiles = JSON.parse(readFileSync(path.join(base, "config/scenery-images.json"), "utf8"));
  if (Object.keys(profiles).sort().join() !== [...variants].sort().join())
    throw Error("画像の用途設定が不正です。");
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
      throw Error("画像のサイズ・品質設定が不正です。");
  }
  return profiles;
}

async function generate(source, target, profile) {
  const temporary = target + "." + randomUUID() + ".tmp";
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

export async function optimizeScenery({ base = root, check = false, log = console.log } = {}) {
  const sourceDir = path.join(base, "assets/source/scenery"),
    outputDir = path.join(base, "public/scenery");
  const manifestFile = path.join(base, "assets/scenery.manifest.json"),
    lock = path.join(base, "assets/.scenery.lock");
  const profiles = readProfiles(base),
    profileHash = hash(JSON.stringify({ pipeline: 1, profiles, sharp: sharp.versions.sharp }));
  const sources = readdirSync(sourceDir, { withFileTypes: true }).filter(
    (entry) => entry.name !== "README.md",
  );
  if (!sources.length) throw Error("背景の元画像がありません。");
  if (sources.some((entry) => !entry.isFile() || !/^([a-z0-9]+-)*[a-z0-9]+\.png$/.test(entry.name)))
    throw Error("元画像は英小文字・数字・ハイフンのPNGで配置してください。");
  const previous = existsSync(manifestFile)
    ? JSON.parse(readFileSync(manifestFile, "utf8"))
    : { version: 1, files: {} };
  if (previous.version !== 1 || !previous.files) throw Error("画像manifestが不正です。");
  if (Object.keys(previous.files).some((name) => !sources.some((entry) => entry.name === name)))
    throw Error("元画像が削除されています。参照先とmanifestを確認してください。");
  let fd;
  if (!check) fd = openSync(lock, "wx");
  const manifest = { version: 1, files: {} };
  try {
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
          await generate(source, target, profiles[variant]);
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
    if (!check) {
      const temporary = manifestFile + "." + randomUUID() + ".tmp";
      try {
        writeFileSync(temporary, JSON.stringify(manifest, null, 2) + "\n");
        renameSync(temporary, manifestFile);
      } finally {
        rmSync(temporary, { force: true });
      }
    }
    log(
      `背景画像 ${sources.length} 点・${sources.length * variants.length} ファイルを確認しました。`,
    );
    return manifest;
  } finally {
    if (fd !== undefined) {
      closeSync(fd);
      rmSync(lock, { force: true });
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await optimizeScenery({ check: process.argv.includes("--check") });
}
