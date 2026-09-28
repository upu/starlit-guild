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
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
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
    if (response.status() >= 400 && /\/portraits\/|\/ui\//.test(response.url()))
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
async function capture(page, name) {
  await page.screenshot({ path: `${output}/${name}.png` });
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  assert.ok(fits, `${name}: no horizontal overflow`);
  results.push({ name, fits });
}
try {
  const locked = await open(36);
  assert.equal(await locked.page.getByRole("tab", { name: "旅団", exact: true }).count(), 0);
  await locked.context.close();
  const { page, context, initialAt } = await open();
  await page.getByRole("tab", { name: "旅団", exact: true }).click();
  await page.locator(".phone-guild").evaluate((el) => {
    el.scrollTop = 0;
  });
  await capture(page, "overview");
  await page.getByRole("button", { name: "種・材料", exact: true }).click();
  for (const name of ["薬草の種", "ニンジンの種", "苔の胞子", "蜂蜜"])
    await page.getByRole("button", { name: `${name}を10個購入`, exact: true }).click();
  await page.getByRole("button", { name: "菜園", exact: true }).click();
  await page.getByLabel("リンデの世話係", { exact: true }).selectOption("aria");
  await page.getByLabel("ブレッカの世話係", { exact: true }).selectOption("lico");
  await page.clock.runFor(250);
  assert.ok(
    await page
      .getByLabel("ブレッカの世話係", { exact: true })
      .locator('option[value="aria"]')
      .evaluate((option) => option.disabled),
  );
  await page.getByRole("button", { name: "植える", exact: true }).first().click();
  await page.getByLabel("linde-2の作物", { exact: true }).selectOption("carrot");
  await page.getByRole("button", { name: "植える", exact: true }).first().click();
  await page.getByRole("button", { name: "植える", exact: true }).click();
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
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "作業台", exact: true }).click();
  await page.getByLabel("加工担当", { exact: true }).selectOption("mira");
  await page.getByLabel("作り方", { exact: true }).selectOption("tea");
  await page.getByLabel("作る回数（1〜99）").fill("");
  assert.ok(await page.getByRole("button", { name: "加工を始める", exact: true }).isDisabled());
  await page.getByLabel("材料がある限りくり返す").check();
  await page.getByRole("button", { name: "加工を始める", exact: true }).click();
  const before = await stateOf(page);
  await capture(page, "workbench");
  await page.clock.setFixedTime(new Date(initialAt + 6 * 3600000));
  await page.reload();
  await page.getByRole("button", { name: "冒険を始める", exact: true }).click();
  const after = await stateOf(page);
  assert.ok(after.guild.cultivation > before.guild.cultivation);
  assert.ok(after.consumables.items["guild-tea"] > 0);
  assert.ok(after.guild.materials["dried-moss"] > 0);
  await page.getByRole("tab", { name: "旅団", exact: true }).click();
  await page.getByRole("button", { name: "日常", exact: true }).click();
  assert.equal(await page.locator(".guild-panel .story-entry").count(), 8);
  for (const id of ["guild-which-finger", "guild-a-reason-to-visit"]) {
    const story = guildStories.find((item) => item.id === id);
    await page.locator(".guild-panel .story-entry").filter({ hasText: story.title }).click();
    for (let i = 0; i < story.lines.length; i++) {
      const line = story.lines[i];
      if (line.speaker) {
        const expected = expressionPortrait(line.speaker, line.expression);
        const portrait = page
          .locator(`.dialogue-history .story-${line.speaker}`)
          .last()
          .locator('[style*="background-image"]');
        const actual = await portrait.evaluate((el) => ({
          position: el.style.backgroundPosition,
          image: el.style.backgroundImage,
        }));
        assert.ok(actual.image.includes(expected.src));
        const target = expected.position.split(" ").map(parseFloat);
        assert.ok(
          actual.position
            .split(" ")
            .map(parseFloat)
            .every((n, index) => Math.abs(n - target[index]) < 0.001),
          `${id} line ${i}: ${actual.position} / ${expected.position}`,
        );
      }
      if (i === story.lines.length - 1) await capture(page, id);
      await page.locator(".story-conversation").click();
      await page.clock.runFor(200);
    }
    assert.ok((await stateOf(page)).story.read.includes(id));
  }
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
    "PASS: guild unlocking, controls, roles, four viewports, offline resume, expressions and persistence",
  );
} finally {
  await browser.close();
}
