import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
const root = process.env.TEST_ROOT || "http://localhost:5173";
const output = "work/pixel-home";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [],
  sizes = [];
async function setup(width, dpr) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    deviceScaleFactor: dpr,
  });
  await context.route("**/app/phaser/home-room-game.ts*", async (route) => {
    const response = await route.fetch(),
      source = await response.text();
    assert.ok(source.includes("this.art = new HomeRoomArt(scene);"));
    await route.fulfill({
      response,
      body: source.replace(
        "this.art = new HomeRoomArt(scene);",
        "this.art = new HomeRoomArt(scene); window.__home = this;",
      ),
    });
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => failures.push(e.message));
  await page.goto(root + "/guild-lab");
  await page.locator('.home-room[data-status="ready"]').waitFor({ timeout: 60000 });
  await page.waitForTimeout(700);
  return { page, context };
}
async function point(page, x, y) {
  await page.locator("canvas").scrollIntoViewIfNeeded();
  const r = await page.locator("canvas").boundingBox();
  return { x: r.x + (x / 384) * r.width, y: r.y + (y / 312) * r.height };
}
async function clickWorld(page, x, y) {
  const p = await point(page, x, y);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(150);
}
async function fastForward(page, ms) {
  await page.waitForTimeout(120);
  await page.evaluate((ms) => {
    const c = window.__home;
    for (let n = 0; n < ms; n += 33) c.life.tick(33, c.bridge.read().furniture, false);
    c.update(0);
  }, ms);
}
try {
  for (const [width, dpr] of [
    [320, 1],
    [390, 3],
    [844, 2],
    [1000, 1],
  ]) {
    const { page, context } = await setup(width, dpr);
    const size = await page
      .locator("canvas")
      .evaluate((c) => ({ width: c.width, css: c.clientWidth, dpr: devicePixelRatio }));
    assert.equal(size.width, Math.round(size.css * Math.min(3, dpr)));
    sizes.push({ viewport: width, ...size, characterHeight: (60 * size.css) / 384 });
    assert.equal(await page.evaluate(() => window.__home.life.residents.length), 5);
    await page.getByRole("button", { name: "一時停止", exact: true }).click();
    const t = await page.evaluate(() => window.__home.life.time);
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => window.__home.life.time), t);
    const r = await page.evaluate(() => window.__home.life.residents[0]);
    await clickWorld(page, r.x, r.y - 30);
    assert.match(await page.locator(".home-caption").innerText(), /笑顔/);
    // Empty center of workbench, away from its resident.
    await clickWorld(page, 12.7 * 24, 4 * 24);
    assert.equal(
      await page
        .getByRole("button", { name: "道具の手入れ", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await fastForward(page, 30000);
    await page.locator(".home-stage").screenshot({ path: `${output}/home-${width}-dpr${dpr}.png` });
    await page.getByRole("button", { name: "家具を置く・動かす" }).click();
    await page.getByLabel("動かす家具").selectOption("fern");
    await page.getByRole("button", { name: "←に1マス" }).click();
    await page.getByRole("button", { name: "この配置にする" }).click();
    assert.equal(
      await page.evaluate(
        () => window.__home.bridge.read().furniture.find((f) => f.id === "fern").x,
      ),
      13,
    );
    await page.getByRole("button", { name: "家具を置く・動かす" }).click();
    await page.getByLabel("動かす家具").selectOption("fern");
    await clickWorld(page, 8 * 24 + 5, 12 * 24 + 5);
    assert.match(await page.locator('.home-editor [role="status"]').innerText(), /入口/);
    await page.getByRole("button", { name: "取り消す" }).click();
    await page.getByRole("button", { name: "みんなでお茶", exact: true }).click();
    await fastForward(page, 30000);
    assert.ok(
      await page.evaluate(() => window.__home.life.residents.every((r) => r.pose === "tea")),
    );
    await page.locator(".home-stage").screenshot({ path: `${output}/tea-${width}.png` });
    const seated = await page.evaluate(() => {
      const c = window.__home;
      const r = c.life.residents.find((r) => r.seat === 4);
      const image = c.art.images.get(`r-${r.id}`);
      return { x: image.x, y: image.y - 30 };
    });
    await clickWorld(page, seated.x, seated.y);
    assert.match(await page.locator(".home-caption").innerText(), /リコ.*笑顔/);
    await page.getByRole("button", { name: "リンデの菜園", exact: true }).click();
    await page.locator('.home-room[data-status="ready"]').waitFor();
    await page.waitForTimeout(300);
    await page.locator(".home-stage").screenshot({ path: `${output}/garden-${width}.png` });
    await page.getByRole("button", { name: "動きを減らす", exact: true }).click();
    await page.waitForTimeout(100);
    const reduced = await page.evaluate(() => window.__home.life.time);
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.__home.life.time), reduced);
    await page.getByRole("button", { name: "旅団ホーム", exact: true }).click();
    await page.locator('.home-room[data-status="ready"]').waitFor();
    if (width === 390) {
      await page.getByRole("button", { name: "一時停止", exact: true }).click();
      await page.getByRole("button", { name: "みんなでお茶", exact: true }).click();
      const frames = [];
      for (let n = 0; n < 12; n++) {
        await fastForward(page, 120);
        const frame = await page.locator(".home-stage").screenshot();
        frames.push(await sharp(frame).resize(384, 312, { kernel: "nearest" }).png().toBuffer());
      }
      await sharp({ create: { width: 1536, height: 936, channels: 4, background: "#233529" } })
        .composite(
          frames.map((input, n) => ({ input, left: (n % 4) * 384, top: Math.floor(n / 4) * 312 })),
        )
        .png()
        .toFile(`${output}/walk-contact-sheet.png`);
    }
    assert.equal(
      await page.evaluate(() => Object.keys(localStorage).filter((k) => /starlit/.test(k)).length),
      0,
    );
    await context.close();
  }
  const { page, context } = await setup(390, 3);
  await page.route("**/home-pixel/aria.webp", (route) => route.abort());
  await page.reload();
  await page.locator('.home-room[data-status="error"]').waitFor();
  await page.unroute("**/home-pixel/aria.webp");
  await page.getByRole("button", { name: "景色を読み直す" }).click();
  await page.locator('.home-room[data-status="ready"]').waitFor();
  await context.close();
  assert.deepEqual(failures, []);
  writeFileSync(`${output}/measurements.json`, JSON.stringify(sizes, null, 2));
  console.log("PASS pixel home", sizes);
} finally {
  await browser.close();
}
