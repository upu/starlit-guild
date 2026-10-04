// Run after npm run build. Uses an ephemeral local Worker, never player saves or Sites.
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { resolve } from "node:path";
import { readFileSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";

const root = resolve("dist/server");
const built = JSON.parse(readFileSync(resolve(root, "wrangler.json"), "utf8"));
const config = {
  modules: [
    "index.js",
    ...readdirSync(root, { recursive: true }).filter((p) => p.endsWith(".js") && p !== "index.js"),
  ].map((p) => ({ type: "ESModule", path: resolve(root, p) })),
  modulesRoot: root,
  compatibilityDate: built.compatibility_date,
  compatibilityFlags: built.compatibility_flags,
  cf: false,
};
const worker = new Miniflare(convertV4MiniflareOptions(config));
try {
  for (const value of [undefined, "true", "false", "", "TRUE", "1", "true "]) {
    await worker.setOptions(
      convertV4MiniflareOptions({
        ...config,
        bindings: value === undefined ? {} : { ENABLE_TEST_TOOLS: value },
      }),
    );
    const response = await worker.dispatchFetch(
      "http://localhost/?preview=1&ENABLE_TEST_TOOLS=true",
      { headers: { RSC: "1" } },
    );
    const body = await response.text();
    assert.equal(response.status, 200, body.slice(0, 200));
    const match = body.match(/testToolsEnabled\\?":(true|false)/);
    assert.ok(match, "Runtime capability missing from server response");
    assert.equal(match[1], String(value === "true"));
    assert.match(response.headers.get("cache-control"), /no-store/);
    const lab = await worker.dispatchFetch("http://localhost/guild-lab?ENABLE_TEST_TOOLS=true");
    assert.equal(
      lab.status,
      value === "true" ? 200 : 404,
      "Prototype follows the server capability",
    );
    const study = await worker.dispatchFetch(
      "http://localhost/guild-lab/walk-study?ENABLE_TEST_TOOLS=true",
    );
    assert.equal(
      study.status,
      value === "true" ? 200 : 404,
      "Walk study follows the server capability",
    );
    console.log(
      `PASS: ENABLE_TEST_TOOLS=${JSON.stringify(value) ?? "unset"} => ${match[1]}, no-store`,
    );
  }
} finally {
  await worker.dispose();
}
