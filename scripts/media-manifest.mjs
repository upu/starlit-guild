import { createHash } from "node:crypto";
import { readdir, readFile, lstat } from "node:fs/promises";
import path from "node:path";

export const mediaDirectories = new Set([
  "storybook-study",
  "story-stage",
  "animations",
  "portraits",
  "stories",
  "characters",
  "guild",
  "scenery",
  "home-pixel",
  "adventure-enemies",
  "adventure-pixel",
  "music",
  "items",
]);
const contentTypes = {
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".json": "application/json",
};

async function walk(root, relative, entries) {
  for (const name of (await readdir(path.join(root, relative))).sort()) {
    const file = path.posix.join(relative, name);
    const stat = await lstat(path.join(root, file));
    if (stat.isSymbolicLink()) throw new Error(`Media symlink is not supported: ${file}`);
    if (stat.isDirectory()) await walk(root, file, entries);
    else {
      const type = contentTypes[path.extname(file)];
      if (!type) throw new Error(`Unknown media type: ${file}`);
      const bytes = await readFile(path.join(root, file));
      if (!bytes.length || bytes.length > 64 * 1024 * 1024)
        throw new Error(`Media must be between 1 byte and 64 MiB: ${file}`);
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      entries[`/${file}`] = {
        key: `media/${sha256}${path.extname(file)}`,
        sha256,
        size: bytes.length,
        type,
      };
    }
  }
}

export async function createMediaManifest(publicDirectory) {
  const entries = {};
  for (const directory of [...mediaDirectories].sort()) {
    await walk(publicDirectory, directory, entries);
  }
  return entries;
}
