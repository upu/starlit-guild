import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { teaStudy } from "../lib/home-tea-study.ts";
const out = "work/pixel-home/tea-study";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1300 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${process.env.TEST_ROOT ?? "http://localhost:5173"}/guild-lab/tea-study`);
  await page.locator('.tea-study[data-ready="true"]').waitFor();
  const saved = await page.evaluate(() => JSON.stringify(localStorage));
  const time = () => page.locator(".tea-phase").getAttribute("data-time");
  await page.getByRole("button", { name: "前の姿勢", exact: true }).click();
  assert.equal(await time(), String(teaStudy.duration - teaStudy.step));
  await page.getByRole("button", { name: "次の姿勢", exact: true }).click();
  assert.equal(await time(), "0");
  await page.getByRole("button", { name: "再生", exact: true }).click();
  await page.waitForFunction(() => Number(document.querySelector(".tea-phase").dataset.time) > 200);
  await page.getByRole("button", { name: "一時停止", exact: true }).click();
  const stopped = await time();
  await page.waitForTimeout(200);
  assert.equal(await time(), stopped);
  await page.getByLabel("関節と座面").check();
  assert.equal(await page.locator(".tea-sheet button").count(), 4);
  for (let i = 0; i < teaStudy.phases; i++) {
    await page.locator(".tea-sheet button").nth(i).click();
    assert.equal(await time(), String((i + 0.5) * 2000));
    await page.locator(".tea-live").screenshot({ path: `${out}/pose-${i + 1}.png` });
  }
  await page.locator(".tea-sheet").screenshot({ path: `${out}/all-poses.png` });
  await page.getByLabel("動きをゆっくり追う").fill("4000");
  assert.equal(await time(), "4000");
  await page.getByLabel("動きを減らす").check();
  assert.equal(await page.getByRole("button", { name: "再生", exact: true }).isDisabled(), true);
  await page.waitForTimeout(200);
  assert.equal(await time(), "4000");
  await page.getByLabel("動きを減らす").uncheck();
  await page.getByRole("button", { name: "再生", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => document.querySelector(".tea-controls button").disabled);
  const reduced = await time();
  await page.waitForTimeout(200);
  assert.equal(await time(), reduced);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const width of [320, 390, 844, 1000]) {
    await page.setViewportSize({ width, height: 1100 });
    await page.locator(".tea-sheet button").nth(2).click();
    const fits = await page.locator(".tea-study").evaluate((el) => {
      el.scrollTop = 0;
      return el.scrollWidth <= el.clientWidth;
    });
    assert.ok(fits, `overflow at ${width}`);
    await page.screenshot({ path: `${out}/page-${width}.png` });
  }
  assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), saved);
  assert.deepEqual(errors, []);
  console.log(
    "Tea study: playback, steps, scrubber, reduced motion, 4 widths, no save writes PASS",
  );
} finally {
  await browser.close();
}
