import test from "node:test";
import assert from "node:assert/strict";
import { timingSafeEqual } from "node:crypto";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createMediaManifest, mediaDirectories } from "../scripts/media-manifest.mjs";
import { uploadMedia } from "../scripts/upload-site-media.mjs";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";

const globals = { Response, Request, Headers, URL, TextEncoder };
const responseModule = evaluateSourceModule(
  compileSourceModule("../lib/media-response.ts", import.meta.url),
  {},
  globals,
);
const { readMedia } = responseModule;
const { importMedia } = evaluateSourceModule(
  compileSourceModule("../lib/media-import.ts", import.meta.url),
  {
    "node:crypto": { timingSafeEqual },
    "./media-response": responseModule,
  },
  globals,
);
const entry = {
  key: `media/${"a".repeat(64)}.webp`,
  sha256: "a".repeat(64),
  size: 10,
  type: "image/webp",
};
const metadata = { size: 10, customMetadata: { sha256: entry.sha256 } };
const bucket = {
  head: async () => metadata,
  get: async (_, options) => ({
    ...metadata,
    body: new Response(
      "0123456789".slice(
        options.range?.offset ?? 0,
        options.range ? options.range.offset + options.range.length : 10,
      ),
    ).body,
  }),
};
function request(method = "GET", headers = {}) {
  return new Request("https://example.test/stories/test.webp", { method, headers });
}

test("media reads stream full and ranged bodies with private revalidation", async () => {
  const full = await readMedia(request(), entry, bucket);
  assert.equal(full.status, 200);
  assert.equal(full.headers.get("cache-control"), "private, no-cache");
  assert.equal(await full.text(), "0123456789");
  for (const [range, expected, contentRange] of [
    ["bytes=2-4", "234", "bytes 2-4/10"],
    ["bytes=-3", "789", "bytes 7-9/10"],
    ["bytes=8-", "89", "bytes 8-9/10"],
  ]) {
    const result = await readMedia(request("GET", { Range: range }), entry, bucket);
    assert.equal(result.status, 206);
    assert.equal(result.headers.get("content-range"), contentRange);
    assert.equal(await result.text(), expected);
  }
});
test("media handles HEAD, conditional requests, invalid ranges and absent objects", async () => {
  assert.equal(await (await readMedia(request("HEAD"), entry, bucket)).text(), "");
  assert.equal(
    (await readMedia(request("GET", { "If-None-Match": `W/"${entry.sha256}"` }), entry, bucket))
      .status,
    304,
  );
  assert.equal(
    (await readMedia(request("GET", { Range: "bytes=20-" }), entry, bucket)).status,
    416,
  );
  assert.equal(
    (await readMedia(request("GET", { Range: "bytes=2-4", "If-Range": '"old"' }), entry, bucket))
      .status,
    200,
  );
  assert.equal(
    (await readMedia(request(), entry, { head: async () => null, get: async () => null })).status,
    503,
  );
  assert.equal((await readMedia(request(), entry)).status, 503);
});
const secret = "s".repeat(48);
function uploadRequest(headers = {}, method = "PUT") {
  return new Request(`https://example.test/api/media-import?key=${entry.key}`, {
    method,
    headers: {
      authorization: `Bearer ${secret}`,
      "x-asset-size": "10",
      "content-length": "10",
      ...headers,
    },
    ...(method === "PUT" ? { body: "0123456789" } : {}),
  });
}
test("import is disabled without a secret and rejects wrong tokens, sizes and lengths", async () => {
  assert.equal((await importMedia(uploadRequest(), bucket)).status, 404);
  assert.equal(
    (await importMedia(uploadRequest({ authorization: "Bearer wrong" }), bucket, secret)).status,
    404,
  );
  assert.equal(
    (await importMedia(uploadRequest({ "x-asset-size": "999999999" }), bucket, secret)).status,
    400,
  );
  assert.equal(
    (await importMedia(uploadRequest({ "content-length": "11" }), bucket, secret)).status,
    400,
  );
  assert.equal((await importMedia(uploadRequest(), bucket, secret)).status, 204);
});
test("import writes content-addressed keys and passes stream plus SHA256 verification to R2", async () => {
  let written;
  const empty = {
    head: async () => null,
    put: async (...args) => {
      written = args;
    },
  };
  assert.equal((await importMedia(uploadRequest(), empty, secret)).status, 201);
  assert.equal(written[0], entry.key);
  assert.equal(written[2].sha256, entry.sha256);
  assert.equal(await new Response(written[1]).text(), "0123456789");
});

test("manifest generation is deterministic and changing bytes creates a new immutable key", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "starlit-media-"));
  try {
    for (const directory of mediaDirectories) await mkdir(path.join(root, directory));
    await writeFile(path.join(root, "stories/test.webp"), "first");
    const first = await createMediaManifest(root);
    assert.deepEqual(await createMediaManifest(root), first);
    await writeFile(path.join(root, "stories/test.webp"), "second");
    assert.notEqual(
      (await createMediaManifest(root))["/stories/test.webp"].key,
      first["/stories/test.webp"].key,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uploader transfers missing bytes, verifies the result, and skips existing objects on retry", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "starlit-upload-"));
  const bytes = Buffer.from("test-image");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const entry = { key: `media/${sha256}.webp`, sha256, size: bytes.length, type: "image/webp" };
  let present = false;
  let writes = 0;
  try {
    await writeFile(path.join(root, "image.webp"), bytes);
    const args = {
      origin: "https://example.test",
      manifest: { "/image.webp": entry, "/same-content.webp": entry },
      publicDirectory: root,
      headers: { Authorization: "Bearer test" },
      fetcher: async (url, options) => {
        assert.equal(url.origin, "https://example.test");
        assert.equal(options.redirect, "error");
        if (options.method === "HEAD") return new Response(null, { status: present ? 200 : 404 });
        assert.deepEqual(options.body, bytes);
        writes++;
        present = true;
        return new Response(null, { status: 201 });
      },
    };
    assert.deepEqual(await uploadMedia(args), { uploaded: 1, skipped: 0, bytes: bytes.length });
    assert.deepEqual(await uploadMedia(args), { uploaded: 0, skipped: 1, bytes: 0 });
    assert.equal(writes, 1);
    present = false;
    await writeFile(path.join(root, "image.webp"), "changed");
    await assert.rejects(uploadMedia(args), /changed since build/);
    assert.equal(writes, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
