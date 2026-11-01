// Synthetic profile in isolated contexts only; never opens a player's storage.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { testState } from "../lib/game.ts";
import { expressionPortrait } from "../lib/portrait-expressions.ts";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
import { storyArtAt } from "../lib/story-art.ts";
import { storyStageCue, storyStageExitCue } from "../lib/story-stage.ts";
import { chapterTwoStories } from "../lib/chapter-two-stories.ts";
import { chapterThreeStories } from "../lib/chapter-three-stories.ts";
import { chapterFourStories } from "../lib/chapter-four-stories.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
const chapters = [chapterTwoStories, chapterThreeStories, chapterFourStories];
const allStories = chapters.flat();
const root = process.env.TEST_ROOT || "http://localhost:5173";
const output = process.env.TEST_OUTPUT || "work/story-later-browser";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const errors = [],
  results = [];

async function openStory(story, reducedMotion = "no-preference") {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion,
  });
  const page = await context.newPage(),
    state = testState(Date.now(), 37, 40, 10000);
  const id = "11111111-1111-4111-8111-111111111111";
  const record = {
    format: 4,
    deviceId: id,
    active: id,
    profiles: [{ id, name: "2〜4章の会話確認", test: true, state }],
    serial: 0,
    sound: false,
    cloudAt: 0,
  };
  await page.clock.install({ time: new Date(state.updatedAt) });
  await page.clock.setFixedTime(new Date(state.updatedAt));
  await page.addInitScript(
    (save) => localStorage.setItem("starlit-guild-v4", JSON.stringify(save)),
    record,
  );
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400 && /story-stage|story-stills|portraits/.test(response.url()))
      errors.push(response.url());
  });
  await page.goto(root);
  await page.getByRole("button", { name: "冒険を始める", exact: true }).click();
  await page.clock.runFor(250);
  await page.getByRole("button", { name: "旅の手帳：ヒント・思い出・アルバム・設定" }).click();
  await page.getByRole("button", { name: /思い出/ }).click();
  await page.getByRole("combobox", { name: "思い出の章" }).selectOption({
    label: ["第二章", "第三章", "第四章"][
      chapters.findIndex((a) => a.some((s) => s.id === story.id))
    ],
  });
  await page.getByRole("button", { name: new RegExp(story.title) }).click();
  await page.locator(".story-reader").waitFor();
  return { context, page };
}
const stagePositions = (page) =>
  page.locator(".story-stage").evaluate((stage) => ({
    actors: Object.fromEntries(
      [...stage.querySelectorAll(".story-stage-actor")].map((el) => [
        el.dataset.actor,
        {
          x: parseFloat(el.style.left),
          bottom: parseFloat(el.style.bottom),
          left: el.querySelector(".story-stage-sprite").style.transform.includes("scaleX(-1)"),
        },
      ]),
    ),
    extras: Object.fromEntries(
      [...stage.querySelectorAll(".story-stage-extra")].map((el) => [
        `extra:${el.dataset.npc}`,
        { x: parseFloat(el.style.left), bottom: parseFloat(el.style.bottom) },
      ]),
    ),
    items: Object.fromEntries(
      [...stage.querySelectorAll(".story-stage-item")].map((el) => [
        el.dataset.item,
        parseFloat(el.style.left),
      ]),
    ),
  }));
async function advance(page, duration = 1000) {
  await page.locator(".story-conversation").press("Enter");
  await page.clock.runFor(duration);
}
async function layout(page, name, staged) {
  await page.clock.runFor(400);
  const art = await page.locator(staged ? ".story-stage" : ".story-still").boundingBox();
  const talk = await page.locator(".story-conversation").boundingBox();
  const latest = await page.locator(".story-lines").boundingBox();
  assert.ok(art.width > 200 && art.height > 60);
  assert.ok(art.y + art.height <= talk.y + 1);
  assert.ok(latest.y - (art.y + art.height) < 40);
  assert.ok(talk.y + talk.height <= page.viewportSize().height + 1);
  assert.equal(await page.locator(".story-lines > *").count(), 1);
  await page.screenshot({ path: `${output}/${name}.png`, animations: "disabled" });
  results.push({ name, art, talk });
}

try {
  for (const story of allStories.filter(
    (s) => !process.env.STORY_FILTER || new RegExp(process.env.STORY_FILTER).test(s.id),
  )) {
    for (const reduced of process.env.MOTION === "both" ? [false, true] : [true]) {
      const { context, page } = await openStory(story, reduced ? "reduce" : "no-preference");
      for (let i = 0; i < story.lines.length; i++) {
        const authored = storyStageCue(story.id, i);
        await page.clock.runFor(reduced ? 32 : (authored?.sequence?.at(-1)?.after ?? 0) + 4000);
        const cue = storyStageCue(story.id, i),
          art = storyArtAt(story.id, i);
        assert.equal(await page.locator(".story-stage").count(), cue ? 1 : 0, `${story.id}/${i}`);
        assert.equal(await page.locator(".story-lines > *").count(), 1);
        assert.ok((await page.locator(".story-lines").innerText()).includes(story.lines[i].text));
        if (art) assert.equal(await page.locator(".story-still").count(), 1);
        const line = story.lines[i];
        if (line.speaker) {
          const expected = expressionPortrait(line.speaker, line.expression);
          const face = await page.locator(".story-lines .face-portrait").evaluate((el) => ({
            src: el.style.backgroundImage,
            position: el.style.backgroundPosition,
          }));
          assert.ok(face.src.includes(expected.src));
          face.position
            .split(" ")
            .forEach((v, j) =>
              assert.ok(
                Math.abs(parseFloat(v) - parseFloat(expected.position.split(" ")[j])) < 0.001,
              ),
            );
        }
        if (cue) {
          const camera = stageCameraCue(cue);
          const rendered = { ...camera, ...camera.sequence?.at(-1) };
          assert.equal(await page.locator(".story-stage-extra").count(), cue.extras.length);
          assert.equal(
            await page.locator(".story-stage-item:not([hidden])").count(),
            rendered.items.length,
          );
          // One DOM snapshot: separate reads can straddle an animation frame during a walk.
          const { actors, items, extras } = await stagePositions(page);
          for (const item of rendered.items) {
            const x = items[item.id];
            assert.ok(
              Math.abs(
                x -
                  stageItemTarget(item, rendered, new Map(Object.entries({ ...actors, ...extras })))
                    .x,
              ) < 0.2,
              `${story.id}/${i}/${item.id}: item follows hand`,
            );
          }
        }
        if ([0, 7, 15, 23, 32, 42, 60].includes(i)) await layout(page, `${story.id}-${i}`, !!cue);
        if (i === 4) {
          await page.getByRole("button", { name: "会話履歴", exact: true }).click();
          assert.equal(await page.locator(".story-lines > *").count(), 5);
          await page.locator(".story-conversation").press("Enter");
          await page.getByRole("button", { name: "会話に戻る", exact: true }).click();
          assert.ok((await page.locator(".story-lines").innerText()).includes(line.text));
        }
        if (
          i === 0 &&
          /moonlit-herbs-departure|lico-records-return|interlude-promised/.test(story.id)
        ) {
          for (const [width, height] of [
            [320, 568],
            [759, 1244],
            [844, 390],
          ]) {
            await page.setViewportSize({ width, height });
            await layout(page, `${story.id}-${width}`, !!cue);
          }
          await page.setViewportSize({ width: 390, height: 844 });
        }
        if (i === story.lines.length - 1) {
          await page.clock.runFor(4000);
          assert.equal(
            await page.locator(".story-reader").count(),
            1,
            "final line waits for a tap",
          );
          await advance(page, 32);
          if (!reduced && cue && storyStageExitCue(story.id)) {
            assert.equal(await page.locator(".story-reader").count(), 1);
            await page.clock.runFor(5000);
          }
          assert.equal(
            await page.locator(".story-reader").count(),
            0,
            `${story.id}: completes after tap`,
          );
        } else await advance(page, 32);
      }
      console.log(`verified ${story.id} (${reduced ? "reduced" : "normal"})`);
      await context.close();
    }
  }
  assert.deepEqual(errors, []);
  writeFileSync(`${output}/results.json`, JSON.stringify({ errors, results }, null, 2));
  console.log(`Chapter 2–4 scenes verified, ${results.length} screenshots, no browser errors`);
} finally {
  await browser.close();
}
