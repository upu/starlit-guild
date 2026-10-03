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
    await clickWorld(page, 13.7 * 24, 4 * 24);
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
    await page.getByRole("button", { name: "塔の栽培所", exact: true }).click();
    await page.locator('.home-room[data-status="ready"]').waitFor();
    await page.waitForTimeout(300);
    await page.locator(".home-stage").screenshot({ path: `${output}/brekka-${width}.png` });
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
      const walkFrames = [];
      await page.evaluate(() => {
        window.__home.art.furniture = () => {};
      });
      for (let frame = 0; frame < 8; frame++) {
        const actual = await page.evaluate((frame) => {
          const c = window.__home;
          c.life.residents.forEach((r, i) => {
            Object.assign(r, {
              x: 40 + i * 76,
              y: 298,
              left: false,
              rear: false,
              pose: "walk",
              walkDistance: frame * 3,
              greetUntil: 0,
              path: [],
            });
          });
          c.update(0);
          return c.life.residents.map((r) => {
            const image = c.art.images.get(`r-${r.id}`);
            return {
              frame: image.frame.name,
              pixels: image.frame.width,
              width: image.displayWidth,
            };
          });
        }, frame);
        for (const image of actual) {
          assert.equal(image.frame, frame);
          assert.equal(image.pixels, 320);
          assert.equal(image.width, 80);
        }
        const capture = await page.locator(".home-stage").screenshot();
        const { width: w, height: h } = await sharp(capture).metadata();
        walkFrames.push(
          await sharp(capture)
            .extract({
              left: 0,
              top: Math.round((h * 218) / 312),
              width: w,
              height: Math.round((h * 84) / 312),
            })
            .png()
            .toBuffer(),
        );
      }
      const row = await sharp(walkFrames[0]).metadata();
      await sharp({
        create: { width: row.width, height: row.height * 8, channels: 4, background: "#233529" },
      })
        .composite(walkFrames.map((input, n) => ({ input, left: 0, top: n * row.height })))
        .png()
        .toFile(`${output}/walk-eight-poses.png`);
      await captureNewActions(page);
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

async function captureNewActions(page) {
  const captures = [];
  const cases = [
    ...Array.from({ length: 6 }, (_, i) => ({ pose: "walk", distance: i * 4, time: 0 })),
    { pose: "tea", distance: 0, time: 1000 },
    { pose: "tea", distance: 0, time: 4800 },
    { pose: "craft", distance: 0, time: 0 },
    { pose: "craft", distance: 0, time: 500 },
    { pose: "paper", distance: 0, time: 0 },
    { pose: "paper", distance: 0, time: 1200 },
  ];
  for (const sample of cases) {
    const images = await page.evaluate((sample) => {
      const c = window.__home;
      c.life.time = sample.time;
      c.life.residents.forEach((r, i) =>
        Object.assign(r, {
          x: 40 + i * 76,
          y: 298,
          rear: true,
          left: true,
          pose: sample.pose,
          walkDistance: sample.distance,
          phase: 0,
          seat: 0,
          greetUntil: 0,
          path: [],
        }),
      );
      c.update(0);
      return c.life.residents.map((r) => {
        const image = c.art.images.get(`r-${r.id}`);
        return { id: r.id, texture: image.texture.key, flip: image.flipX, frame: image.frame.name };
      });
    }, sample);
    for (const image of images) {
      assert.equal(image.texture, `/home-pixel/${image.id}-actions.webp`);
      if (sample.pose !== "tea")
        assert.equal(image.flip, false, "work/rear sprites must never swap hands");
    }
    const capture = await page.locator(".home-stage").screenshot();
    const { width, height } = await sharp(capture).metadata();
    captures.push(
      await sharp(capture)
        .extract({
          left: 0,
          top: Math.round((height * 218) / 312),
          width,
          height: Math.round((height * 84) / 312),
        })
        .png()
        .toBuffer(),
    );
  }
  const row = await sharp(captures[0]).metadata();
  await sharp({
    create: {
      width: row.width,
      height: row.height * captures.length,
      channels: 4,
      background: "#233529",
    },
  })
    .composite(captures.map((input, n) => ({ input, left: 0, top: n * row.height })))
    .png()
    .toFile(`${output}/rear-chair-work-poses.png`);
  // A loop as well as a contact sheet, for judging position changes over time.
  const front = await sharp(`${output}/walk-eight-poses.png`)
    .raw()
    .toBuffer({ resolveWithObject: true });
  await sharp(front.data, {
    raw: {
      width: front.info.width,
      height: front.info.height,
      channels: front.info.channels,
      pageHeight: front.info.height / 8,
    },
  })
    .webp({ loop: 0, delay: 100, lossless: true })
    .toFile(`${output}/walk-aligned-loop.webp`);
}
