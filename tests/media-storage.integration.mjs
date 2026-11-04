// Built Worker + ephemeral local R2. No Sites access or existing save data.
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { resolve } from "node:path";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
import { mediaDirectories } from "../scripts/media-manifest.mjs";

const root = resolve("dist/server");
const built = JSON.parse(readFileSync(resolve(root, "wrangler.json"), "utf8"));
const manifest = JSON.parse(readFileSync(".sites-runtime/media-manifest.json", "utf8"));
for (const directory of mediaDirectories) {
  assert.equal(existsSync(resolve("dist/client", directory)), false, `Media leaked: ${directory}`);
}
const secret = "local-integration-only-secret-not-for-publication";
const worker = new Miniflare(
  convertV4MiniflareOptions({
    modules: [
      "index.js",
      ...readdirSync(root, { recursive: true }).filter(
        (p) => p.endsWith(".js") && p !== "index.js",
      ),
    ].map((p) => ({ type: "ESModule", path: resolve(root, p) })),
    modulesRoot: root,
    compatibilityDate: built.compatibility_date,
    compatibilityFlags: built.compatibility_flags,
    cf: false,
    r2Buckets: ["BUCKET"],
    bindings: { ASSET_UPLOAD_TOKEN: secret },
  }),
);
try {
  const samples = ["/storybook-study/", "/story-stage/", "/guild/", "/stories/", "/music/"].map(
    (prefix) => Object.keys(manifest).find((p) => p.startsWith(prefix)),
  );
  samples.push(Object.keys(manifest).find((p) => p.endsWith(".mp4")));
  for (const assetPath of samples) {
    assert.ok(assetPath);
    const entry = manifest[assetPath];
    const bytes = readFileSync(resolve("public", `.${assetPath}`));
    const endpoint = `http://localhost/api/media-import?key=${encodeURIComponent(entry.key)}`;
    const headers = {
      Authorization: `Bearer ${secret}`,
      "X-Asset-Size": String(entry.size),
      "Content-Length": String(bytes.length),
    };
    assert.equal(
      (await worker.dispatchFetch(endpoint, { method: "PUT", body: bytes })).status,
      404,
    );
    assert.equal((await worker.dispatchFetch(endpoint, { method: "HEAD", headers })).status, 404);
    const wrong = Buffer.from(bytes);
    wrong[0] ^= 1;
    assert.equal(
      (await worker.dispatchFetch(endpoint, { method: "PUT", headers, body: wrong })).status,
      503,
    );
    assert.equal((await worker.dispatchFetch(endpoint, { method: "HEAD", headers })).status, 404);
    const uploaded = await worker.dispatchFetch(endpoint, { method: "PUT", headers, body: bytes });
    assert.equal(uploaded.status, 201, await uploaded.text());
    assert.equal((await worker.dispatchFetch(endpoint, { method: "HEAD", headers })).status, 200);
    assert.equal(
      (await worker.dispatchFetch(endpoint, { method: "PUT", headers, body: bytes })).status,
      204,
    );
    const full = await worker.dispatchFetch(`http://localhost${assetPath}`);
    assert.equal(full.status, 200, assetPath);
    assert.deepEqual(Buffer.from(await full.arrayBuffer()), bytes);
    const part = await worker.dispatchFetch(`http://localhost${assetPath}`, {
      headers: { Range: "bytes=1-3" },
    });
    assert.equal(part.status, 206);
    assert.deepEqual(Buffer.from(await part.arrayBuffer()), bytes.subarray(1, 4));
    const head = await worker.dispatchFetch(`http://localhost${assetPath}`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get("content-length"), String(bytes.length));
    assert.equal(
      (
        await worker.dispatchFetch(`http://localhost${assetPath}`, {
          headers: { "If-None-Match": head.headers.get("etag") },
        })
      ).status,
      304,
    );
    console.log(`PASS: import integrity, deduplication, GET/HEAD/Range/ETag ${assetPath}`);
  }
  assert.equal((await worker.dispatchFetch("http://localhost/not-a-media-file.webp")).status, 404);
  assert.equal((await worker.dispatchFetch("http://localhost/")).status, 200);
} finally {
  await worker.dispose();
}
