import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

export async function captureLabCamera(browser, root, baseline = false) {
  const output = baseline ? "work/lab-tenth-before" : "work/lab-fifteenth-after";
  mkdirSync(output, { recursive: true });
  const results = [];
  for (const width of [320, 390, 844]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      deviceScaleFactor: 3,
      reducedMotion: "reduce",
    });
    if (baseline) {
      await context.route(`${root}/guild-lab`, async (route) => {
        const response = await route.fetch();
        await route.fulfill({
          response,
          body: (await response.text()).replaceAll("住人を追う", "寄って見る"),
        });
      });
      for (const [url, file, type] of [
        ["app/guild-lab/room.tsx", "room.js", "text/javascript"],
        ["app/phaser/guild-lab-controller.ts", "controller.js", "text/javascript"],
        ["app/phaser/guild-cutout.ts", "cutout.js", "text/javascript"],
        ["lib/guild-lab-rig.ts", "rig.js", "text/javascript"],
        ["lib/guild-lab-aria-art.ts", "art.js", "text/javascript"],
        ["lib/guild-lab-art.ts", "leon-art.js", "text/javascript"],
        ["lib/guild-lab-arms.ts", "guild-lab-arms.js", "text/javascript"],
        ["lib/guild-lab-model.ts", "guild-lab-model.js", "text/javascript"],
        ["guild/aria-parts-v1.webp", "aria.webp", "image/webp"],
      ])
        await context.route(`**/${url}*`, (route) =>
          route.fulfill({
            contentType: type,
            body: readFileSync(`work/lab-tenth-baseline/${file}`),
          }),
        );
    }
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${root}/guild-lab`);
    await page.locator('[data-status="ready"]').waitFor();
    await page.waitForTimeout(150);
    const canvas = page.locator("canvas");
    await canvas.screenshot({ path: `${output}/initial-${width}.png` });
    if (baseline) {
      await page.getByRole("button", { name: "寄って見る", exact: true }).click();
      await page.waitForTimeout(120);
      await canvas.screenshot({ path: `${output}/residents-${width}.png` });
      await context.close();
      continue;
    }
    const info = async () =>
      canvas.evaluate((c) => ({
        camera: JSON.parse(c.dataset.camera),
        actors: JSON.parse(c.dataset.residentBounds),
        css: [c.clientWidth, c.clientHeight],
        buffer: [c.width, c.height],
        dpr: Math.min(devicePixelRatio, 3),
      }));
    const initial = await info();
    assert.equal(initial.buffer[0], Math.round(initial.css[0] * initial.dpr));
    assert.equal(initial.camera.zoom, width < 600 ? 2.1 : 1);
    if (width === 390)
      assert.ok(
        initial.actors.every((a) => a.cssHeight >= 70),
        "both characters at least 70 CSS pixels",
      );
    const tap = async (x, y) => {
      const { camera, css } = await info();
      const px = ((x - camera.x) * camera.zoom * css[0]) / 768 + css[0] / 2;
      const py = ((y - camera.y) * camera.zoom * css[0]) / 768 + css[1] / 2;
      assert.ok(px >= 0 && px < css[0] && py >= 0 && py < css[1], "target furniture is visible");
      await canvas.click({ position: { x: px, y: py } });
    };
    await tap(320, 350);
    assert.equal(
      await page
        .getByRole("button", { name: "2人でお茶", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    if (width < 600) await page.getByRole("button", { name: "部屋全体", exact: true }).click();
    await page.waitForTimeout(100);
    const room = await info();
    assert.equal(room.camera.zoom, 1);
    await canvas.screenshot({ path: `${output}/room-${width}.png` });
    await tap(560, 160);
    await page.locator('[data-activity="work"]').waitFor();
    await page.getByRole("button", { name: "一時停止", exact: true }).click();
    await page.getByRole("button", { name: "住人を追う", exact: true }).click();
    await page.waitForTimeout(120);
    const residents = await info();
    assert.ok(residents.camera.zoom > 1);
    await tap(560, 160);
    assert.equal(
      await page
        .getByRole("button", { name: "作業台へ", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    const frameKeys = await canvas.evaluate((c) => c.dataset.drawCalls);
    assert.ok(Number(frameKeys) > 0, "filtered textures render after zoom changes");
    results.push({ width, initial, room, residents });
    assert.deepEqual(errors, []);
    assert.deepEqual(await page.evaluate(() => ({ ...localStorage })), {});
    await context.close();
  }
  if (!baseline) writeFileSync(`${output}/camera-sizes.json`, JSON.stringify(results, null, 2));
}
if (process.argv[1].endsWith("guild-lab-camera.browser.mjs")) {
  const browser = await chromium.launch({ headless: true });
  try {
    await captureLabCamera(
      browser,
      process.env.TEST_ROOT || "http://localhost:5174",
      process.argv.includes("--baseline"),
    );
    console.log(
      "PASS: responsive initial view, actual CSS heights, paused camera toggle and furniture taps",
    );
  } finally {
    await browser.close();
  }
}
