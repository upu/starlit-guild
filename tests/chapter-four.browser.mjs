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
import { chapterFourBattleBanter } from "../lib/chapter-four-battle-banter.ts";
import { expressionPortrait } from "../lib/portrait-expressions.ts";
import { chapterFourStories } from "../lib/chapter-four-stories.ts";

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
      /\/scenery\/|\/animations\/|\/adventure-pixel\/|\/portraits\/|\/characters\/|\/stories\//.test(
        response.url(),
      )
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
  const cue = ["summon", "song", "paralyze"].includes(target);
  let state = testState(Date.now(), 27 + index, cue ? 25 : 40, 10000);
  if (index === 0) state = act(state, { type: "readStory", id: WALNUT_INTERLUDE }, state.updatedAt);
  state = act(
    state,
    { type: "start", id: chapterFourStages[index].quest, readDeparture: true, value: false },
    state.updatedAt,
  );
  const visible = () => {
    const run = state.squads[0].run;
    if (!run) return false;
    if (cue) return run.enemies?.some((enemy) => enemy.cue === target);
    const frame = chapterRoadFrame({
      squad: state.squads[0],
      now: state.updatedAt,
      ready: true,
      paused: false,
    });
    if (target === "walk")
      return frame.battle.heroes.some((hero) => hero.id === "lico" && hero.walking);
    if (target === "push")
      return frame.battle.gathering?.task === "carry" && frame.look.workers.includes("lico");
    if (typeof target === "number")
      return (
        run.node === target &&
        (frame.look.work?.frame !== "ledger" || frame.look.workers.length > 0)
      );
    return frame.battle.enemies.some((enemy) => enemy.kind === target);
  };
  const targetNode = target === "lico" ? 14 : target === "merrill" ? 8 : target;
  for (let step = 0; state.squads[0].run && !visible() && step < 20000; step++) {
    const tick = state.squads[0].run.node >= targetNode - 1 ? 1 : 100;
    state = settle(state, state.updatedAt + tick);
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

async function verifyBattleDialogue(page, state) {
  const run = state.squads[0].run;
  if (run.enemies[0].cue === "summon") {
    assert.equal(run.enemies.filter((e) => e.trick === "mushroom").length, 4);
    const frame = chapterRoadFrame({
      squad: state.squads[0],
      now: state.updatedAt,
      ready: true,
      paused: false,
    });
    assert.equal(new Set(frame.battle.enemies.slice(1).map((e) => e.lane)).size, 4);
  }
  const lines = chapterFourBattleBanter(run);
  assert.ok((await page.locator(".journey-banter").innerText()).includes(lines[0].text));
  const portrait = expressionPortrait(lines[0].speaker, lines[0].expression);
  const icon = page
    .locator(".journey-banter .banter-line")
    .first()
    .locator('[style*="background-image"]');
  assert.ok((await icon.getAttribute("style")).includes(portrait.src));
  if (state.squads[0].run.enemies[0].cue !== "song") return;
  await page.clock.runFor(4600);
  const shout = page.locator(".journey-banter .banter-line").filter({ hasText: "あーーっ！" });
  assert.ok((await shout.innerText()).includes("コロタケ"));
  assert.ok(
    (await shout.locator('[style*="background-image"]').getAttribute("style")).includes(
      "100% 100%",
    ),
  );
}

async function verifyKorotakeEnding() {
  const { page, context } = await open(testState(Date.now(), 35, 25, 10000));
  await page.getByRole("button", { name: "旅の手帳：ヒント・思い出・アルバム・設定" }).click();
  await page.getByRole("button", { name: /^思い出/ }).click();
  await page.getByRole("button", { name: /感想は一株分/ }).click();
  const ending = chapterFourStories.find((s) => s.id === "merrill-seedlings-return");
  for (let i = 1; i < ending.lines.length; i++) {
    await page.getByRole("button", { name: "会話を進める", exact: true }).press("Enter");
    await page.clock.runFor(30);
  }
  assert.ok(
    (await page.locator(".story-narration").last().innerText()).includes(
      "メリルは鍋を抱え、上機嫌で街道へ去っていった。",
    ),
  );
  const excited = page
    .locator(".story-merrill")
    .filter({ hasText: "四つとも、バター焼き" })
    .locator('[style*="background-image"]');
  const actual = (await excited.evaluate((el) => el.style.backgroundPosition))
    .split(" ")
    .map(parseFloat);
  const expected = expressionPortrait("merrill", "excited").position.split(" ").map(parseFloat);
  actual.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) < 0.001));
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.clock.runFor(100);
    await page.screenshot({ path: `${output}/korotake-ending-${width}.png` });
  }
  await context.close();
  results.push("korotake-ending");
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
    ["pursuit-first-day", 3, 5],
    ["pursuit-second-day", 4, 5],
    ["purchase-records", 2, 2],
    ["moss-bed-count", 5, 0],
    ["moss-waterway-survey", 5, 1],
    ["moss-distance-survey", 5, 2],
    ["record-comparison", 6, 0],
    ["lico-apparatus", 6, "lico"],
    ["lico-and-merrill", 7, "merrill"],
    ["lico-paralysis", 6, "paralyze"],
    ["korotake-summon", 7, "summon"],
    ["merrill-party-song", 7, "song"],
    ["five-companions", 8, 0],
    ["lico-walking", 7, "walk"],
    ["lico-pushing", 8, "push"],
  ]) {
    const state = stageRun(index, node);
    if (name === "lico-and-merrill") assert.ok(state.owned.includes("lico"));
    if (name === "lico-apparatus") assert.equal(state.squads[0].run.quest, LICO_RECORDS_QUEST);
    if (name === "lico-and-merrill")
      assert.equal(state.squads[0].run.quest, MERRILL_SEEDLINGS_QUEST);
    const { page, context } = await open(state);
    await capture(page, name);
    if (["walk", "push"].includes(node)) {
      await page.clock.setFixedTime(new Date(state.updatedAt + (node === "walk" ? 150 : 220)));
      await capture(page, `${name}-next-step`);
    }
    if (["paralyze", "summon", "song"].includes(node)) await verifyBattleDialogue(page, state);
    await context.close();
    results.push(name);
  }
  await verifyKorotakeEnding();
  assert.deepEqual(errors, []);
  writeFileSync(`${output}/result.json`, JSON.stringify({ results, errors }, null, 2));
  console.log(JSON.stringify({ results, errors }));
} finally {
  await browser.close();
}
