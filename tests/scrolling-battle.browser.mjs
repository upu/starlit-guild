// Run against a local dev server in a fresh browser context, never a player's profile.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = process.env.TEST_ROOT || "http://localhost:5173";
const output = "work/scrolling-battle-browser";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const errors = [];
const results = [];
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.clock.install();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("prototype-save-sentinel", "untouched");
  });
  await page.goto(`${root}/battle-prototype`);
  await page.locator('.road-canvas[data-status="ready"]').waitFor({ timeout: 60000 });
  await page.waitForTimeout(7500);
  for (const [name, width, height] of [
    ["desktop", 1280, 960],
    ["phone", 390, 844],
    ["small-phone", 320, 568],
    ["landscape", 844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(300);
    const layout = await page.locator(".road-prototype").evaluate((el) => ({
      width: el.clientWidth,
      scrollWidth: el.scrollWidth,
      height: el.clientHeight,
    }));
    assert.ok(layout.scrollWidth <= layout.width + 1, `${name} has horizontal overflow`);
    assert.ok(layout.height <= height + 1, `${name} cannot scroll within viewport`);
    await page.screenshot({ path: `${output}/${name}.png` });
    results.push({ name, ...layout });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "一時停止", exact: true }).click();
  assert.equal(await page.locator("meter").count(), 0);
  const progress = await page.getByRole("progressbar").getAttribute("value");
  await page.waitForTimeout(600);
  assert.equal(await page.getByRole("progressbar").getAttribute("value"), progress);
  assert.equal(await page.locator(".road-assist").isDisabled(), true);
  await page.locator(".road-loadout summary").click();
  await page.getByLabel("アリアの技", { exact: true }).selectOption("rapid");
  await page.getByLabel("レオンの技", { exact: true }).selectOption("guard");
  await page.getByRole("button", { name: "再開", exact: true }).click();
  await page.locator(".road-assist").click();
  await page.getByRole("button", { name: "試作を最初からやり直す" }).click();
  assert.equal(await page.getByLabel("アリアの技", { exact: true }).inputValue(), "rapid");
  await page.locator(".road-loadout summary").click();
  await page.clock.fastForward(150000);
  await page.clock.runFor(500);
  const summary = await page.locator(".road-summary").innerText();
  assert.match(summary, /踏破 [1-9]\d*回/);
  assert.ok((await page.locator(".road-chat-line").count()) >= 4);
  for (const stage of ["trio", "worksite", "cargo", "puppets", "forest"]) {
    await page.getByLabel("試すステージ", { exact: true }).selectOption(stage);
    await page.clock.runFor(
      stage === "worksite" || stage === "cargo" ? 11000 : stage === "puppets" ? 1500 : 4500,
    );
    await page.screenshot({ path: `${output}/stage-${stage}.png` });
    assert.equal(
      await page.locator(".road-chat-title h2").innerText(),
      stage === "forest" ? "道中のふたり" : "道中の三人",
    );
    if (stage !== "forest")
      assert.ok((await page.locator(".road-speaker").allTextContents()).includes("ミラ"));
    await page.clock.fastForward(150000);
    await page.clock.runFor(500);
    assert.match(await page.locator(".road-summary").innerText(), /踏破 [1-9]\d*回/);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.runFor(500);
  await page.locator(".road-prototype").evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.screenshot({ path: `${output}/reduced-motion.png` });
  const storage = await page.evaluate(() => ({ ...localStorage }));
  assert.deepEqual(storage, { "prototype-save-sentinel": "untouched" });
  const recovery = await context.newPage();
  recovery.on("pageerror", (error) => errors.push(error.message));
  await recovery.route("**/animations/road/aria-v1.png", (route) => route.abort());
  await recovery.goto(`${root}/battle-prototype`);
  await recovery.locator('.road-canvas[data-status="error"]').waitFor();
  assert.equal(await recovery.getByRole("progressbar").getAttribute("value"), "0");
  await recovery.unroute("**/animations/road/aria-v1.png");
  await recovery.getByRole("button", { name: "もう一度読み込む" }).click();
  await recovery.locator('.road-canvas[data-status="ready"]').waitFor();
  assert.equal(await recovery.locator("canvas").count(), 1, "retry removes the old canvas");
  await recovery.close();
  assert.deepEqual(errors, []);
  writeFileSync(
    `${output}/results.json`,
    JSON.stringify({ results, summary, storage, errors }, null, 2),
  );
  console.log(JSON.stringify({ results, summary, errors }, null, 2));
  await context.close();
} finally {
  await browser.close();
}
