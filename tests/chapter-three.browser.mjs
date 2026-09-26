// Synthetic saves in isolated browser contexts; never touches a player's records.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { act, settle, testState } from "../lib/game.ts";
import { chapterThreeStages, LUNCH_INTERLUDE, BERNE_QUEST } from "../lib/chapter-three.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = process.env.TEST_ROOT || "http://localhost:5173";
const output = "work/chapter-three-browser";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const errors = [],
  results = [];
async function open(state) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      /\/scenery\/|\/animations\/|\/portraits\/|\/stories\//.test(response.url())
    )
      errors.push(`${response.status()} ${response.url()}`);
  });
  const id = "11111111-1111-4111-8111-111111111111";
  const save = {
    format: 4,
    deviceId: id,
    active: id,
    profiles: [{ id, name: "第三章画面確認", test: true, state }],
    serial: 0,
    sound: false,
    cloudAt: 0,
  };
  await page.clock.install({ time: new Date(state.updatedAt) });
  await page.clock.setFixedTime(new Date(state.updatedAt));
  await page.addInitScript((save) => {
    if (!localStorage.getItem("starlit-guild-v4"))
      localStorage.setItem("starlit-guild-v4", JSON.stringify(save));
  }, save);
  await page.goto(root);
  await page.clock.runFor(200);
  await page.getByRole("button", { name: "冒険を始める", exact: true }).click();
  await page.clock.runFor(200);
  return { page, context };
}
const savedState = (page) =>
  page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("starlit-guild-v4"));
    return save.profiles.find((profile) => profile.id === save.active).state;
  });
async function screenshots(page, name) {
  for (const [width, height] of [
    [390, 844],
    [320, 568],
    [1280, 960],
  ]) {
    await page.setViewportSize({ width, height });
    await page.clock.runFor(350);
    await page.waitForTimeout(100);
    const layout = await page
      .locator(".phone-game")
      .evaluate((el) => ({ width: el.clientWidth, scroll: el.scrollWidth }));
    assert.ok(layout.scroll <= layout.width + 1, `${name}: horizontal overflow at ${width}`);
    await page.screenshot({ path: `${output}/${name}-${width}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
}
async function finishStory(page) {
  for (
    let i = 0;
    i < 90 && (await page.getByRole("button", { name: "会話を進める", exact: true }).count());
    i++
  ) {
    await page.getByRole("button", { name: "会話を進める", exact: true }).click();
    await page.clock.runFor(20);
  }
  await page.locator(".story-conversation").click();
  await page.clock.runFor(300);
}
try {
  const initial = testState(Date.now(), 18, 25, 10000);
  initial.autoNextQuest = true;
  const { page, context } = await open(initial);
  assert.equal(await page.locator(".story-conversation").count(), 0);
  await page.getByRole("button", { name: "クエストを開く", exact: true }).click();
  await page.getByRole("combobox", { name: "クエストの章" }).waitFor();
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("role")),
    "dialog",
    "opening quests keeps focus off the chapter select so phones do not pop its picker",
  );
  await page.getByRole("combobox", { name: "クエストの章" }).selectOption("three");
  await page.locator(".quest-option").filter({ hasText: "私が用意するお昼" }).click();
  if (await page.locator(".quest-summary").count()) await page.locator(".quest-summary").click();
  await page.getByRole("button", { name: "出発", exact: true }).click();
  await page.getByRole("button", { name: "私が用意するお昼：会話を進める", exact: true }).waitFor();
  assert.equal(await page.getByText("クエストクリア", { exact: true }).count(), 0);
  await screenshots(page, "interlude");
  await finishStory(page);
  let state = await savedState(page);
  assert.ok(state.story.read.includes(LUNCH_INTERLUDE));
  assert.equal(state.gold, initial.gold);
  assert.equal(state.squads[0].lastQuest, BERNE_QUEST);
  await page.getByRole("button", { name: "クエストを開く", exact: true }).click();
  assert.equal(
    await page.locator(".quest-option").filter({ hasText: "私が用意するお昼" }).count(),
    0,
  );
  await page.getByRole("button", { name: "閉じる", exact: true }).click();
  await page.getByRole("button", { name: "出発", exact: true }).click();
  await page
    .getByRole("button", { name: "あの丘の塔、あんたらか：会話を進める", exact: true })
    .waitFor();
  for (let i = 0; i < 6; i++)
    await page.getByRole("button", { name: "会話を進める", exact: true }).click();
  await screenshots(page, "finn-story");
  await finishStory(page);
  await page.locator('.phaser-canvas[data-status="ready"]').waitFor({ timeout: 60000 });
  state = await savedState(page);
  assert.deepEqual(state.squads[0].members, ["aria", "leon", "mira", "finn"]);
  await screenshots(page, "four-travellers");
  await context.close();
  results.push("interlude-to-first-departure");
  for (const index of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
    const quest = chapterThreeStages[index].quest;
    let initial = testState(Date.now(), 18 + index, 25, 10000);
    if (index === 0)
      initial = act(initial, { type: "readStory", id: LUNCH_INTERLUDE }, initial.updatedAt);
    let state = act(
      initial,
      { type: "start", id: quest, readDeparture: true, value: false },
      Date.now(),
    );
    for (let i = 0; i < 1500 && state.squads[0].run; i++) {
      const frame = chapterRoadFrame({
        squad: state.squads[0],
        now: state.updatedAt,
        ready: true,
        paused: false,
      });
      if (
        index === 7
          ? frame.battle.effects.some((effect) => effect.hero === "finn" && effect.kind === "slash")
          : frame.look.workers.length === 4 &&
            (!(index in { 0: 1, 1: 1, 2: 1, 4: 1 }) ||
              frame.look.work?.frame ===
                { 0: "signpost", 1: "stonework", 2: "records", 4: "records" }[index])
      )
        break;
      state = settle(state, state.squads[0].run.nextAt);
    }
    const { page, context } = await open(state);
    await page.locator('.phaser-canvas[data-status="ready"]').waitFor({ timeout: 60000 });
    await screenshots(page, `stage-3-${index + 1}`);
    if (index === 1) {
      await page.getByRole("button", { name: "ショップを開く" }).click();
      await page.getByRole("button", { name: /^細工師の短剣・/ }).click();
      await page.getByRole("heading", { name: "細工師の短剣", exact: true }).waitFor();
      await screenshots(page, "berne-shop");
    }
    await context.close();
    results.push(quest);
  }
  assert.deepEqual(errors, []);
  writeFileSync(`${output}/result.json`, JSON.stringify({ results, errors }, null, 2));
  console.log(JSON.stringify({ results, errors }));
} finally {
  await browser.close();
}
