// Isolated synthetic saves only; no player's record is opened or changed.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { act, settle, testState } from "../lib/game.ts";
import {
  chapterFourStages,
  WALNUT_INTERLUDE,
  LICO_RECORDS_QUEST,
  MERRILL_SEEDLINGS_QUEST,
} from "../lib/chapter-four.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = process.env.TEST_ROOT || "http://localhost:5173";
const output = "work/chapter-four-browser";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const errors = [];
const results = [];

async function open(state) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      /\/scenery\/|\/animations\/|\/portraits\/|\/characters\/|\/stories\//.test(response.url())
    )
      errors.push(`${response.status()} ${response.url()}`);
  });
  const id = "11111111-1111-4111-8111-111111111111";
  const save = {
    format: 4,
    deviceId: id,
    active: id,
    profiles: [{ id, name: "第四章画面確認", test: true, state }],
    serial: 0,
    sound: false,
    cloudAt: 0,
  };
  await page.clock.install({ time: new Date(state.updatedAt) });
  await page.clock.setFixedTime(new Date(state.updatedAt));
  await page.addInitScript((record) => {
    if (!localStorage.getItem("starlit-guild-v4"))
      localStorage.setItem("starlit-guild-v4", JSON.stringify(record));
  }, save);
  await page.goto(root);
  await page.clock.runFor(200);
  await page.getByRole("button", { name: "冒険を始める", exact: true }).click();
  await page.clock.runFor(200);
  return { page, context };
}

async function capture(page, name) {
  await page.locator('.phaser-canvas[data-status="ready"]').waitFor({ timeout: 60000 });
  for (const [width, height] of [
    [390, 844],
    [1280, 960],
  ]) {
    await page.setViewportSize({ width, height });
    await page.clock.runFor(350);
    const layout = await page
      .locator(".phone-game")
      .evaluate((el) => ({ width: el.clientWidth, scroll: el.scrollWidth }));
    assert.ok(layout.scroll <= layout.width + 1, `${name}: overflow at ${width}`);
    await page.screenshot({ path: `${output}/${name}-${width}.png` });
  }
}

function stageRun(index, target) {
  let state = testState(Date.now(), 27 + index, 40, 10000);
  if (index === 0) state = act(state, { type: "readStory", id: WALNUT_INTERLUDE }, state.updatedAt);
  state = act(
    state,
    { type: "start", id: chapterFourStages[index].quest, readDeparture: true, value: false },
    state.updatedAt,
  );
  const visible = () => {
    const run = state.squads[0].run;
    if (!run) return false;
    if (typeof target === "number") return run.node === target;
    const frame = chapterRoadFrame({
      squad: state.squads[0],
      now: state.updatedAt,
      ready: true,
      paused: false,
    });
    return frame.battle.enemies.some((enemy) => enemy.kind === target);
  };
  const targetNode = target === "lico" ? 14 : target === "merrill" ? 8 : target;
  for (let step = 0; state.squads[0].run && !visible() && step < 20000; step++) {
    const tick = state.squads[0].run.node >= targetNode - 1 ? 1 : 100;
    state = settle(state, state.updatedAt + tick).state;
  }
  assert.ok(
    visible(),
    JSON.stringify({
      quest: chapterFourStages[index].quest,
      done: state.done,
      log: state.log.slice(-4),
    }),
  );
  return state;
}

try {
  const pending = testState(Date.now(), 27, 40, 10000);
  const interlude = await open(pending);
  await interlude.page.getByRole("button", { name: "クエストを開く", exact: true }).click();
  await interlude.page.getByRole("combobox", { name: "クエストの章" }).selectOption("four");
  assert.equal(
    await interlude.page.locator(".quest-option").filter({ hasText: "約束の胡桃" }).count(),
    1,
  );
  await interlude.page.screenshot({ path: `${output}/interlude-390.png` });
  await interlude.context.close();
  results.push("interlude-gate");

  for (const [name, index, node] of [
    ["first-stage", 0, 0],
    ["lico-apparatus", 5, "lico"],
    ["lico-and-merrill", 6, "merrill"],
    ["five-companions", 7, 0],
  ]) {
    const state = stageRun(index, node);
    if (name === "lico-and-merrill") assert.ok(state.owned.includes("lico"));
    if (name === "lico-apparatus") assert.equal(state.squads[0].run.quest, LICO_RECORDS_QUEST);
    if (name === "lico-and-merrill")
      assert.equal(state.squads[0].run.quest, MERRILL_SEEDLINGS_QUEST);
    const { page, context } = await open(state);
    await capture(page, name);
    await context.close();
    results.push(name);
  }
  assert.deepEqual(errors, []);
  writeFileSync(`${output}/result.json`, JSON.stringify({ results, errors }, null, 2));
  console.log(JSON.stringify({ results, errors }));
} finally {
  await browser.close();
}
