import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const root = process.env.TEST_ROOT || "http://localhost:5174";
const output = "work/guild-lab-browser";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [],
  requests = [];
async function start(reducedMotion = "no-preference") {
  const context = await browser.newContext({
    viewport: { width: 1000, height: 1000 },
    deviceScaleFactor: 2,
    reducedMotion,
  });
  await context.addInitScript(() => localStorage.setItem("lab-save-sentinel", "untouched"));
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (/\/api\/(save|backup)/.test(request.url())) requests.push(request.url());
  });
  await page.goto(`${root}/guild-lab`);
  await page.locator('.guild-lab-stage[data-status="ready"]').waitFor();
  return { context, page };
}
const activity = (page, name) =>
  page.locator(`.guild-lab-stage[data-activity="${name}"]`).waitFor({ timeout: 20000 });
const button = (page, name) => page.getByRole("button", { name, exact: true });
try {
  const { context, page } = await start();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${output}/room.png`, fullPage: true });
  await button(page, "寄って見る").click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${output}/tea.png`, fullPage: true });
  const canvas = page.locator("canvas");
  const before = await canvas.screenshot();
  await page.waitForTimeout(1300);
  assert.ok(!before.equals(await canvas.screenshot()), "parts move without full-body frame swaps");
  await button(page, "一時停止").click();
  await page.waitForTimeout(200);
  const paused = await canvas.screenshot();
  await page.waitForTimeout(600);
  assert.ok(paused.equals(await canvas.screenshot()), "pause freezes the complete rig");
  await button(page, "動きを再開").click();
  await button(page, "作業台へ").click();
  await activity(page, "walk");
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${output}/walking.png`, fullPage: true });
  await activity(page, "work");
  await page.screenshot({ path: `${output}/working.png`, fullPage: true });
  await button(page, "タイルと関節を見る").click();
  await page.screenshot({ path: `${output}/joints.png`, fullPage: true });
  await button(page, "タイルと関節を見る").click();
  await button(page, "寄って見る").click();
  // Pointer coordinates still match the world when the canvas is CSS-scaled and DPR=2.
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: (320 / 768) * box.width, y: (395 / 576) * box.height } });
  assert.equal(await button(page, "お茶で休憩").getAttribute("aria-pressed"), "true");
  await activity(page, "tea");
  for (const [width, height] of [
    [320, 640],
    [390, 844],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await button(page, "歩く").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/room-${width}.png` });
  }
  assert.deepEqual(await page.evaluate(() => ({ ...localStorage })), {
    "lab-save-sentinel": "untouched",
  });
  await context.close();
  const reduced = await start("reduce");
  await button(reduced.page, "作業台へ").click();
  await activity(reduced.page, "work");
  const still = await reduced.page.locator("canvas").screenshot();
  await reduced.page.waitForTimeout(700);
  assert.ok(still.equals(await reduced.page.locator("canvas").screenshot()));
  await reduced.page.emulateMedia({ reducedMotion: "no-preference" });
  await reduced.page.waitForTimeout(150);
  assert.equal(
    await reduced.page.locator(".guild-lab-stage").getAttribute("data-activity"),
    "work",
  );
  await reduced.page.reload();
  await reduced.page.locator('.guild-lab-stage[data-status="ready"]').waitFor();
  assert.equal(await reduced.page.locator("canvas").count(), 1);
  await reduced.context.close();
  const fault = await browser.newContext();
  await fault.route("**/guild/leon-parts-v1.webp", (route) => route.abort());
  const recovery = await fault.newPage();
  await recovery.goto(`${root}/guild-lab`);
  await recovery.locator('.guild-lab-stage[data-status="error"]').waitFor();
  await fault.unroute("**/guild/leon-parts-v1.webp");
  await button(recovery, "景色を読み直す").click();
  await recovery.locator('.guild-lab-stage[data-status="ready"]').waitFor();
  assert.equal(await recovery.locator("canvas").count(), 1, "Retry replaces the failed canvas");
  await fault.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  writeFileSync(
    `${output}/results.json`,
    JSON.stringify({ errors, requests, passed: true }, null, 2),
  );
  console.log(
    "PASS: tiled room, articulated motion, pause, furniture input, DPR 2, responsive controls, reduced motion, no save writes",
  );
} finally {
  await browser.close();
}
