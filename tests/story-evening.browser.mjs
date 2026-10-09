// Synthetic profile in isolated contexts only; never opens a player's storage.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { testState } from "../lib/game.ts";
import { stories } from "../lib/stories.ts";
import { expressionPortrait } from "../lib/portrait-expressions.ts";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = process.env.TEST_ROOT || "http://localhost:5173";
const output = "work/story-evening-browser";
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
    state = testState(Date.now(), 2, 40, 10000);
  const id = "11111111-1111-4111-8111-111111111111";
  const record = {
    format: 4,
    deviceId: id,
    active: id,
    profiles: [{ id, name: "1-2の会話確認", test: true, state }],
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
  const story = stories.find((s) => s.id === "village-trade-return");
  const { context, page } = await openStory(story);
  for (let i = 0; i < story.lines.length; i++) {
    assert.equal(await page.locator(".story-stage").count(), 0);
    assert.equal(await page.locator(".story-lines > *").count(), 1);
    assert.ok((await page.locator(".story-lines").innerText()).includes(story.lines[i].text));
    if (i === 5) {
      assert.equal(await page.locator(".story-still video").count(), 0);
      for (const [width, height] of [
        [390, 844],
        [320, 568],
        [844, 390],
        [1280, 960],
      ]) {
        await page.setViewportSize({ width, height });
        await page.clock.runFor(32);
        await layout(page, `${width}-handover`, false);
      }
      await page.getByRole("button", { name: "会話履歴", exact: true }).click();
      assert.equal(await page.locator(".story-lines > *").count(), 6);
      await page.locator(".story-conversation").press("Enter");
      await page.getByRole("button", { name: "会話に戻る", exact: true }).click();
      await page.getByRole("button", { name: /絵を大きく見る/ }).click();
      await page.getByRole("button", { name: "戻る", exact: true }).click();
      assert.ok((await page.locator(".story-lines").innerText()).includes(story.lines[i].text));
    }
    await advance(page, 32);
  }
  assert.equal(await page.locator(".story-reader").count(), 0);
  await context.close();

  for (const suffix of ["departure", "return"]) {
    const story = stories.find((s) => s.id === `evening-trade-road-${suffix}`);
    for (const reduced of [false, true]) {
      const { context, page } = await openStory(story, reduced ? "reduce" : "no-preference");
      await page.clock.runFor(200);
      assert.deepEqual(await positions(page), [28, 56]);
      assert.equal(
        await page.locator(".story-stage").getAttribute("data-setting"),
        suffix === "departure" ? "town-exit" : "meeting-dusk",
      );
      assert.match(await page.locator(".story-stage").getAttribute("style"), /return-cart.webp/);
      for (let i = 0; i < story.lines.length; i++) {
        assert.ok((await page.locator(".story-lines").innerText()).includes(story.lines[i].text));
        assert.equal(await page.locator(".story-lines > *").count(), 1);
        const line = story.lines[i];
        if (line.speaker) {
          const expected = expressionPortrait(line.speaker, line.expression);
          const face = await page.locator(".story-lines .face-portrait").evaluate((el) => ({
            src: el.style.backgroundImage,
            position: el.style.backgroundPosition,
          }));
          assert.ok(face.src.includes(expected.src));
          const actualXY = face.position.split(" ").map(parseFloat);
          const expectedXY = expected.position.split(" ").map(parseFloat);
          assert.ok(actualXY.every((n, axis) => Math.abs(n - expectedXY[axis]) < 0.001));
        }
        if (!reduced && [0, 1, 5, story.lines.length - 1].includes(i))
          await layout(page, `${suffix}-${i}`, true);
        if (i + 1 < story.lines.length) await advance(page);
      }
      await page.clock.runFor(4000);
      const before = await positions(page);
      assert.deepEqual(before, suffix === "departure" ? [42, 81] : [32, 81]);
      await page.getByRole("button", { name: "会話履歴", exact: true }).click();
      assert.equal(await page.locator(".story-lines > *").count(), story.lines.length);
      await page.locator(".story-conversation").press("Enter");
      assert.deepEqual(await positions(page), before);
      await page.getByRole("button", { name: "会話に戻る", exact: true }).click();
      await advance(page, reduced ? 32 : 700);
      if (!reduced) {
        const moving = await positions(page);
        assert.equal(moving[0] > before[0], suffix === "departure");
        assert.ok(moving[1] > before[1]);
        assert.equal(await page.locator(".story-stage").getAttribute("data-luggage"), "carried");
        await layout(page, `${suffix}-exit`, true);
        await page.locator(".story-conversation").press("Enter");
        await page.clock.runFor(2800);
      }
      assert.equal(await page.locator(".story-reader").count(), 0);
      await context.close();
    }
  }
  assert.deepEqual(errors, []);
  writeFileSync(
    `${output}/results.json`,
    JSON.stringify({ results, errors, realDevice: "not-run" }, null, 2),
  );
  console.log(
    `PASS: static handover, both evening scenes, history, last-tap exits, reduced motion; ${results.length} screenshots`,
  );
} finally {
  await browser.close();
}
