import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const root = process.env.TEST_ROOT ?? "http://localhost:5173";
const out = "work/pixel-home/sprite-lab";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400 && r.url().includes("/home-pixel/")) errors.push(r.url());
  });
  await page.goto(`${root}/sprite-lab`);
  await page.getByRole("heading", { name: "ドット絵見本帳", exact: true }).waitFor();
  const saved = await page.evaluate(() => JSON.stringify(localStorage));
  assert.equal(await page.locator(".sprite-lab-card").count(), 4);
  for (const width of [320, 390, 1000]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${out}/catalogue-${width}.png`, fullPage: true });
    await page.locator(".sprite-lab-note").scrollIntoViewIfNeeded();
    assert.ok(
      await page
        .locator(".sprite-lab-note")
        .evaluate((e) => e.getBoundingClientRect().bottom <= innerHeight),
    );
    await page.screenshot({ path: `${out}/catalogue-bottom-${width}.png` });
    await page.locator(".sprite-lab-index").evaluate((e) => {
      e.scrollTop = 0;
    });
  }
  for (const motion of ["walk", "tea", "work", "garden"]) {
    await page.locator(`.sprite-lab-card[href='/sprite-lab/${motion}']`).click();
    await page.locator('main[data-ready="true"]').waitFor();
    const current = page.locator('.sprite-lab-navigation [aria-current="page"]');
    assert.equal(await current.getAttribute("href"), `/sprite-lab/${motion}`);
    await page
      .getByRole("button", { name: motion === "walk" ? "次のコマ" : "次の姿勢", exact: true })
      .click();
    await page.setViewportSize({ width: 390, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${out}/${motion}-390.png`, fullPage: true });
    await page.locator("main").evaluate((e) => {
      e.scrollTop = e.scrollHeight;
    });
    assert.ok(
      await page.locator("main").evaluate((e) => e.getBoundingClientRect().bottom <= innerHeight),
    );
    await page.screenshot({ path: `${out}/${motion}-bottom-390.png` });
    await page
      .getByRole("navigation", { name: "ドット絵見本帳" })
      .getByRole("link", { name: "見本帳", exact: true })
      .click();
    await page.locator(".sprite-lab-card").first().waitFor();
  }
  for (const motion of ["walk", "tea", "work", "garden"]) {
    await page.goto(`${root}/guild-lab/${motion}-study`);
    await page.waitForURL(`${root}/sprite-lab/${motion}`);
    await page.locator('main[data-ready="true"]').waitFor();
  }
  assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), saved);
  assert.deepEqual(errors, []);
  console.log(
    "Sprite catalogue: navigation, mobile widths, legacy redirects, assets and no save writes PASS",
  );
} finally {
  await browser.close();
}
