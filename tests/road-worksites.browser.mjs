// Isolated synthetic saves only; no player's record is opened or changed.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { allQuests, encounter } from "../lib/game.ts";
import { WALNUT_INTERLUDE } from "../lib/chapter-four.ts";
import { LUNCH_INTERLUDE } from "../lib/chapter-three.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { roadWorkLook } from "../lib/chapter-road-work-look.ts";
import { worksiteByLabel } from "../lib/road-worksite-catalog.ts";
import { worksiteArt } from "../lib/road-worksite-art.ts";

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = process.env.TEST_ROOT || "http://localhost:5173";
const output = "work/worksite-browser";
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

const samples = new Map();
for (const [index, stage] of storyStages.entries()) {
  const q = allQuests.find((q) => q.id === stage.quest);
  for (let node = 0; node < 15; node++) {
    if (encounter(q, node) === "battle") continue;
    const look = roadWorkLook(q, { node, nodes: 15 });
    const kind = worksiteByLabel[look.label];
    if (!samples.has(kind)) samples.set(kind, { index, node, label: look.label });
  }
}
function sampleState(index, node) {
  let state = testState(Date.now(), index, 40, 10000);
  if (index === 18) state = act(state, { type: "readStory", id: LUNCH_INTERLUDE }, state.updatedAt);
  if (index === 27)
    state = act(state, { type: "readStory", id: WALNUT_INTERLUDE }, state.updatedAt);
  state = act(
    state,
    { type: "start", id: storyStages[index].quest, readDeparture: true, value: false },
    state.updatedAt,
  );
  for (let step = 0; step < 20000 && state.squads[0].run; step++) {
    const frame = chapterRoadFrame({
      squad: state.squads[0],
      now: state.updatedAt,
      ready: true,
      paused: false,
    });
    if (state.squads[0].run.node === node && frame.look.workers.length) return state;
    state = settle(state, state.updatedAt + 100);
  }
  throw Error(`Work point not reached: ${index}:${node}`);
}
try {
  for (const [kind, sample] of samples) {
    const state = sampleState(sample.index, sample.node);
    const { page, context } = await open(state);
    assert.ok(await page.locator(".adventure-map").count());
    await capture(page, kind);
    assert.ok((await page.locator(".adventure-map").innerText()).includes(sample.label));
    await context.close();
    results.push(kind);
  }
  assert.equal(samples.size, Object.keys(worksiteArt).length);
  assert.deepEqual(errors, []);
  writeFileSync(`${output}/result.json`, JSON.stringify({ results, errors }, null, 2));
  console.log(JSON.stringify({ results, errors }));
} finally {
  await browser.close();
}
