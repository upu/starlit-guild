import test from "node:test";
import assert from "node:assert/strict";
import { storybookWorkAppearance, groundWorkVisible } from "../lib/road-storybook-work.ts";

test("fixed painted work uses the image base frame, never a logical job name", () => {
  for (const [site, frame, asset] of [
    ["waterway", "waterway-bank", "/storybook-study/waterway-branches-v1.webp"],
    ["signpost", "signpost-restoration", "/storybook-study/signpost-portable-v1.webp"],
    ["packing", "packing-bench", "/storybook-study/packing-table-v1.webp"],
    ["housecalls", "housecalls", "/storybook-study/medicine-packet-v1.webp"],
  ]) {
    const look = { storybookHeroes: true, [site]: { node: 0 }, work: { frame, asset } };
    assert.deepEqual(storybookWorkAppearance(look), { asset, frame: "__BASE" });
    assert.equal(groundWorkVisible({ gathering: { kind: "herb" } }, look), false);
    assert.equal(storybookWorkAppearance({ ...look, storybookHeroes: false }), undefined);
  }
});
