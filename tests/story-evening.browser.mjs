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
    state = testState(Date.now(), 3, 40, 10000);
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

async function townProps(page, line, departing) {
  assert.equal(await page.locator(".story-stage-merchant").count(), 1);
  assert.equal(await page.locator(".story-stage-table").count(), 1);
  const speaking = (departing ? [1, 4, 9] : [8, 10, 14, 18]).includes(line);
  assert.equal(
    await page.locator(".story-stage-merchant").getAttribute("data-speaking"),
    String(speaking),
  );
  assert.equal(await page.locator(".story-stage-table-stock").count(), departing ? 1 : 0);
  if (!departing) return;
  const box = await page.locator(".story-stage-delivery-box").boundingBox();
  const aria = await page.locator('[data-actor="aria"]').boundingBox();
  assert.ok(Math.abs(box.width / aria.width - 13 / 24) < 0.01, "small box scale stays constant");
  if ((await page.locator(".story-stage-delivery-box").getAttribute("data-box")) === "table") {
    const table = await page.locator(".story-stage-table").boundingBox();
    const base = box.y + box.height;
    assert.ok(
      base >= table.y && base < table.y + table.height * 0.4,
      "box rests on nearby tabletop",
    );
    assert.ok(Math.abs(box.x + box.width / 2 - aria.x - aria.width / 2) < aria.width * 0.7);
  }
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

  for (const scene of [
    "evening-trade-road-departure",
    "evening-trade-road-return",
    "town-deliveries-departure",
    "town-deliveries-return",
  ]) {
    const story = stories.find((s) => s.id === scene);
    const town = scene.startsWith("town-"),
      departing = scene.endsWith("departure");
    for (const reduced of [false, true]) {
      const { context, page } = await openStory(story, reduced ? "reduce" : "no-preference");
      await page.clock.runFor(200);
      assert.deepEqual(await positions(page), town ? [30, 64] : [28, 56]);
      assert.equal(
        await page.locator(".story-stage").getAttribute("data-setting"),
        town
          ? departing
            ? "town-shop"
            : "town-shop-return"
          : departing
            ? "town-exit"
            : "meeting-dusk",
      );
      assert.equal(await page.locator(".story-stage-cart").isVisible(), !town);
      if (!town)
        assert.match(await page.locator(".story-stage").getAttribute("style"), /return-cart.webp/);
      if (!reduced && departing) {
        await page.setViewportSize({ width: 759, height: 1244 });
        await layout(page, `${scene}-759`, true);
        await page.setViewportSize({ width: 390, height: 844 });
      }
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
        if (!reduced && [0, 1, 3, 5, 7, 10, story.lines.length - 1].includes(i))
          await layout(page, `${scene}-${i}`, true);
        if (town && departing) {
          const boxMode =
            i < 3 || (i >= 7 && i < 13) ? "table" : i < 5 ? "aria" : i < 7 ? "high" : "shared";
          assert.equal(
            await page.locator(".story-stage-delivery-box").getAttribute("data-box"),
            boxMode,
          );
        }
        if (town) await townProps(page, i, departing);
        if (i + 1 < story.lines.length) await advance(page);
      }
      await page.clock.runFor(4000);
      const before = await positions(page);
      assert.deepEqual(
        before,
        town ? (departing ? [36, 56] : [45, 65]) : departing ? [42, 81] : [32, 81],
      );
      await page.getByRole("button", { name: "会話履歴", exact: true }).click();
      assert.equal(await page.locator(".story-lines > *").count(), story.lines.length);
      await page.locator(".story-conversation").press("Enter");
      assert.deepEqual(await positions(page), before);
      await page.getByRole("button", { name: "会話に戻る", exact: true }).click();
      await advance(page, reduced ? 32 : 700);
      if (!reduced) {
        const moving = await positions(page);
        assert.equal(moving[0] > before[0], town || departing);
        assert.ok(moving[1] > before[1]);
        assert.equal(
          await page.locator(".story-stage").getAttribute("data-luggage"),
          town ? "hidden" : "carried",
        );
        if (town && departing) {
          assert.ok(Math.abs(moving[1] - moving[0] - 20) < 0.001);
          const offset = await page.locator(".story-stage-ground").evaluate((el) => {
            const xs = [...el.querySelectorAll(".story-stage-actor")].map((actor) =>
              parseFloat(actor.style.left),
            );
            return (
              parseFloat(el.querySelector(".story-stage-delivery-box").style.left) -
              (xs[0] + xs[1]) / 2
            );
          });
          assert.ok(Math.abs(offset) < 0.01);
          assert.match(
            await page.locator('[data-actor="leon"] .story-stage-sprite').getAttribute("style"),
            /scaleX\(-1\)/,
          );
        }
        await layout(page, `${scene}-exit`, true);
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
    `PASS: static handover, evening and delivery scenes, history, last-tap exits, shared box, reduced motion; ${results.length} screenshots`,
  );
} finally {
  await browser.close();
}
