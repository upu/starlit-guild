// Shared steps of the asset generators: hashing, manifests, locks and replacing files safely.
import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

export const projectRoot = fileURLToPath(new URL("../", import.meta.url));
export const digest = (data) => createHash("sha256").update(data).digest("hex");
export const fileHash = (file) => (existsSync(file) ? digest(readFileSync(file)) : null);
export const runAsScript = (moduleUrl) =>
  !!process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(moduleUrl);

export function readManifest(file, empty) {
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : empty;
}

// Writes go to a temporary sibling first, so an interrupted run never leaves half a file.
// `suffix` keeps the extension a converter needs to pick its output format.
export function replaceFileSync(target, write, suffix = ".tmp") {
  const temporary = `${target}.${randomUUID()}${suffix}`;
  try {
    write(temporary);
    renameSync(temporary, target);
  } finally {
    rmSync(temporary, { force: true });
  }
}
export async function replaceFile(target, write, suffix = ".tmp") {
  const temporary = `${target}.${randomUUID()}${suffix}`;
  try {
    await write(temporary);
    renameSync(temporary, target);
  } finally {
    rmSync(temporary, { force: true });
  }
}
export function writeManifest(file, manifest) {
  replaceFileSync(file, (temporary) =>
    writeFileSync(temporary, JSON.stringify(manifest, null, 2) + "\n", { flag: "wx" }),
  );
}

// A lock file keeps two generating runs from interleaving writes; checks only read, so they skip
// it. The task may be synchronous or return a promise; the lock is held until it settles.
export function withLock(lockFile, enabled, task, busyMessage) {
  let fd;
  try {
    if (enabled) fd = openSync(lockFile, "wx");
  } catch (error) {
    if (busyMessage && error.code === "EEXIST") throw new Error(busyMessage);
    throw error;
  }
  const release = () => {
    if (fd === undefined) return;
    closeSync(fd);
    rmSync(lockFile, { force: true });
  };
  let result;
  try {
    result = task();
  } catch (error) {
    release();
    throw error;
  }
  if (result instanceof Promise) return result.finally(release);
  release();
  return result;
}

// Image profiles are { variant: { width, height, fit, quality } } with exactly the given variants.
export function readImageProfiles(file, variants, label) {
  const profiles = JSON.parse(readFileSync(file, "utf8"));
  if (Object.keys(profiles).sort().join() !== [...variants].sort().join())
    throw Error(`${label}の用途設定が不正です。`);
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
      throw Error(`${label}のサイズ・品質設定が不正です。`);
  }
  return profiles;
}

export function resizeToWebp(source, target, profile) {
  return replaceFile(target, (temporary) =>
    sharp(source)
      .rotate()
      .resize({
        width: profile.width,
        height: profile.height,
        fit: profile.fit,
        withoutEnlargement: true,
      })
      .webp({ quality: profile.quality, effort: 6 })
      .toFile(temporary),
  );
}
