// Isolated contexts only: create a new adventure without reading a player's save.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = process.env.TEST_ROOT || "http://localhost:5173";
const output = "work/story-stage-browser";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const errors = [],
  results = [];

async function openMeeting(page) {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      /home-pixel|adventure-pixel|story-stage|scenery|portraits/.test(response.url())
    )
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(root);
  await page.getByRole("button", { name: "冒険を始める", exact: true }).click();
  await page.getByRole("button", { name: "クエストを開く", exact: true }).click();
  await page.locator(".quest-option").filter({ hasText: "街への交易" }).click();
  if (await page.locator(".quest-option").count())
    await page.locator(".quest-option").filter({ hasText: "街への交易" }).click();
  await page.clock.install();
  await page.getByRole("button", { name: "出発", exact: true }).click();
  await page.locator(".stage-title-card").click();
  await page.locator(".story-stage").waitFor();
  await page.clock.runFor(1200);
}

const positions = (page) =>
  page.locator(".story-stage-actor").evaluateAll((els) =>
    els.map((el) => ({
      x: parseFloat(el.style.left),
      transform: el.querySelector(".story-stage-sprite").style.transform,
      frame: el.querySelector(".story-stage-sprite").style.backgroundPosition,
      atlas: el.querySelector(".story-stage-sprite").dataset.atlas,
      visible: el.style.visibility,
    })),
  );
async function advance(page) {
  await page.locator(".story-conversation").press("Enter");
  await page.clock.runFor(32);
}
async function layout(page, name) {
  const stage = await page.locator(".story-stage").boundingBox();
  const talk = await page.locator(".story-conversation").boundingBox();
  const view = page.viewportSize();
  assert.ok(stage.width > 250 && stage.height > 65);
  assert.ok(stage.y + stage.height <= talk.y + 1);
  assert.ok(talk.y + talk.height <= view.height + 1);
  const plane = await page.locator(".story-stage-ground").boundingBox();
  const actor = await page.locator('[data-actor="leon"]').boundingBox();
  const cart = await page.locator(".story-stage-cart").boundingBox();
  assert.ok(Math.abs(plane.width / plane.height - 1.5) < 0.01);
  assert.ok(Math.abs(actor.width / plane.width - 0.24) < 0.01);
  assert.ok(Math.abs(cart.width / plane.width - 0.44) < 0.01);
  assert.ok(
    (await page.locator(".story-line .face-portrait").count()) > 0,
    "dialogue portraits stay present",
  );
  await page.screenshot({ path: `${output}/${name}.png` });
  results.push({ name, stage, talk, actors: await positions(page) });
}

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await openMeeting(page);
  assert.deepEqual(
    (await positions(page)).map((actor) => actor.x),
    [-10, 56],
  );
  assert.equal((await positions(page))[0].visible, "hidden");
  assert.equal((await positions(page))[1].atlas, "adventure");
  await page.screenshot({ path: `${output}/390-leon-waiting.png` });
  await advance(page);
  await page.clock.runFor(1500);
  assert.equal((await positions(page))[0].x, 28);
  for (let i = 1; i < 4; i++) await advance(page);
  await page.clock.runFor(220);
  assert.equal(await page.locator(".story-stage-reaction").first().textContent(), "！");
  assert.match(await page.locator(".story-lines").innerText(), /ずいぶん多くない/);
  await layout(page, "390-surprise");
  for (const [width, height] of [
    [320, 568],
    [844, 390],
    [1280, 960],
  ]) {
    await page.setViewportSize({ width, height });
    await page.clock.runFor(32);
    await layout(page, `${width}-surprise`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (let i = 4; i < 8; i++) await advance(page);
  const mid = (await positions(page))[0].x;
  assert.ok(mid > 28 && mid < 40);
  await advance(page);
  assert.ok(Math.abs((await positions(page))[0].x - mid) < 3, "no jump on rapid advance");
  await page.clock.runFor(1300);
  assert.equal((await positions(page))[0].x, 40);
  await layout(page, "390-close");
  for (let i = 9; i < 12; i++) await advance(page);
  await page.clock.runFor(4000);
  assert.deepEqual(
    (await positions(page)).map((actor) => actor.x),
    [107, 156],
  );
  assert.equal(
    await page.locator(".story-stage-cart").evaluate((el) => parseFloat(el.style.left)),
    139,
  );
  assert.ok((await positions(page)).every((actor) => actor.transform.endsWith("scaleX(1)")));
  await layout(page, "390-departure");
  // Showing the last line alone must not launch the adventure.
  assert.equal(await page.locator(".story-stage").count(), 1);
  await page.locator(".story-conversation").press(" ");
  await page.clock.runFor(200);
  assert.equal(await page.locator(".story-stage").count(), 0);
  await page.getByRole("button", { name: "旅の手帳：ヒント・思い出・アルバム・設定" }).click();
  await page.getByRole("button", { name: /思い出/ }).click();
  await page.getByRole("button", { name: /いつもの待ち合わせ/ }).click();
  await page.clock.runFor(1500);
  assert.deepEqual(
    (await positions(page)).map((actor) => actor.x),
    [-10, 56],
  );
  await context.close();

  const reduced = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const still = await reduced.newPage();
  await openMeeting(still);
  for (let i = 0; i < 4; i++) await advance(still);
  const before = await positions(still);
  await still.clock.runFor(2000);
  assert.deepEqual(await positions(still), before);
  assert.equal(await still.locator(".story-stage-reaction").first().textContent(), "！");
  await layout(still, "390-reduced");
  await reduced.close();
  assert.deepEqual(errors, []);
  writeFileSync(
    `${output}/results.json`,
    JSON.stringify({ results, errors, realDevice: "not-run" }, null, 2),
  );
  console.log(
    `PASS: ${results.length} screenshots; rapid advance, portraits, departure, replay, reduced motion`,
  );
} finally {
  await browser.close();
}
