import { test } from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { stories } from "../lib/stories.ts";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import {
  nextStageBackground,
  nextStoryArtwork,
  castImageFailures,
  preloadStoryImage,
  stageBackground,
  storyCastImages,
  storyImageReady,
} from "../lib/storybook/stage-images.ts";

test("failed cast images identify the exact character and strip", () => {
  const images = [
    "/storybook-study/aria-conversation-v1.webp",
    "/storybook-study/aria-walk-v1.webp",
    "/storybook-study/leon-conversation-v1.webp",
  ];
  assert.deepEqual(castImageFailures(images, [false, true, true]), {
    aria: { standing: true, walking: false },
  });
  assert.deepEqual(castImageFailures(images, [false, false, true]), {
    aria: { standing: true, walking: true },
  });
});

test("painted stories prepare their shared cast without loading unrelated characters", () => {
  const story = stories.find((item) => item.id === "lantern-detour-return");
  const images = storyCastImages(story);
  assert.ok(images.includes("/storybook-study/aria-conversation-v1.webp"));
  assert.ok(images.includes("/storybook-study/finn-walk-balanced-v3.webp"));
  assert.ok(!images.includes("/storybook-study/lico-conversation-ponytail-v1.webp"));
  assert.equal(images.length, new Set(images).size);
});

test("cart scenes prepare Finn and Lico's dedicated moving strips before the motion", () => {
  for (const id of ["moss-transplant-departure", "starlit-guild-founding-departure"]) {
    const story = stories.find((item) => item.id === id);
    const images = storyCastImages(story);
    assert.ok(images.includes("/storybook-study/finn-pull-scene-balanced-v3.webp"));
    assert.ok(images.includes("/storybook-study/lico-notebook-walk-ponytail-v1.webp"));
    assert.equal(images.length, new Set(images).size);
  }
  const unrelated = stories.find((item) => item.id === "lantern-detour-return");
  assert.ok(
    !storyCastImages(unrelated).includes("/storybook-study/finn-pull-scene-balanced-v3.webp"),
  );
});
test("both patient visits prepare the seated patient and the doctor before the room appears", () => {
  for (const id of ["brekka-arrival-return", "moss-transplant-return"]) {
    const story = stories.find((item) => item.id === id);
    const images = storyCastImages(story);
    assert.ok(images.includes("/storybook-study/patient-visit-v2.webp"));
    assert.ok(images.includes("/storybook-study/doctor-visit-v1.webp"));
  }
});

test("the settlement visit prepares the household and its treatment props before the room cut", async () => {
  for (const id of ["waiting-households-departure", "waiting-households-return"]) {
    const images = storyCastImages(stories.find((item) => item.id === id));
    for (const name of [
      "household-parent-v1",
      "household-child-bed-v1",
      "household-cook-v1",
      "medicine-table-v1",
      "medicine-closed-v1",
      "household-water-bucket-v1",
      "mira-bag-place-v1",
      "chair-v1",
    ]) {
      const path = `/storybook-study/${name}.webp`;
      assert.ok(images.includes(path), `${id} prepares ${name}`);
      await access(`public${path}`);
    }
    assert.equal(images.length, new Set(images).size);
  }
});

test("every selected shared cast image exists in the public assets", async () => {
  const images = new Set(stories.flatMap(storyCastImages));
  assert.ok(images.size > 0);
  await Promise.all([...images].map((src) => access(`public${src}`)));
});

test("the next different painted background is prepared ahead of the scene change", () => {
  const story = stories.find((item) => item.id === "lantern-detour-return");
  const current = stageBackground(story.id, 0, studyCue(story.id, 0, true));
  assert.equal(current, "/storybook-study/hill-path-v1.png");
  assert.equal(nextStageBackground(story, 0, current), "/storybook-study/hill-path-dusk-v1.png");
  assert.equal(nextStageBackground(story, 7, "/storybook-study/hill-path-dusk-v1.png"), undefined);
});

test("the upcoming still is prepared before its authored reveal without changing the reveal", () => {
  const story = stories.find((item) => item.id === "starlit-guild-founding-return");
  assert.equal(nextStoryArtwork(story, 0), "/stories/guild-formation.webp");
  assert.equal(nextStoryArtwork(story, 66), "/stories/guild-formation.webp");
  assert.equal(nextStoryArtwork(story, 67), undefined);
  const immediate = stories.find((item) => item.id === "village-trade-return");
  assert.equal(nextStoryArtwork(immediate, 0), undefined);
});

test("image loading shares requests, exposes readiness, and allows retry after failure", async () => {
  const previous = globalThis.Image;
  const requests = [];
  globalThis.Image = class {
    set src(value) {
      this.url = value;
      requests.push(this);
    }
  };
  try {
    const first = preloadStoryImage("/test-stage-a.png");
    assert.equal(preloadStoryImage("/test-stage-a.png"), first);
    assert.equal(storyImageReady("/test-stage-a.png"), false);
    requests[0].onload();
    assert.equal(await first, true);
    assert.equal(storyImageReady("/test-stage-a.png"), true);
    const failure = preloadStoryImage("/test-stage-b.png");
    requests[1].onerror();
    assert.equal(await failure, false);
    const retry = preloadStoryImage("/test-stage-b.png");
    assert.equal(requests.length, 3);
    requests[2].onload();
    assert.equal(await retry, true);
  } finally {
    globalThis.Image = previous;
  }
});

test("a stalled background eventually falls back instead of blocking dialogue", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const previous = globalThis.Image;
  globalThis.Image = class {
    set src(value) {
      this.url = value;
    }
  };
  try {
    const result = preloadStoryImage("/test-stage-stalled.png");
    t.mock.timers.tick(8000);
    assert.equal(await result, false);
    assert.equal(storyImageReady("/test-stage-stalled.png"), false);
  } finally {
    globalThis.Image = previous;
  }
});

test("a loaded image is not displayed until decoding has completed", async () => {
  const previous = globalThis.Image;
  const images = [];
  let decoded;
  globalThis.Image = class {
    constructor() {
      images.push(this);
    }
    set src(value) {
      this.url = value;
    }
    decode() {
      return new Promise((resolve) => {
        decoded = resolve;
      });
    }
  };
  try {
    const result = preloadStoryImage("/test-stage-decode.png");
    images[0].onload();
    assert.equal(storyImageReady("/test-stage-decode.png"), false);
    decoded();
    assert.equal(await result, true);
    assert.equal(storyImageReady("/test-stage-decode.png"), true);
  } finally {
    globalThis.Image = previous;
  }
});
