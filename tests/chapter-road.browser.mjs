// Fresh contexts with synthetic records only. Never attach to a player's browser or save.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
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
  if (["withdraw", "enter", "escape"].includes(mode)) {
    for (let i = 0; i < 15000 && s.squads[0].run?.road.scene?.kind !== mode; i++)
      s = settle(s, s.squads[0].run.nextAt).state;
    assert.equal(s.squads[0].run.road.scene.kind, mode);
    s = settle(
      s,
      s.updatedAt +
        (s.squads[0].run.nextAt - s.updatedAt) *
          { withdraw: 0.27, enter: 0.85, escape: 0.29 }[mode],
    ).state;
  } else if (mode === "worksite" || mode === "arrival") {
    for (let i = 0; i < 1000; i++) {
      const frame = chapterRoadFrame({
        squad: s.squads[0],
        startQuest: storyStages[index].quest,
        now: s.updatedAt,
        ready: true,
        paused: false,
      });
      if (
        frame.look.workers.length === s.squads[0].members.length &&
        frame.look.work &&
        (mode !== "arrival" || s.squads[0].run.node === s.squads[0].run.nodes - 1)
      )
        break;
      s = settle(s, s.squads[0].run.nextAt).state;
    }
  } else if (mode === "boss")
    while ((s.squads[0].run.node < 2 || s.squads[0].run.road.scene) && s.updatedAt < now + 180000)
      s = settle(s, s.squads[0].run.nextAt).state;
  else if (mode === "ambush" || mode === "rear")
    while (s.squads[0].run.road.ambushNode === undefined && s.updatedAt < now + 60000)
      s = settle(s, s.squads[0].run.nextAt).state;
  if (mode === "rear") {
    const r = s.squads[0].run,
      road = r.road,
      enemy = road.opponents[r.enemies[0].id];
    enemy.x = enemy.previousX = road.camera - 340;
    road.members.leon.x = road.members.leon.previousX = enemy.x + 55;
    road.members.leon.recoil = -45;
    s = settle(s, s.updatedAt + 100).state;
  }
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
    ["cargo", 0, "worksite"],
    ["return-cargo", 1, "worksite"],
    ["town", 2, "worksite"],
    ["arrival", 2, "arrival"],
    ["moss", 5, "worksite"],
    ["waterway", 6, "worksite"],
    ["forest", 0, "ambush"],
    ["work", 11, "worksite"],
    ["trio", 12, "battle"],
    ["signpost", 13, "worksite"],
    ["rear-signpost", 13, "rear"],
    ["trio-work", 16, "worksite"],
    ["puppets", 15, "boss"],
    ["withdraw", 15, "withdraw"],
    ["enter", 15, "enter"],
    ["escape", 15, "escape"],
  ]) {
    if (process.env.TEST_SCENES && !process.env.TEST_SCENES.split(",").includes(name)) continue;
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } }),
      page = await context.newPage(),
      save = fixture(index, mode);
    page.on("pageerror", (e) => errors.push(e.message));
    const roadAssets = new Set();
    page.on("request", (request) => {
      if (request.url().includes("/animations/road/"))
        roadAssets.add(new URL(request.url()).pathname);
    });
    if (name === "cargo")
      await page.route("**/animations/road/aria-v1.webp", (route) => route.abort());
    await page.clock.install({ time: new Date(save.profiles[0].state.updatedAt) });
    if (["worksite", "arrival", "withdraw", "enter", "escape", "rear"].includes(mode))
      await page.clock.setFixedTime(new Date(save.profiles[0].state.updatedAt));
    await page.addInitScript((save) => {
      if (!localStorage.getItem("starlit-guild-v4"))
        localStorage.setItem("starlit-guild-v4", JSON.stringify(save));
    }, save);
    await page.addInitScript(() => {
      window.roadMipFilters = 0;
      const original = WebGLRenderingContext.prototype.texParameteri;
      WebGLRenderingContext.prototype.texParameteri = function (target, parameter, value) {
        if (parameter === this.TEXTURE_MIN_FILTER && value === this.LINEAR_MIPMAP_LINEAR)
          window.roadMipFilters++;
        return original.call(this, target, parameter, value);
      };
    });
    await page.goto(root);
    await page.clock.runFor(100);
    assert.equal(await page.getByRole("link", { name: "横スクロール戦闘を試す" }).count(), 0);
    await page.getByRole("button", { name: "冒険を始める", exact: true }).click();
    await page.clock.runFor(100);
    if (name === "cargo") {
      await page.getByRole("button", { name: "もう一度読み込む" }).waitFor();
      await page.unroute("**/animations/road/aria-v1.webp");
      await page.getByRole("button", { name: "もう一度読み込む" }).click();
    }
    await page.locator('.phaser-canvas[data-status="ready"]').waitFor({ timeout: 60000 });
    await page.clock.runFor(mode === "worksite" ? 50 : 900);
    assert.equal(await page.locator("canvas").count(), 1);
    assert.ok(await page.evaluate(() => window.roadMipFilters > 0));
    assert.equal(await page.locator(".journey-banter").count(), 1);
    assert.ok(await page.locator(".map-journey progress").count());
    for (const [width, height] of name === "forest"
      ? [
          [1280, 960],
          [390, 844],
          [320, 568],
          [844, 390],
        ]
      : [
          [1280, 960],
          [390, 844],
        ]) {
      await page.setViewportSize({ width, height });
      // Let ResizeObserver apply the real canvas dimensions before advancing its fake RAF clock.
      await new Promise((resolve) => setTimeout(resolve, 75));
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
    await page.clock.runFor(100);
    await page.getByRole("button", { name: "冒険を始める", exact: true }).click();
    await page.clock.runFor(100);
    await page.locator('.phaser-canvas[data-status="ready"]').waitFor({ timeout: 60000 });
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem("starlit-guild-v4")));
    assert.equal(after.active, save.active);
    assert.ok(after.profiles[0].state.gold >= before.profiles[0].state.gold);
    assert.ok(roadAssets.size >= 15);
    assert.ok([...roadAssets].every((asset) => asset.endsWith(".webp")));
    results.push({ name, quest: save.profiles[0].state.squads[0].run.quest, reloaded: true });
    await context.close();
  }
  const removedRoute = await browser.newContext();
  assert.equal((await removedRoute.request.get(`${root}/battle-prototype`)).status(), 404);
  await removedRoute.close();
  assert.deepEqual(errors, []);
  writeFileSync(`${output}/results.json`, JSON.stringify({ results, errors }, null, 2));
  console.log(JSON.stringify({ results, errors }, null, 2));
} finally {
  await browser.close();
}
