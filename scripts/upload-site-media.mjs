import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

export async function uploadMedia({ origin, manifest, publicDirectory, headers, fetcher = fetch }) {
  const entries = Object.entries(manifest);
  const report = { uploaded: 0, skipped: 0, bytes: 0 };
  let cursor = 0;
  async function transfer() {
    while (cursor < entries.length) {
      const [assetPath, entry] = entries[cursor++];
      const url = new URL("/api/media-import", origin);
      url.searchParams.set("key", entry.key);
      const requestHeaders = { ...headers, "X-Asset-Size": String(entry.size) };
      const existing = await fetcher(url, {
        method: "HEAD",
        headers: requestHeaders,
        redirect: "error",
      });
      if (existing.status === 200) {
        report.skipped++;
        continue;
      }
      if (existing.status !== 404)
        throw new Error(`Asset preflight failed (${existing.status}): ${assetPath}`);
      const absolute = path.resolve(publicDirectory, `.${assetPath}`);
      if (!absolute.startsWith(path.resolve(publicDirectory) + path.sep))
        throw new Error("Invalid asset path");
      const bytes = await readFile(absolute);
      if (
        bytes.length !== entry.size ||
        createHash("sha256").update(bytes).digest("hex") !== entry.sha256
      )
        throw new Error(`Asset changed since build: ${assetPath}`);
      const response = await fetcher(url, {
        method: "PUT",
        redirect: "error",
        headers: {
          ...requestHeaders,
          "Content-Type": entry.type,
          "Content-Length": String(entry.size),
        },
        body: bytes,
      });
      if (![201, 204].includes(response.status))
        throw new Error(`Asset upload failed (${response.status}): ${assetPath}`);
      const verified = await fetcher(url, {
        method: "HEAD",
        headers: requestHeaders,
        redirect: "error",
      });
      if (verified.status !== 200) throw new Error(`Asset verification failed: ${assetPath}`);
      report.uploaded++;
      report.bytes += entry.size;
    }
  }
  const results = await Promise.allSettled(Array.from({ length: 4 }, transfer));
  const failed = results.find((result) => result.status === "rejected");
  if (failed) throw failed.reason;
  return report;
}

async function main() {
  const target = process.argv[2];
  if (!["preview", "production"].includes(target)) throw new Error("Specify preview or production");
  const root = fileURLToPath(new URL("../", import.meta.url));
  const targets = JSON.parse(await readFile(path.join(root, "config/site-targets.json"), "utf8"));
  const manifest = JSON.parse(
    await readFile(path.join(root, ".sites-runtime/media-manifest.json"), "utf8"),
  );
  // Only credentials arrive on stdin, never CLI arguments, tracked files, or stdout.
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  const { projectId, uploadToken, serviceToken } = JSON.parse(input);
  if (
    projectId !== targets[target].projectId ||
    typeof uploadToken !== "string" ||
    uploadToken.length < 32
  )
    throw new Error("Target identity or upload credential is invalid");
  const headers = { Authorization: `Bearer ${uploadToken}` };
  if (serviceToken) headers["OAI-Sites-Authorization"] = `Bearer ${serviceToken}`;
  console.log(
    JSON.stringify(
      await uploadMedia({
        origin: targets[target].url,
        manifest,
        publicDirectory: path.join(root, "public"),
        headers,
      }),
    ),
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
