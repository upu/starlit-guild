import { test } from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { stories } from "../lib/stories.ts";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookPropCue, storybookPropImages } from "../lib/storybook/shared-prop-art.ts";
import { stageBackground, storyCastImages } from "../lib/storybook/stage-images.ts";
import * as props from "../lib/story-stage-props.ts";
import * as figure from "../lib/story-stage-figure.ts";
import * as cargo from "../lib/story-stage-cargo.ts";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";

const withoutArtwork = (value) =>
  JSON.parse(JSON.stringify(value, (key, item) => (key === "image" ? undefined : item)));

test("shared artwork keeps all authored item contacts, paths and ownership through every step", () => {
  let checked = 0;
  for (const story of stories) {
    for (let page = 0; page < story.lines.length; page++) {
      const cue = studyCue(story.id, page, true);
      if (!cue || !stageBackground(story.id, page, cue)) continue;
      const before = structuredClone(cue);
      const result = storybookPropCue(cue);
      assert.deepEqual(cue, before, `${story.id}:${page + 1} does not mutate the authoring`);
      assert.deepEqual(withoutArtwork(result), withoutArtwork(cue), `${story.id}:${page + 1}`);
      checked++;
    }
  }
  assert.ok(checked >= 1402);
});

test("each used shared image is prepared before the scene and exists locally", async () => {
  const images = new Set();
  for (const story of stories) {
    const prepared = new Set(storyCastImages(story));
    for (let page = 0; page < story.lines.length; page++) {
      const cue = studyCue(story.id, page, true);
      if (!cue || !stageBackground(story.id, page, cue)) continue;
      for (const src of storybookPropImages(cue)) {
        assert.ok(prepared.has(src), `${story.id} prepares ${src}`);
        images.add(src);
      }
    }
  }
  assert.equal(images.size, 36);
  await Promise.all([...images].map((src) => access(new URL(`../public${src}`, import.meta.url))));
});

test("an explicit variant survives the default mapping and is prepared with the sequence", () => {
  const item = {
    id: "note",
    art: "map",
    image: "/storybook-study/groove-plan-v1.webp",
    x: 40,
    bottom: 30,
  };
  const cue = { actors: [], items: [], sequence: [{ after: 500, actors: [], items: [item] }] };
  assert.deepEqual(storybookPropCue(cue).sequence[0].items[0], item);
  assert.deepEqual(storybookPropImages(cue), [item.image]);
});

test("the moving-item painter keeps the selected artwork instead of restoring the legacy image", () => {
  const { itemPainter } = evaluateSourceModule(
    compileSourceModule("../app/story-stage-item-motion.ts", import.meta.url),
    {
      "@/lib/story-stage-props": props,
      "@/lib/story-stage-figure": figure,
      "@/lib/story-stage-cargo": cargo,
    },
  );
  const values = new Map();
  const element = {
    style: {
      setProperty: (key, value) => values.set(key, value),
      removeProperty: (key) => values.delete(key),
    },
    dataset: {},
    hidden: false,
  };
  const stage = { querySelector: () => element, querySelectorAll: () => [element] };
  const state = new Map();
  const item = { id: "notes", art: "map", x: 50, bottom: 20, width: 6 };
  const cue = storybookPropCue({ actors: [], items: [item] });
  const paint = itemPainter(stage, cue, state);
  for (const time of [0, 350, 2000]) {
    paint(new Map(), time, false);
    assert.equal(values.get("--item-art"), "url(/storybook-study/travel-map-v1.webp)");
    assert.equal(element.style.width, "6%");
  }
  itemPainter(stage, { actors: [], items: [item] }, state)(new Map(), 2000, true);
  assert.equal(values.get("--item-art"), "url(/story-stage/prop-map.webp)");
});
