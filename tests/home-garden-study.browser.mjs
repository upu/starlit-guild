import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
const out = "work/pixel-home/garden-study";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1100 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.studyWrites = 0;
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (...args) {
      window.studyWrites++;
      return set.apply(this, args);
    };
  });
  await page.goto(`${process.env.TEST_ROOT ?? "http://localhost:5173"}/guild-lab/garden-study`);
  await page.locator('.garden-study[data-ready="true"]').waitFor();
  const time = () => page.locator(".garden-phase").getAttribute("data-time");
  await page.getByRole("button", { name: "前の姿勢", exact: true }).click();
  assert.equal(await time(), "1800");
  await page.getByRole("button", { name: "次の姿勢", exact: true }).click();
  assert.equal(await time(), "0");
  assert.equal(await page.getByRole("button", { name: "植物を見る", exact: true }).count(), 0);
  for (const left of [false, true]) {
    await page
      .getByRole("button", { name: left ? "左利き（リコ）" : "右利き", exact: true })
      .click();
    assert.equal(
      await page.locator(".garden-phase").getAttribute("data-hand"),
      left ? "left" : "right",
    );
    for (let i = 0; i < 4; i++) {
      await page.locator(".garden-sheet button").nth(i).click();
      assert.equal(await time(), String(i * 600));
      assert.equal(await page.locator(".garden-live [data-water]").count(), i === 2 ? 1 : 0);
      await page
        .locator(".garden-live")
        .screenshot({ path: `${out}/water-${left ? "left" : "right"}-${i + 1}.png` });
    }
    await page
      .locator(".garden-sheet")
      .screenshot({ path: `${out}/water-${left ? "left" : "right"}-poses.png` });
  }
  for (const name of ["レオン", "アリア", "ミラ", "フィン", "リコ"]) {
    await page.getByRole("button", { name, exact: true }).click();
    const id = await page.locator(".garden-resident-live").getAttribute("data-resident");
    for (let i = 0; i < 4; i++) {
      await page.locator(".garden-resident-sheet button").nth(i).click();
      assert.equal(await time(), String(i * 600));
      assert.equal(
        await page
          .locator(".garden-resident-live .garden-resident-sprite")
          .first()
          .getAttribute("data-frame"),
        String(i),
      );
      assert.equal(
        await page.locator(".garden-resident-live .garden-resident-water rect").count(),
        i === 2 ? 12 : 0,
      );
      if (i === 2) {
        const landing = await page
          .locator(".garden-resident-water")
          .first()
          .evaluate((svg) => {
            const root = svg.querySelector("[data-root]"),
              x = Number(root.getAttribute("cx")),
              y = Number(root.getAttribute("cy")) - 1;
            return Math.min(
              ...[...svg.querySelectorAll("[data-drop]")].map((p) =>
                Math.hypot(Number(p.getAttribute("x")) - x, Number(p.getAttribute("y")) - y),
              ),
            );
          });
        assert.ok(landing < 3, `${id}: water reaches the root in the actual preview`);
        assert.equal(await page.locator(".garden-resident-live [data-splash]").count(), 2);
      }
      await page.locator(".garden-resident-live").screenshot({ path: `${out}/${id}-${i + 1}.png` });
    }
    await page.locator(".garden-resident-sheet").screenshot({ path: `${out}/${id}-poses.png` });
  }
  assert.deepEqual(
    await page
      .locator(".garden-live [data-layer]")
      .evaluateAll((es) => es.map((e) => e.dataset.layer)),
    ["far-arm", "body", "near-arm"],
  );
  await page.getByLabel("関節を見る").check();
  await page.getByLabel("滑らかにつなぐ").check();
  await page.getByRole("button", { name: "再生", exact: true }).click();
  await page.waitForFunction(
    () => Number(document.querySelector(".garden-phase").dataset.time) > 1900,
  );
  await page.getByRole("button", { name: "一時停止", exact: true }).click();
  const paused = await time();
  await page.waitForTimeout(150);
  assert.equal(await time(), paused);
  await page.getByLabel("動きをゆっくり追う").fill("1200");
  assert.equal(await page.locator(".garden-live [data-water]").count(), 1);
  await page.getByLabel("動きを減らす", { exact: true }).check();
  assert.equal(await page.getByRole("button", { name: "再生", exact: true }).isDisabled(), true);
  assert.equal(await page.locator(".garden-live [data-water]").count(), 0);
  await page.getByLabel("動きを減らす", { exact: true }).uncheck();
  await page.getByRole("button", { name: "再生", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => document.querySelector(".garden-study button:disabled"));
  const reduced = await time();
  await page.waitForTimeout(150);
  assert.equal(await time(), reduced);
  for (const width of [320, 390, 844, 1000]) {
    await page.setViewportSize({ width, height: 1100 });
    assert.ok(
      await page.locator(".garden-study").evaluate((e) => {
        e.scrollTop = 0;
        return e.scrollWidth <= e.clientWidth;
      }),
    );
    await page.screenshot({ path: `${out}/page-${width}.png` });
  }
  assert.equal(await page.evaluate(() => window.studyWrites), 0);
  assert.deepEqual(errors, []);
  console.log(
    "Garden study: watering only, both hands, 4 poses, playback, reduced motion, 4 widths, no save writes PASS",
  );
} finally {
  await browser.close();
}
