import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
const out = "work/pixel-home/work-study";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1100 } }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${process.env.TEST_ROOT ?? "http://localhost:5173"}/guild-lab/work-study`);
  await page.locator('.work-study[data-ready="true"]').waitFor();
  const saved = await page.evaluate(() => JSON.stringify(localStorage));
  const time = () => page.locator(".work-phase").getAttribute("data-time");
  await page.getByRole("button", { name: "前の姿勢", exact: true }).click();
  assert.equal(await time(), "1200");
  await page.getByRole("button", { name: "次の姿勢", exact: true }).click();
  assert.equal(await time(), "0");
  await page.getByRole("button", { name: "再生", exact: true }).click();
  await page.waitForFunction(
    () => Number(document.querySelector(".work-phase").dataset.time) > 100,
  );
  await page.getByRole("button", { name: "一時停止", exact: true }).click();
  const stopped = await time();
  await page.waitForTimeout(120);
  assert.equal(await time(), stopped);
  await page.getByLabel("関節を見る").check();
  for (const left of [false, true]) {
    await page
      .getByRole("button", { name: left ? "左利き（リコ）" : "右利き", exact: true })
      .click();
    assert.equal(
      await page.locator(".work-phase").getAttribute("data-hand"),
      left ? "left" : "right",
    );
    for (let i = 0; i < 4; i++) {
      await page.locator(".work-sheet button").nth(i).click();
      assert.equal(await time(), String(i * 400));
      await page
        .locator(".work-live")
        .screenshot({ path: `${out}/${left ? "left" : "right"}-${i + 1}.png` });
    }
    await page
      .locator(".work-sheet")
      .screenshot({ path: `${out}/${left ? "left" : "right"}-poses.png` });
  }
  await page.getByLabel("滑らかにつなぐ").check();
  for (const id of ["レオン", "アリア", "ミラ", "フィン", "リコ"]) {
    await page.getByRole("button", { name: id, exact: true }).click();
    const actor = await page.locator(".work-resident-live").getAttribute("data-resident");
    assert.equal(
      await page.locator(".work-resident-live").getAttribute("data-hand"),
      id === "リコ" ? "left" : "right",
    );
    for (let i = 0; i < 4; i++) {
      await page.locator(".work-resident-sheet button").nth(i).click();
      assert.equal(await time(), String(i * 400));
      assert.equal(
        await page
          .locator(".work-resident-live .work-resident-sprite")
          .first()
          .getAttribute("data-frame"),
        String(i),
      );
      await page
        .locator(".work-resident-live")
        .screenshot({ path: `${out}/${actor}-${i + 1}.png` });
    }
    await page.locator(".work-resident-sheet").screenshot({ path: `${out}/${actor}-poses.png` });
  }
  await page.getByRole("button", { name: "事務机で比較", exact: true }).click();
  assert.equal(await page.locator(".work-resident-live").getAttribute("data-furniture"), "desk");
  await page.locator(".work-resident-live").screenshot({ path: `${out}/desk-comparison.png` });
  await page.getByLabel("動きをゆっくり追う").fill("650");
  assert.equal(await time(), "650");
  await page.getByLabel("動きを減らす", { exact: true }).check();
  assert.equal(await page.getByRole("button", { name: "再生", exact: true }).isDisabled(), true);
  await page.waitForTimeout(120);
  assert.equal(await time(), "650");
  await page.getByLabel("動きを減らす", { exact: true }).uncheck();
  await page.getByRole("button", { name: "再生", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => document.querySelector(".work-study button:disabled"));
  const reduced = await time();
  await page.waitForTimeout(120);
  assert.equal(await time(), reduced);
  for (const width of [320, 390, 844, 1000]) {
    await page.setViewportSize({ width, height: 1100 });
    assert.ok(
      await page.locator(".work-study").evaluate((e) => {
        e.scrollTop = 0;
        return e.scrollWidth <= e.clientWidth;
      }),
    );
    await page.screenshot({ path: `${out}/page-${width}.png` });
  }
  assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), saved);
  assert.deepEqual(errors, []);
  console.log(
    "Work study: 4 poses, hands, playback, scrub, reduced motion, 4 widths, no save writes PASS",
  );
} finally {
  await browser.close();
}
