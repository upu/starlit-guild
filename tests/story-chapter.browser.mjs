// Synthetic profile in isolated contexts only; never opens a player's storage.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { testState } from "../lib/game.ts";
import { expressionPortrait } from "../lib/portrait-expressions.ts";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
import { storyArtAt } from "../lib/story-art.ts";
import { storyStageCue, storyStageExitCue } from "../lib/story-stage.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";
import { prologueStories } from "../lib/prologue-stories.ts";
const root = process.env.TEST_ROOT || "http://localhost:5173";
const output = process.env.TEST_OUTPUT || "work/story-chapter-browser";
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
    state = testState(Date.now(), 9, 40, 10000);
  const id = "11111111-1111-4111-8111-111111111111";
  const record = {
    format: 4,
    deviceId: id,
    active: id,
    profiles: [{ id, name: "1章後半の会話確認", test: true, state }],
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
  await page.getByRole("combobox", { name: "思い出の章" }).selectOption({ label: "第一章" });
  await page.getByRole("button", { name: new RegExp(story.title) }).click();
  await page.locator(".story-reader").waitFor();
  return { context, page };
}
const positions = (page) =>
  page
    .locator(".story-stage-actor")
    .evaluateAll((els) => els.map((el) => parseFloat(el.style.left)));
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
  for (const story of prologueStories
    .slice(6)
    .filter((s) => !process.env.STORY_FILTER || new RegExp(process.env.STORY_FILTER).test(s.id))) {
    for (const reduced of [false, true]) {
      const { context, page } = await openStory(story, reduced ? "reduce" : "no-preference");
      for (let i = 0; i < story.lines.length; i++) {
        if (!reduced && story.id === "moss-night-road-return" && i === 18) {
          const handX = () =>
            page.locator('[data-item="sample"]').evaluate((el) => parseFloat(el.style.left));
          const before = await handX();
          await page.clock.runFor(300);
          const midway = await handX();
          await page.clock.runFor(400);
          const after = await handX();
          assert.ok(
            before > midway && midway > after,
            "moss is handed back continuously on the narrated line",
          );
        }
        await page.clock.runFor(reduced ? 32 : 1000);
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
          assert.equal(await page.locator(".story-stage-extra").count(), cue.extras.length);
          assert.equal(await page.locator(".story-stage-item").count(), cue.items.length);
          const actors = await positions(page);
          for (const item of cue.items) {
            const x = await page
              .locator(`[data-item="${item.id}"]`)
              .evaluate((el) => parseFloat(el.style.left));
            assert.ok(
              Math.abs(
                x -
                  item.x *
                    (item.actor &&
                    cue.actors.find((a) => a.id === item.actor).left !== (item.actor === "leon")
                      ? -1
                      : 1) -
                  (item.actor ? actors[item.actor === "aria" ? 0 : 1] : 0),
              ) < 0.2,
              `${story.id}/${i}/${item.id}: item follows hand`,
            );
          }
        }
        if (!reduced && [0, 4, 7, 15, 16, 18, 20].includes(i))
          await layout(page, `${story.id}-${i}`, !!cue);
        if (!reduced && i === 4) {
          await page.getByRole("button", { name: "会話履歴", exact: true }).click();
          assert.equal(await page.locator(".story-lines > *").count(), 5);
          await page.locator(".story-conversation").press("Enter");
          await page.getByRole("button", { name: "会話に戻る", exact: true }).click();
          assert.ok((await page.locator(".story-lines").innerText()).includes(line.text));
        }
        if (!reduced && i === 0) {
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
            const exit = stageCameraCue(storyStageExitCue(story.id));
            const duration = Math.max(
              3000,
              ...exit.actors.map((actor, index) => journeyDuration(actor, cue.actors[index])),
            );
            await page.clock.runFor(duration + 250);
          }
          assert.equal(
            await page.locator(".story-reader").count(),
            0,
            `${story.id}: completes after tap`,
          );
        } else await advance(page, 32);
      }
      await context.close();
    }
  }
  assert.deepEqual(errors, []);
  writeFileSync(`${output}/results.json`, JSON.stringify({ errors, results }, null, 2));
  console.log(
    `Chapter one scenes verified in both motion settings, ${results.length} screenshots, no browser errors`,
  );
} finally {
  await browser.close();
}
