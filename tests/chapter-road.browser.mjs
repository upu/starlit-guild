// Fresh contexts with synthetic records only. Never attach to a player's browser or save.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = process.env.TEST_ROOT || "http://localhost:5173",
  output = "work/chapter-road-browser";
mkdirSync(output, { recursive: true });
function fixture(index, mode) {
  const now = Date.now();
  let s = act(
    testState(now, index, index === 15 ? 19 : 12, 1000),
    { type: "start", id: storyStages[index].quest, readDeparture: true, value: false },
    now,
  );
  if (mode === "boss")
    while (s.squads[0].run.node < 2 && s.updatedAt < now + 180000)
      s = settle(s, s.squads[0].run.nextAt).state;
  else if (mode === "ambush")
    while (s.squads[0].run.road.ambushNode === undefined && s.updatedAt < now + 60000)
      s = settle(s, s.squads[0].run.nextAt).state;
  const id = crypto.randomUUID();
  return {
    format: 4,
    deviceId: id,
    active: id,
    profiles: [{ id, name: "横スクロール確認", test: true, state: s }],
    serial: 0,
    sound: false,
    cloudAt: 0,
    legacyImported: true,
  };
}
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const errors = [],
  results = [];
try {
  for (const [name, index, mode] of [
    ["forest", 0, "ambush"],
    ["work", 11, "work"],
    ["trio", 12, "battle"],
    ["puppets", 15, "boss"],
  ]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } }),
      page = await context.newPage(),
      save = fixture(index, mode);
    page.on("pageerror", (e) => errors.push(e.message));
    await page.clock.install({ time: new Date(save.profiles[0].state.updatedAt) });
    await page.addInitScript((save) => {
      if (!localStorage.getItem("starlit-guild-v4"))
        localStorage.setItem("starlit-guild-v4", JSON.stringify(save));
    }, save);
    await page.goto(root);
    await page.getByRole("button", { name: "冒険を始める", exact: true }).click();
    await page.locator('.phaser-canvas[data-status="ready"]').waitFor({ timeout: 60000 });
    await page.clock.runFor(900);
    assert.equal(await page.locator("canvas").count(), 1);
    assert.equal(await page.locator(".journey-banter").count(), 1);
    assert.ok(await page.locator(".map-journey progress").count());
    for (const [width, height] of name === "forest"
      ? [
          [1280, 960],
          [390, 844],
          [320, 568],
          [844, 390],
        ]
      : [[390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.clock.runFor(350);
      const layout = await page
        .locator(".phone-game")
        .evaluate((el) => ({ width: el.clientWidth, scrollWidth: el.scrollWidth }));
      assert.ok(layout.scrollWidth <= layout.width + 1);
      await page.screenshot({ path: `${output}/${name}-${width}.png` });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.clock.runFor(300);
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem("starlit-guild-v4")));
    assert.equal(before.active, save.active);
    assert.ok(before.profiles[0].state.squads[0].run.road);
    await page.reload();
    await page.getByRole("button", { name: "冒険を始める", exact: true }).click();
    await page.locator('.phaser-canvas[data-status="ready"]').waitFor({ timeout: 60000 });
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem("starlit-guild-v4")));
    assert.equal(after.active, save.active);
    assert.ok(after.profiles[0].state.gold >= before.profiles[0].state.gold);
    results.push({ name, quest: save.profiles[0].state.squads[0].run.quest, reloaded: true });
    await context.close();
  }
  assert.deepEqual(errors, []);
  writeFileSync(`${output}/results.json`, JSON.stringify({ results, errors }, null, 2));
  console.log(JSON.stringify({ results, errors }, null, 2));
} finally {
  await browser.close();
}
