// Only synthetic records in new browser contexts; never opens a player's storage.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { testState } from "../lib/game.ts";
import { guildStories } from "../lib/guild-stories.ts";
import { expressionPortrait } from "../lib/portrait-expressions.ts";
import sharp from "sharp";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
// Full Chromium avoids headless-shell compositing black bands on clipped WebGL canvases.
const browser = await chromium.launch({
  channel: "chromium",
  executablePath: process.env.CHROME_PATH,
});
const root = process.env.TEST_ROOT || "http://localhost:5173";
const output = "work/guild-browser";
mkdirSync(output, { recursive: true });
const errors = [],
  results = [];
async function open(stages = 37) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  await context.route("**/app/phaser/home-room-game.ts*", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      "this.art = new HomeRoomArt(scene);",
      "this.art = new HomeRoomArt(scene); window.__home = this;",
    );
    await route.fulfill({ response, body });
  });
  const page = await context.newPage(),
    state = testState(Date.now(), stages, 40, 10000);
  const id = "11111111-1111-4111-8111-111111111111";
  const record = {
    format: 4,
    deviceId: id,
    active: id,
    profiles: [{ id, name: "旅団の画面確認", test: true, state }],
    serial: 0,
    sound: false,
    cloudAt: 0,
  };
  await page.clock.install({ time: new Date(state.updatedAt) });
  await page.clock.setFixedTime(new Date(state.updatedAt));
  await page.addInitScript((save) => {
    if (!localStorage.getItem("starlit-guild-v4"))
      localStorage.setItem("starlit-guild-v4", JSON.stringify(save));
  }, record);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      /\/portraits\/|\/ui\/|\/guild\/|\/home-pixel\/|\/animations\//.test(response.url())
    )
      errors.push(response.url());
  });
  await page.goto(root);
  await page.getByRole("button", { name: "冒険を始める", exact: true }).click();
  await page.clock.runFor(250);
  return { page, context, initialAt: state.updatedAt };
}
async function stateOf(page) {
  await page.clock.runFor(1200);
  return page.evaluate(
    () => JSON.parse(localStorage.getItem("starlit-guild-v4")).profiles[0].state,
  );
}
async function reloadGame(page, at) {
  await page.reload();
  // Reinstall the fixed wall time in the new document. A fixed clock also
  // cannot expire the old document's ownership lease, so use the normal resume
  // control in this isolated test profile instead of waiting for a lease timer.
  await page.clock.setFixedTime(new Date(at));
  assert.equal(await page.evaluate(() => Date.now()), at);
  await page.getByRole("button", { name: "冒険を始める", exact: true }).click();
  const resume = page.getByRole("button", { name: "ここで続ける", exact: true });
  if (await resume.isVisible()) await resume.click();
  await page.clock.runFor(250);
}
async function checkMotion(page) {
  const canvas = page.locator(".home-canvas canvas");
  const before = await canvas.screenshot();
  await page.clock.runFor(6500);
  const after = await canvas.screenshot();
  assert.ok(!before.equals(after), "Phaser animates tea breaks and work");
  await capture(page, "home-tea-motion");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.runFor(100);
  const still = await canvas.screenshot();
  await page.clock.runFor(1500);
  assert.ok(still.equals(await canvas.screenshot()), "reduced motion holds the scene still");
  await page.emulateMedia({ reducedMotion: "no-preference" });
}
async function capture(page, name) {
  await page.clock.runFor(350);
  await page.locator('.home-room[data-status="ready"]').first().waitFor();
  await page.locator('.guild-canvas:not([data-status="ready"])').waitFor({ state: "hidden" });
  await page.locator(".guild-detail[data-state=closed]").waitFor({ state: "hidden" });
  await page.locator(".home-stage").evaluate(async (scene) => {
    const sources = [
      ...Array.from(scene.querySelectorAll("svg image"), (el) => el.getAttribute("href")),
    ];
    await Promise.all(
      [...new Set(sources)].map(async (src) => {
        const image = new Image();
        image.src = src;
        await image.decode();
      }),
    );
  });
  const screenshot = await page.screenshot({ path: `${output}/${name}.png` });
  if (!(await page.locator(".guild-detail").count())) {
    const overflows = await page
      .locator(".phone-guild, .guild-panel, .home-room")
      .evaluateAll((elements) =>
        elements.map((el) => ({ name: el.className, extra: el.scrollHeight - el.clientHeight })),
      );
    assert.ok(
      overflows.every((el) => el.extra <= 1),
      `${name}: guild fits without page scrolling ${JSON.stringify(overflows)}`,
    );
    await checkMarkerPositions(page);
    const canvas = await page.locator(".home-canvas canvas").boundingBox();
    if (canvas.y >= 0 && canvas.y + 40 < page.viewportSize().height) {
      const dpr = await page.evaluate(() => devicePixelRatio);
      const stats = await sharp(screenshot)
        .extract({
          left: Math.round((canvas.x + canvas.width * 0.25) * dpr),
          top: Math.round((canvas.y + 30) * dpr),
          width: 10,
          height: 10,
        })
        .stats();
      assert.ok(
        stats.channels.slice(0, 3).some((c) => c.mean > 15),
        `${name}: scene top is painted`,
      );
    }
  }
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  assert.ok(fits, `${name}: no horizontal overflow`);
  results.push({ name, fits });
}
async function checkMarkerPositions(page) {
  const positions = await page.evaluate(() => {
    const c = window.__home,
      canvas = c.scene.game.canvas,
      rect = canvas.getBoundingClientRect();
    return [...document.querySelectorAll(".home-marker")]
      .filter((b) => getComputedStyle(b).visibility === "visible")
      .map((b) => {
        const r = b.getBoundingClientRect(),
          world = c.scene.cameras.main.getWorldPoint(
            ((r.x + r.width / 2 - rect.x) * canvas.width) / rect.width,
            ((r.y + r.height / 2 - rect.y) * canvas.height) / rect.height,
          );
        const item = c.bridge.read().furniture.find((f) => f.id === b.dataset.homeMarker);
        const picture = c.art.images.get(`f-${item.id}`);
        return {
          dx: world.x - (picture.x + (item.kind === "bench" ? 40 : 48)),
          dy: world.y - (picture.y - (item.kind === "bench" ? 48 : 60)),
        };
      });
  });
  assert.ok(
    positions.every((p) => Math.abs(p.dx) < 1 && Math.abs(p.dy) < 1),
    "markers stay on furniture after resize/zoom/pan",
  );
}
async function checkMarkerZoom(page) {
  await page.getByRole("button", { name: "拡大する", exact: true }).click();
  await page.clock.runFor(150);
  await page.locator(".home-stage").focus();
  for (const key of ["ArrowRight", "ArrowRight", "ArrowRight", "ArrowUp", "ArrowUp"])
    await page.keyboard.press(key);
  await page.clock.runFor(150);
  await checkMarkerPositions(page);
  await page.getByRole("button", { name: "作業台の仕込み", exact: true }).click();
  await page.locator(".guild-detail").waitFor();
  await closeDialog(page);
  await page.getByRole("button", { name: "部屋全体", exact: true }).click();
  await page.clock.runFor(150);
}
async function closeDialog(page) {
  await page.keyboard.press("Escape");
  await page.clock.runFor(350);
  await page.locator(".guild-detail").waitFor({ state: "hidden" });
}
async function tellStory(page, id) {
  const story = guildStories.find((item) => item.id === id);
  for (let i = 0; i < story.lines.length; i++) {
    const line = story.lines[i];
    const row = page.locator(".guild-chat .banter-line").last();
    assert.ok((await row.textContent()).includes(line.text), `${id} line ${i}`);
    if (line.speaker) {
      const expected = expressionPortrait(line.speaker, line.expression);
      const actual = await row.locator('[style*="background-image"]').evaluate((el) => ({
        position: el.style.backgroundPosition,
        image: el.style.backgroundImage,
      }));
      assert.ok(actual.image.includes(expected.src));
      const target = expected.position.split(" ").map(parseFloat);
      assert.ok(
        actual.position
          .split(" ")
          .map(parseFloat)
          .every((n, j) => Math.abs(n - target[j]) < 0.001),
      );
    }
    if (i === 1) {
      await page.getByRole("button", { name: "ショップ", exact: true }).click();
      await page.clock.runFor(10000);
      assert.equal(
        await page.locator(".guild-chat .banter-line").count(),
        i + 1,
        "dialog pauses chat",
      );
      const save = await stateOf(page);
      assert.ok(!save.story.read.includes(id), "partial conversation stays unread");
      await closeDialog(page);
    }
    if (i === story.lines.length - 1) await capture(page, id);
    await page.clock.runFor(Math.max(3500, line.text.length * 100) + 20);
  }
  assert.ok((await stateOf(page)).story.read.includes(id));
}
let activePage;
try {
  const locked = await open(36);
  assert.equal(await locked.page.getByRole("tab", { name: "旅団", exact: true }).count(), 0);
  await locked.context.close();
  const { page, context, initialAt } = await open();
  activePage = page;
  await page.getByRole("tab", { name: "旅団", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "家具を置く・動かす" }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "一時停止", exact: true }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "動きを減らす", exact: true }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "日常", exact: true }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "加工の詳細", exact: true }).count(), 0);
  await capture(page, "overview");
  for (const [width, height] of [
    [320, 640],
    [844, 390],
    [1280, 960],
  ]) {
    await page.setViewportSize({ width, height });
    await capture(page, `home-${width}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator(".home-zoom svg").count(), 1);
  assert.equal(await page.locator(".home-zoom").textContent(), "");
  await checkMarkerZoom(page);
  assert.equal(await page.locator(".guild-toolbar button").count(), 3);
  const density = await page
    .locator(".home-canvas canvas")
    .evaluate((canvas) => canvas.width / canvas.clientWidth);
  assert.ok(Math.abs(density - 2) < 0.02, "canvas keeps device-pixel density");
  await tellStory(page, "guild-waiting-for-a-charm");
  await page.getByRole("button", { name: "ショップ", exact: true }).click();
  for (const name of ["薬草の種", "ニンジンの種", "苔の胞子", "蜂蜜"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.getByRole("button", { name: `${name}を10個購入`, exact: true }).click();
  }
  await capture(page, "shop");
  await page.setViewportSize({ width: 320, height: 640 });
  await page.getByRole("button", { name: "蜂蜜を10個購入", exact: true }).scrollIntoViewIfNeeded();
  await capture(page, "shop-320");
  await page.setViewportSize({ width: 390, height: 844 });
  await closeDialog(page);
  await page.getByRole("button", { name: "菜園", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "プランター 2", exact: true }).count(), 0);
  assert.equal(await page.locator(".guild-plot-card").count(), 1);
  await page.getByRole("button", { name: "プランター 1", exact: true }).click();
  await page.getByRole("button", { name: "リンデの世話係：アリア", exact: true }).click();
  await closeDialog(page);
  for (const [name, crop] of [["プランター 1", "薬草"]]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.getByRole("button", { name: crop, exact: true }).click();
    await page.getByRole("button", { name: "種を買う", exact: true }).click();
    await page.getByRole("button", { name: "← 仕込みに戻る", exact: true }).click();
    assert.equal(
      await page.getByRole("button", { name: crop, exact: true }).getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      await page
        .getByRole("button", { name: "リンデの世話係：アリア", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await capture(page, `plant-${crop}`);
    await page.getByRole("button", { name: "植える", exact: true }).click();
    await closeDialog(page);
  }
  assert.equal(
    await page.getByRole("progressbar").count(),
    1,
    "single planter growth visible on the scene",
  );
  assert.deepEqual(await page.locator(".guild-toolbar button").allTextContents(), [
    "ホーム",
    "菜園",
    "ショップ",
  ]);
  await capture(page, "linde-planted");
  await page.getByRole("button", { name: "ブレッカの栽培所", exact: true }).click();
  await page.getByRole("button", { name: "苔床", exact: true }).click();
  assert.ok(
    await page
      .getByRole("button", { name: "ブレッカの世話係：アリア（リンデの世話係）", exact: true })
      .isDisabled(),
  );
  await page.getByRole("button", { name: "ブレッカの世話係：リコ", exact: true }).click();
  await closeDialog(page);
  await page.getByRole("button", { name: "苔床", exact: true }).click();
  await page.getByRole("button", { name: "植える", exact: true }).click();
  await closeDialog(page);
  await capture(page, "brekka-planted");
  for (const [width, height] of [
    [320, 640],
    [390, 844],
    [844, 390],
    [1280, 960],
  ]) {
    await page.setViewportSize({ width, height });
    await capture(page, `garden-${width}`);
    const widths = await page.evaluate(() => [
      document.querySelector(".guild-panel").clientWidth,
      document.querySelector(".phone-guild").clientWidth,
    ]);
    assert.ok(Math.abs(widths[0] - widths[1]) <= 1, "guild uses the full game frame width");
    const nav = await page.getByRole("tab", { name: "旅団", exact: true }).boundingBox();
    assert.ok(nav && nav.height >= 44 && nav.y + nav.height <= height, "navigation remains usable");
    const toolbar = await page.locator(".guild-toolbar").boundingBox();
    assert.ok(
      toolbar && toolbar.height >= 44 && toolbar.y + toolbar.height <= nav.y + 1,
      "facility icons stay above navigation",
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "旅団ホーム", exact: true }).click();
  await page.getByRole("button", { name: "作業台の仕込み", exact: true }).click();
  await page.getByRole("button", { name: "加工担当：ミラ", exact: true }).click();
  await page.getByRole("button", { name: "薬草と蜂蜜のお茶", exact: true }).click();
  await page.getByRole("button", { name: "材料を買う", exact: true }).click();
  await page.getByRole("button", { name: "← 仕込みに戻る", exact: true }).click();
  assert.equal(
    await page
      .getByRole("button", { name: "薬草と蜂蜜のお茶", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.match(await page.locator(".guild-output-preview").innerText(), /完成すると自動で在庫へ/);
  await page.getByLabel("作る回数（1〜99）").fill("");
  assert.ok(await page.getByRole("button", { name: "加工を始める", exact: true }).isDisabled());
  await page.getByRole("button", { name: "材料がある限りくり返す", exact: true }).click();
  await page.getByRole("button", { name: "加工を始める", exact: true }).click();
  const before = await stateOf(page);
  assert.equal(await page.locator(".guild-workshop canvas").count(), 0);
  assert.equal(await page.locator(".guild-recipes .guild-recipe-choice").count(), 3);
  await capture(page, "workbench");
  await page.setViewportSize({ width: 320, height: 640 });
  await page.getByRole("button", { name: "加工を中止する", exact: true }).scrollIntoViewIfNeeded();
  await capture(page, "workbench-320");
  await page.setViewportSize({ width: 390, height: 844 });
  await closeDialog(page);
  await capture(page, "home-working");
  await checkMotion(page);
  await page.clock.setFixedTime(new Date(initialAt + 30 * 60000));
  await page.getByRole("button", { name: "菜園", exact: true }).click();
  await page.getByRole("button", { name: "リンデの菜園", exact: true }).click();
  await page.clock.runFor(1200);
  const growth = await page
    .getByRole("progressbar", { name: "プランター 1の成長", exact: true })
    .evaluate((el) => el.value);
  assert.ok(growth > 0.6 && growth < 0.7, `growth ${growth}`);
  await capture(page, "linde-growing");
  await page.clock.setFixedTime(new Date(initialAt + 6 * 3600000));
  await reloadGame(page, initialAt + 6 * 3600000);
  const after = await stateOf(page);
  assert.ok(after.guild.cultivation > before.guild.cultivation);
  assert.ok(after.consumables.items["guild-tea"] > 0);
  assert.ok(after.guild.materials["dried-moss"] > 0);
  await page.getByRole("tab", { name: "旅団", exact: true }).click();
  await page.getByRole("button", { name: "菜園", exact: true }).click();
  for (const [site, role] of [
    ["リンデの菜園", "リンデの世話係"],
    ["ブレッカの栽培所", "ブレッカの世話係"],
  ]) {
    await page.getByRole("button", { name: site, exact: true }).click();
    await page
      .getByRole("button", { name: site === "リンデの菜園" ? "プランター 1" : "苔床", exact: true })
      .click();
    await page.getByRole("button", { name: `${role}を外す`, exact: true }).click();
    await closeDialog(page);
  }
  await page.getByRole("button", { name: "旅団ホーム", exact: true }).click();
  assert.ok(
    (await page.locator(".guild-chat").textContent()).includes(guildStories[0].lines[0].text),
  );
  await page.getByRole("button", { name: "菜園", exact: true }).click();
  await page.clock.runFor(60000);
  assert.ok(
    !(await stateOf(page)).story.read.includes("guild-first-harvest"),
    "leaving does not read the conversation",
  );
  await page.getByRole("button", { name: "旅団ホーム", exact: true }).click();
  await tellStory(page, "guild-first-harvest");
  await page.getByRole("button", { name: "旅の手帳：ヒント・思い出・アルバム・設定" }).click();
  await page.locator(".save-status").click();
  assert.equal(await page.getByText("テストプレイ", { exact: true }).count(), 1);
  const saved = await stateOf(page);
  await reloadGame(page, initialAt + 6 * 3600000);
  const loaded = await stateOf(page);
  assert.deepEqual(loaded.guild, saved.guild);
  assert.deepEqual(loaded.consumables, saved.consumables);
  assert.deepEqual(errors, []);
  await context.close();
  writeFileSync(
    `${output}/results.json`,
    JSON.stringify(
      {
        results,
        errors,
        saved: { cultivation: saved.guild.cultivation, crafting: saved.guild.crafting },
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: graphical guild controls, growth, presence chat, pauses, expressions, motion, four viewports, offline resume and persistence",
  );
} catch (error) {
  if (activePage) await activePage.screenshot({ path: `${output}/failure.png` });
  throw error;
} finally {
  await browser.close();
}
