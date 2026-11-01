import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { storybookMetricsPath } from "../scripts/storybook-metadata.mjs";

test("registration JSON stays outside the public asset directory", async () => {
  const publicFiles = await readdir("public/storybook-study");
  assert.deepEqual(
    publicFiles.filter((name) => name.endsWith(".json")),
    [],
  );
  const metadata = await readdir("assets/metadata/storybook");
  assert.ok(metadata.length > 200);
  for (const name of metadata)
    if (name.endsWith(".json"))
      JSON.parse(await readFile(`assets/metadata/storybook/${name}`, "utf8"));
});

test("superseded delivery images cannot return unnoticed", async () => {
  const record = JSON.parse(
    await readFile("docs/art-generation/storybook-cleanup-20261101.json", "utf8"),
  );
  for (const removed of record.removed) await assert.rejects(access(removed.path));
});

test("current builders retain intermediate measurements outside public", async () => {
  const image = "public/storybook-study/finn-night-push-balanced-v4.webp";
  await access(image);
  const path = storybookMetricsPath(image);
  assert.equal(path, "assets/metadata/storybook/finn-night-push-balanced-v4-metrics.json");
  const metrics = JSON.parse(await readFile(path, "utf8"));
  assert.equal(metrics.length, 8);
});
