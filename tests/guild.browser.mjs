// Only synthetic records in new browser contexts; never opens a player's storage.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { testState } from "../lib/game.ts";
import { guildStories } from "../lib/guild-stories.ts";
import { expressionPortrait } from "../lib/portrait-expressions.ts";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
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
      /\/portraits\/|\/ui\/|\/guild\/|\/animations\//.test(response.url())
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
async function checkMotion(page) {
  const canvas = page.locator(".guild-canvas canvas");
  const before = await canvas.screenshot();
  await page.clock.runFor(6500);
  const after = await canvas.screenshot();
  assert.ok(!before.equals(after), "Phaser animates residents and tools");
  await capture(page, "home-walking");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.runFor(100);
  const still = await canvas.screenshot();
  await page.clock.runFor(1500);
  assert.ok(still.equals(await canvas.screenshot()), "reduced motion holds the scene still");
  await page.emulateMedia({ reducedMotion: "no-preference" });
}
async function capture(page, name) {
  await page.clock.runFor(350);
  await page.locator('.guild-canvas[data-status="ready"]').waitFor();
  await page.locator(".guild-detail[data-state=closed]").waitFor({ state: "hidden" });
  await page.locator(".guild-scene").evaluate(async (scene) => {
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
  await page.screenshot({ path: `${output}/${name}.png` });
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  assert.ok(fits, `${name}: no horizontal overflow`);
  results.push({ name, fits });
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
      await page.getByRole("button", { name: "種・材料", exact: true }).click();
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
  assert.equal(await page.getByRole("button", { name: "日常", exact: true }).count(), 0);
  await capture(page, "overview");
  assert.equal(await page.locator(".guild-toolbar button").count(), 2);
  const density = await page
    .locator(".guild-canvas canvas")
    .evaluate((canvas) => canvas.width / canvas.clientWidth);
  assert.ok(Math.abs(density - 2) < 0.02, "canvas keeps device-pixel density");
  await tellStory(page, "guild-waiting-for-a-charm");
  await page.getByRole("button", { name: "種・材料", exact: true }).click();
  for (const name of ["薬草の種", "ニンジンの種", "苔の胞子", "蜂蜜"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.getByRole("button", { name: `${name}を10個購入`, exact: true }).click();
  }
  await capture(page, "shop");
  await closeDialog(page);
  await page.getByRole("button", { name: "菜園", exact: true }).click();
  await page.getByRole("button", { name: "リンデの菜園の担当を選ぶ", exact: true }).click();
  await page.getByRole("button", { name: "リンデの世話係：アリア", exact: true }).click();
  await closeDialog(page);
  for (const [name, crop] of [
    ["プランター 1", "薬草"],
    ["プランター 2", "ニンジン"],
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.getByRole("button", { name: crop, exact: true }).click();
    await capture(page, `plant-${crop}`);
    await page.getByRole("button", { name: "植える", exact: true }).click();
    await closeDialog(page);
  }
  assert.equal(await page.getByRole("progressbar").count(), 2, "growth visible on the scene");
  await capture(page, "linde-planted");
  await page.getByRole("button", { name: "ブレッカの栽培所", exact: true }).click();
  await page.getByRole("button", { name: "ブレッカの栽培所の担当を選ぶ", exact: true }).click();
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
    const nav = await page.getByRole("tab", { name: "旅団", exact: true }).boundingBox();
    assert.ok(nav && nav.height >= 44 && nav.y + nav.height <= height, "navigation remains usable");
    const toolbar = await page.locator(".guild-toolbar").boundingBox();
    assert.ok(
      toolbar && toolbar.height >= 44 && toolbar.y + toolbar.height <= nav.y + 1,
      "facility icons stay above navigation",
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "旅団ホームへ戻る", exact: true }).click();
  await page.getByRole("button", { name: "作業台の仕込み", exact: true }).click();
  await page.getByRole("button", { name: "加工担当：ミラ", exact: true }).click();
  await page.getByRole("button", { name: "薬草と蜂蜜のお茶", exact: true }).click();
  await page.getByLabel("作る回数（1〜99）").fill("");
  assert.ok(await page.getByRole("button", { name: "加工を始める", exact: true }).isDisabled());
  await page.getByRole("button", { name: "材料がある限りくり返す", exact: true }).click();
  await page.getByRole("button", { name: "加工を始める", exact: true }).click();
  const before = await stateOf(page);
  assert.equal(await page.locator(".guild-detail .is-crafting .guild-counter-worker").count(), 1);
  assert.equal(
    await page
      .locator(".guild-detail .guild-stirring-spoon")
      .evaluate((el) => getComputedStyle(el).animationName),
    "guild-stir",
  );
  await capture(page, "workbench");
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
  await page.reload();
  await page.getByRole("button", { name: "冒険を始める", exact: true }).click();
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
    await page.getByRole("button", { name: `${site}の担当を選ぶ`, exact: true }).click();
    await page.getByRole("button", { name: `${role}を外す`, exact: true }).click();
    await closeDialog(page);
  }
  await page.getByRole("button", { name: "旅団ホームへ戻る", exact: true }).click();
  assert.ok(
    (await page.locator(".guild-chat").textContent()).includes(guildStories[0].lines[0].text),
  );
  await page.getByRole("button", { name: "菜園", exact: true }).click();
  await page.clock.runFor(60000);
  assert.ok(
    !(await stateOf(page)).story.read.includes("guild-first-harvest"),
    "leaving does not read the conversation",
  );
  await page.getByRole("button", { name: "旅団ホームへ戻る", exact: true }).click();
  await tellStory(page, "guild-first-harvest");
  await page.getByRole("button", { name: "旅の手帳：ヒント・思い出・アルバム・設定" }).click();
  await page.locator(".save-status").click();
  assert.equal(await page.getByText("テストプレイ", { exact: true }).count(), 1);
  const saved = await stateOf(page);
  await page.reload();
  await page.getByRole("button", { name: "冒険を始める", exact: true }).click();
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
