import { cp, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import type { Plugin } from "vite";
import { createMediaManifest, mediaDirectories } from "../scripts/media-manifest.mjs";

export function mediaAssets(): Plugin {
  let manifest = {};
  return {
    name: "starlit-media-assets",
    async config(_, environment) {
      const root = process.cwd();
      const publicRoot = resolve(root, "public");
      manifest = await createMediaManifest(publicRoot);
      await mkdir(resolve(root, ".sites-runtime"), { recursive: true });
      await writeFile(
        resolve(root, ".sites-runtime/media-manifest.json"),
        JSON.stringify(manifest),
      );
      if (environment.command !== "build") return;
      // A new directory per build avoids deleting a concurrent build's public tree.
      const staging = await mkdtemp(resolve(root, ".sites-runtime/public-"));
      await cp(publicRoot, staging, {
        recursive: true,
        filter: (source) => !mediaDirectories.has(relative(publicRoot, source).split(/[\\/]/)[0]),
      });
      return { publicDir: staging };
    },
    resolveId(id) {
      if (id === "virtual:starlit-media") return "\0virtual:starlit-media";
    },
    load(id) {
      if (id === "\0virtual:starlit-media") return `export default ${JSON.stringify(manifest)}`;
    },
  };
}
