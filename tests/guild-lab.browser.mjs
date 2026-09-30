import { chromium } from "playwright";
import assert from "node:assert/strict";
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { captureLabAppearance } from "./guild-lab-appearance.browser.mjs";
import { captureLabCamera } from "./guild-lab-camera.browser.mjs";
const root = process.env.TEST_ROOT || "http://localhost:5174";
const output = "work/guild-lab-browser";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [],
  requests = [],
  resolutions = [];
async function start(
  reducedMotion = "no-preference",
  width = 1000,
  dpr = 2,
  inspectJoints = false,
  query = "",
) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    deviceScaleFactor: dpr,
    reducedMotion,
  });
  if (inspectJoints) {
    // Only the isolated dev-server response is altered: production keeps 1.8x
    // and its real clock. Fixed animation times make before/after poses comparable.
    await context.route("**/app/phaser/guild-lab-controller.ts*", async (route) => {
      const response = await route.fetch();
      const source = await response.text();
      assert.ok(
        source.includes("this.camera(controls, step, reduced);") &&
          source.includes("this.elapsed += step;"),
      );
      await route.fulfill({
        response,
        body: source
          .replace(
            "this.camera(controls, step, reduced);",
            `this.camera(controls, step, reduced); if(controls.view === 'residents') this.scene.cameras.main.setZoom(this.scene.game.canvas.width / LAB_WIDTH * 5).centerOn((this.residents[0].actor.root.x+this.residents[1].actor.root.x)/2,(this.residents[0].actor.root.y+this.residents[1].actor.root.y)/2-42.5);`,
          )
          .replace("new LabAffection()", "new LabAffection(() => 0.5)")
          .replace("this.elapsed += step;", "this.elapsed = Number(window.__labCaptureTime ?? 0);"),
      });
    });
  }
  await context.addInitScript(() => localStorage.setItem("lab-save-sentinel", "untouched"));
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (/\/api\/(save|backup)/.test(request.url())) requests.push(request.url());
  });
  await page.goto(`${root}/guild-lab${query}`);
  await page.locator('.guild-lab-stage[data-status="ready"]').waitFor();
  if (await page.getByRole("button", { name: "部屋全体", exact: true }).count())
    await page.getByRole("button", { name: "部屋全体", exact: true }).click();
  return { context, page };
}
const activity = (page, name) =>
  page.locator(`.guild-lab-stage[data-activity="${name}"]`).waitFor({ timeout: 30000 });
const button = (page, name) =>
  page.getByRole("button", {
    name: name === "寄って見る" ? /^(部屋全体|住人を追う)$/ : name,
    exact: true,
  });
async function checkBuffer(page, dpr) {
  await page.waitForFunction(
    (density) => {
      const canvas = document.querySelector("canvas");
      return (
        canvas &&
        canvas.width === Math.round(canvas.clientWidth * density) &&
        canvas.height === Math.round(canvas.clientHeight * density)
      );
    },
    Math.min(3, dpr),
  );
}
async function tapWorld(page, x, y) {
  const canvas = page.locator("canvas"),
    box = await canvas.boundingBox();
  const camera = JSON.parse(await canvas.getAttribute("data-camera"));
  await canvas.click({
    position: {
      x: ((x - camera.x) * camera.zoom * box.width) / 768 + box.width / 2,
      y: ((y - camera.y) * camera.zoom * box.width) / 768 + box.height / 2,
    },
  });
}
async function checkAnimatedFace(page) {
  for (let n = 0; n < 16; n++) {
    await page.waitForTimeout(350);
    const png = await page.locator("canvas").screenshot({ path: `${output}/tea-cycle-${n}.png` });
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    // A cheek interior remains skin throughout the tea/blink cycle. The WebGL
    // multi-texture regression replaces this area with rectangular floor tiles.
    const i =
      (Math.round((info.height * 348) / 723) * info.width + Math.round((info.width * 488) / 964)) *
      info.channels;
    assert.ok(
      data[i] > 220 && data[i + 1] > 170 && data[i + 2] > 140,
      `face is intact in animation sample ${n}`,
    );
  }
}
async function checkResolutionAndQuality() {
  for (const dpr of [1, 2, 3, 4]) {
    const { context, page } = await start("reduce", 390, dpr);
    for (const width of [320, 390, 844, 1000]) {
      await page.setViewportSize({ width, height: 1000 });
      await checkBuffer(page, dpr);
      resolutions.push(
        await page.locator("canvas").evaluate((canvas) => ({
          dpr: window.devicePixelRatio,
          css: [canvas.clientWidth, canvas.clientHeight],
          buffer: [canvas.width, canvas.height],
        })),
      );
      await tapWorld(page, 560, 160);
      await activity(page, "work");
      assert.equal(await button(page, "作業台へ").getAttribute("aria-pressed"), "true");
      await tapWorld(page, 400, 450);
      assert.equal(
        await button(page, "作業台へ").getAttribute("aria-pressed"),
        "true",
        "empty floor is outside furniture hit areas",
      );
      await tapWorld(page, 320, 350);
      await activity(page, "tea");
      assert.equal(await button(page, "2人でお茶").getAttribute("aria-pressed"), "true");
      if ((width === 390 && dpr === 3) || (width === 1000 && dpr === 1)) {
        await page.locator("canvas").screenshot({ path: `${output}/${width}-${dpr}-room.png` });
        await button(page, "寄って見る").click();
        await page.locator("canvas").screenshot({ path: `${output}/${width}-${dpr}-close.png` });
        await page.emulateMedia({ reducedMotion: "no-preference" });
        if (dpr === 1) await checkAnimatedFace(page);
        await button(page, "2人で歩く").click();
        await activity(page, "walk");
        await page.waitForTimeout(1200);
        await page.locator("canvas").screenshot({ path: `${output}/${width}-${dpr}-walk.png` });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await button(page, "2人でお茶").click();
        await activity(page, "tea");
        await button(page, "寄って見る").click();
      }
    }
    await button(page, "作業台へ").click();
    await activity(page, "work");
    await button(page, "2人で歩く").click();
    await activity(page, "idle");
    await button(page, "寄って見る").click();
    // The close camera follows both residents at the left aisle stop.
    await tapWorld(page, 310, 350);
    await activity(page, "tea");
    await context.close();
  }
}
async function captureJoints() {
  const { context, page } = await start("no-preference", 390, 3, true);
  await page.setViewportSize({ width: 390, height: 844 });
  await button(page, "寄って見る").click();
  const capture = async (name, time) => {
    await page.evaluate((value) => {
      window.__labCaptureTime = value;
    }, time);
    await page.waitForTimeout(80);
    await page.locator("canvas").screenshot({ path: `${output}/joints-5x-${name}.png` });
  };
  await capture("tea", 0);
  await capture("sip", 5000);
  await capture("blink", 4570);
  await button(page, "タイルと関節を見る").click();
  await capture("tea-debug", 0);
  await button(page, "タイルと関節を見る").click();
  await button(page, "作業台へ").click();
  await activity(page, "walk");
  await button(page, "一時停止").click();
  for (let time = 0; time < 900; time += 50) await capture(`walk-${time}`, time);
  const cells = await Promise.all(
    Array.from({ length: 18 }, async (_, n) => ({
      input: await sharp(`${output}/joints-5x-walk-${n * 50}.png`)
        .resize(366, 274)
        .png()
        .toBuffer(),
      left: (n % 6) * 366,
      top: Math.floor(n / 6) * 274,
    })),
  );
  await sharp({ create: { width: 2196, height: 822, channels: 4, background: "#32281e" } })
    .composite(cells)
    .png()
    .toFile(`${output}/walk-cycle.png`);
  await button(page, "タイルと関節を見る").click();
  for (const time of [0, 112.5, 225, 337.5, 450, 562.5, 675, 787.5])
    await capture(`walk-debug-${time}`, time);
  await capture("walk-debug", 225);
  await button(page, "タイルと関節を見る").click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await activity(page, "work");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const time of [0, 345, 690]) await capture(`work-${time}`, time);
  await button(page, "タイルと関節を見る").click();
  await capture("work-debug", 0);
  assert.deepEqual(await page.evaluate(() => ({ ...localStorage })), {
    "lab-save-sentinel": "untouched",
  });
  await context.close();
}
async function checkAffection() {
  const { context, page } = await start("no-preference", 390, 3, true);
  await page.setViewportSize({ width: 390, height: 844 });
  await button(page, "寄って見る").click();
  const canvas = page.locator("canvas");
  const time = async (value) => {
    await page.evaluate((t) => {
      window.__labCaptureTime = t;
    }, value);
    await page.waitForTimeout(100);
  };
  const shot = async (name) => canvas.screenshot({ path: `${output}/affection-${name}.png` });
  await time(5000);
  await shot("sip");
  await time(6800);
  assert.equal(await canvas.getAttribute("data-expression"), "neutral");
  assert.equal(await canvas.getAttribute("data-mark"), "thought");
  await shot("tea-sharing");
  await time(8200);
  await canvas.click({ position: { x: 75, y: 150 } });
  assert.equal(await canvas.getAttribute("data-expression"), "surprised");
  await shot("tap-surprised");
  assert.equal(
    await button(page, "2人でお茶").getAttribute("aria-pressed"),
    "true",
    "actor tap does not activate overlapping furniture",
  );
  await time(8650);
  assert.equal(await canvas.getAttribute("data-expression"), "smile");
  await shot("tap-smile");
  await time(8750);
  await canvas.click({ position: { x: 75, y: 150 } });
  assert.equal(await canvas.getAttribute("data-expression"), "shy");
  await shot("tap-shy");
  await time(10000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await button(page, "2人で歩く").click();
  await activity(page, "idle");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await time(25100);
  await time(25800);
  assert.equal(await canvas.getAttribute("data-gesture"), "stretch");
  await shot("stretch");
  await time(36200);
  assert.equal(await canvas.getAttribute("data-expression"), "yawn");
  await shot("yawn");
  await time(38600);
  assert.equal(await canvas.getAttribute("data-expression"), "tired");
  await shot("sleepy");
  await button(page, "レオンに声をかける").click();
  assert.equal(await canvas.getAttribute("data-expression"), "surprised");
  await shot("wake");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await time(39100);
  assert.equal(await canvas.getAttribute("data-expression"), "smile");
  await shot("reduced-smile");
  const still = await canvas.screenshot();
  await page.waitForTimeout(500);
  assert.ok(
    still.equals(await canvas.screenshot()),
    "reduced reactions keep face and mark but no jumping or particles",
  );
  assert.deepEqual(await page.evaluate(() => ({ ...localStorage })), {
    "lab-save-sentinel": "untouched",
  });
  await context.close();
}
async function capturePairAndLoad() {
  const { context, page } = await start("no-preference", 390, 3, true);
  await page.setViewportSize({ width: 390, height: 844 });
  await button(page, "寄って見る").click();
  const canvas = page.locator("canvas");
  for (const [name, time, beat] of [
    ["tea", 0, "sip"],
    ["push", 6500, "push"],
    ["take", 8500, "take"],
    ["offer", 12000, "offer"],
    ["surprised", 13800, "surprised"],
    ["shy", 15000, "shy"],
    ["accept", 17000, "accept"],
  ]) {
    await page.evaluate((value) => {
      window.__labCaptureTime = value;
    }, time);
    await page.waitForTimeout(120);
    assert.equal(await canvas.getAttribute("data-beat"), beat);
    await canvas.screenshot({ path: `${output}/pair-5x-${name}.png` });
  }
  await page.evaluate(() => {
    window.__labCaptureTime = 8500;
  });
  await page.waitForTimeout(100);
  await canvas.click({ position: { x: 290, y: 150 } });
  assert.equal(await canvas.getAttribute("data-tapped"), "aria");
  assert.equal(await canvas.getAttribute("data-aria-expression"), "surprised");
  assert.notEqual(await canvas.getAttribute("data-expression"), "surprised");
  await canvas.screenshot({ path: `${output}/pair-5x-aria-tap-during-share.png` });
  await page.evaluate(() => {
    window.__labCaptureTime = 21000;
  });
  await page.waitForTimeout(100);
  await canvas.click({ position: { x: 290, y: 150 } });
  assert.equal(await canvas.getAttribute("data-aria-expression"), "surprised");
  await canvas.screenshot({ path: `${output}/pair-5x-aria-tap.png` });
  await page.evaluate(() => {
    window.__labCaptureTime = 24000;
  });
  await page.waitForTimeout(100);
  await canvas.click({ position: { x: 95, y: 150 } });
  await page.evaluate(() => {
    window.__labCaptureTime = 24250;
  });
  await page.waitForTimeout(100);
  assert.equal(await canvas.getAttribute("data-tapped"), "leon");
  assert.equal(await canvas.getAttribute("data-expression"), "surprised");
  assert.notEqual(await canvas.getAttribute("data-aria-expression"), "surprised");
  assert.equal(await canvas.getAttribute("data-aria-mark"), "none");
  await canvas.screenshot({ path: `${output}/pair-5x-leon-tap.png` });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await button(page, "アリアが寄り道").click();
  await page.waitForTimeout(120);
  assert.equal(await canvas.getAttribute("data-aria-mark"), "notice");
  await canvas.screenshot({ path: `${output}/pair-5x-detour.png` });
  await context.close();

  const load = [];
  for (const count of [2, 4, 8]) {
    const sample = await start(
      "no-preference",
      390,
      3,
      false,
      count === 2 ? "" : `?actors=${count}`,
    );
    const target = sample.page.locator("canvas");
    await sample.page.waitForTimeout(500);
    const frames = [];
    for (let n = 0; n < 40; n++) {
      frames.push(
        await target.evaluate((element) => ({
          drawCalls: Number(element.dataset.drawCalls),
          frameMs: Number(element.dataset.frameMs),
        })),
      );
      await sample.page.waitForTimeout(35);
    }
    const median = (key) => frames.map((frame) => frame[key]).sort((a, b) => a - b)[20];
    const p95 = (key) => frames.map((frame) => frame[key]).sort((a, b) => a - b)[38];
    assert.ok(median("drawCalls") > 0);
    load.push({
      actors: count,
      drawCalls: { median: median("drawCalls"), p95: p95("drawCalls") },
      frameMs: { median: median("frameMs"), p95: p95("frameMs") },
    });
    await target.screenshot({ path: `${output}/load-${count}.png` });
    await sample.context.close();
  }
  assert.ok(
    load[0].drawCalls.median < load[1].drawCalls.median &&
      load[1].drawCalls.median < load[2].drawCalls.median,
  );
  writeFileSync(`${output}/load-results.json`, JSON.stringify(load, null, 2));
}
try {
  await checkAffection();
  await captureJoints();
  await capturePairAndLoad();
  await captureLabAppearance(browser, root, `${output}/aria-appearance-5x`);
  await captureLabCamera(browser, root);
  await checkResolutionAndQuality();
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
  await canvas.click({ position: { x: (320 / 768) * box.width, y: (350 / 576) * box.height } });
  assert.equal(await button(page, "2人でお茶").getAttribute("aria-pressed"), "true");
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
    await button(page, "2人で歩く").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/room-${width}.png` });
  }
  assert.deepEqual(await page.evaluate(() => ({ ...localStorage })), {
    "lab-save-sentinel": "untouched",
  });
  await context.close();
  const reduced = await start("reduce", 1000, 2, true);
  await button(reduced.page, "作業台へ").click();
  await activity(reduced.page, "work");
  // Expressions may change in reduced motion. Keep the same work expression
  // while advancing the pose clock, so this comparison tests movement alone.
  await reduced.page.evaluate(() => {
    window.__labCaptureTime = 200;
  });
  await reduced.page.waitForTimeout(80);
  const still = await reduced.page.locator("canvas").screenshot();
  await reduced.page.evaluate(() => {
    window.__labCaptureTime = 800;
  });
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
  await fault.route("**/guild/leon-parts-v3.webp", (route) => route.abort());
  const recovery = await fault.newPage();
  await recovery.goto(`${root}/guild-lab`);
  await recovery.locator('.guild-lab-stage[data-status="error"]').waitFor();
  await fault.unroute("**/guild/leon-parts-v3.webp");
  await button(recovery, "景色を読み直す").click();
  await recovery.locator('.guild-lab-stage[data-status="ready"]').waitFor();
  assert.equal(await recovery.locator("canvas").count(), 1, "Retry replaces the failed canvas");
  await fault.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  writeFileSync(
    `${output}/results.json`,
    JSON.stringify({ errors, requests, resolutions, passed: true }, null, 2),
  );
  console.log(
    "PASS: tiled room, articulated motion, pause, furniture input, DPR 1/2/3 with cap 3, buffer sizes, responsive controls, reduced motion, no save writes",
  );
} finally {
  await browser.close();
}
