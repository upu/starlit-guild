// Fresh contexts with synthetic records only. Never attach to a player's browser or save.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = process.env.TEST_ROOT || "http://localhost:5173",
  density = Number(process.env.TEST_DPR || 1),
  output = `work/chapter-road-browser/dpr-${density}`;
mkdirSync(output, { recursive: true });
function fixture(index, mode) {
  const now = Date.now();
  let s = act(
    testState(now, index, index === 15 ? 19 : 12, 1000),
    { type: "start", id: storyStages[index].quest, readDeparture: true, value: false },
    now,
  );
  if (mode === "departure") {
    s = act(s, { type: "stop" }, now);
    s.autoNextQuest = false;
  }
  if (["withdraw", "enter", "escape"].includes(mode)) {
    for (let i = 0; i < 15000 && s.squads[0].run?.road.scene?.kind !== mode; i++)
      s = settle(s, s.squads[0].run.nextAt);
    assert.equal(s.squads[0].run.road.scene.kind, mode);
    s = settle(
      s,
      s.updatedAt +
        (s.squads[0].run.nextAt - s.updatedAt) *
          { withdraw: 0.27, enter: 0.85, escape: 0.29 }[mode],
    );
  } else if (mode === "worksite" || mode === "arrival" || mode === "bottles") {
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
        (mode !== "bottles" || frame.look.work.label === "空き瓶を揺らさず運ぶ") &&
        (mode !== "arrival" || s.squads[0].run.node === s.squads[0].run.nodes - 1)
      )
        break;
      s = settle(s, s.squads[0].run.nextAt);
    }
  } else if (mode === "boss" || mode.startsWith("command"))
    while ((s.squads[0].run.node < 2 || s.squads[0].run.road.scene) && s.updatedAt < now + 180000)
      s = settle(s, s.squads[0].run.nextAt);
  else if (mode === "ambush" || mode === "rear")
    while (s.squads[0].run.road.ambushNode === undefined && s.updatedAt < now + 60000)
      s = settle(s, s.squads[0].run.nextAt);
  if (mode.startsWith("command")) {
    for (let i = 0; i < 1500; i++) {
      const r = s.squads[0].run;
      if (r.events.some((e) => e.kind === "move" && e.enemy && e.at === s.updatedAt)) break;
      s = settle(s, r.nextAt);
    }
    const delay = mode === "command-arrival" ? 650 : 230;
    s = settle(s, s.updatedAt + delay);
    assert.ok(
      chapterRoadFrame({
        squad: s.squads[0],
        startQuest: storyStages[index].quest,
        now: s.updatedAt,
        ready: true,
        paused: false,
      }).battle.effects.some((e) => e.kind === "command"),
    );
  }
  if (mode === "rear") {
    const r = s.squads[0].run,
      road = r.road,
      enemy = road.opponents[r.enemies[0].id];
    enemy.x = enemy.previousX = road.camera - 340;
    road.members.leon.x = road.members.leon.previousX = enemy.x + 55;
    road.members.leon.recoil = -45;
    s = settle(s, s.updatedAt + 100);
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
    ["touch", 0, "ambush"],
    ["work", 11, "worksite"],
    ["trio", 12, "battle"],
    ["signpost", 13, "worksite"],
    ["rear-signpost", 13, "rear"],
    ["trio-work", 16, "worksite"],
    ["bottles-cart", 17, "bottles"],
    ["four-cargo", 24, "worksite"],
    ["night-cargo", 25, "worksite"],
    ["trail-departure", 30, "departure"],
    ["cargo-departure", 0, "departure"],
    ["four-finn", 24, "worksite"],
    ["five-cargo", 34, "worksite"],
    ["puppets", 15, "boss"],
    ["command", 15, "command"],
    ["command-arrival", 15, "command-arrival"],
    ["withdraw", 15, "withdraw"],
    ["enter", 15, "enter"],
    ["escape", 15, "escape"],
  ]) {
    if (process.env.TEST_SCENES && !process.env.TEST_SCENES.split(",").includes(name)) continue;
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: density,
        hasTouch: name === "touch",
        isMobile: name === "touch",
      }),
      page = await context.newPage(),
      save = fixture(index, mode);
    if (name === "four-finn") save.profiles[0].state.squads[0].run.health.leon.hp = 0;
    page.on("pageerror", (e) => errors.push(e.message));
    const roadAssets = new Set();
    page.on("request", (request) => {
      if (
        request.url().includes("/animations/road/") ||
        request.url().includes("/adventure-pixel/") ||
        request.url().includes("/adventure-enemies/")
      )
        roadAssets.add(new URL(request.url()).pathname);
    });
    if (name === "cargo")
      await page.route("**/adventure-pixel/aria.webp", (route) => route.abort());
    await page.clock.install({ time: new Date(save.profiles[0].state.updatedAt) });
    if (
      ["worksite", "arrival", "withdraw", "enter", "escape", "rear", "bottles"].includes(mode) ||
      mode.startsWith("command")
    )
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
      await page.unroute("**/adventure-pixel/aria.webp");
      await page.getByRole("button", { name: "もう一度読み込む" }).click();
    }
    await page.locator('.phaser-canvas[data-status="ready"]').waitFor({ timeout: 60000 });
    if (mode === "departure") {
      for (let departure = 0; departure < 2; departure++) {
        if (departure) {
          await page.getByRole("button", { name: "帰還", exact: true }).click();
          await page.getByRole("button", { name: "帰還する", exact: true }).click();
          await page.clock.runFor(100);
          assert.equal(await page.locator(".road-work-caption").isVisible(), false);
        }
        const oldChat = await page.locator(".journey-banter").elementHandle();
        const oldCanvas = await page.locator("canvas").elementHandle();
        await page.getByRole("button", { name: "出発", exact: true }).click();
        let position = null;
        for (let step = 0; step < 120; step++) {
          await page.clock.runFor(250);
          // Read visibility and coordinates in one frame, before the next animation tick.
          position = await page.locator(".road-work-caption").evaluate((el) => {
            if (!el.getClientRects().length) return null;
            const map = el.closest(".adventure-map").getBoundingClientRect();
            return { top: el.getBoundingClientRect().top, mapTop: map.top, mapHeight: map.height };
          });
          if (position) break;
        }
        assert.equal(
          await oldChat.evaluate((el) => el.isConnected),
          false,
          "departure replaces chat",
        );
        assert.equal(
          await oldCanvas.evaluate((el) => el.isConnected),
          true,
          "departure keeps canvas",
        );
        await page.screenshot({ path: `${output}/${name}-departure-${departure}.png` });
        assert.ok(
          position && position.top > position.mapTop + position.mapHeight * 0.4,
          `${name}: caption stays near the work, not below the heading: ${JSON.stringify(position)}`,
        );
      }
      // Keep the reached work point stable while checking several viewport sizes.
      await page.clock.setFixedTime(new Date(await page.evaluate(() => Date.now())));
    }
    await page.clock.runFor(mode === "worksite" ? 50 : 900);
    assert.equal(await page.locator("canvas").count(), 1);
    assert.ok(await page.evaluate(() => window.roadMipFilters > 0));
    assert.equal(await page.locator(".journey-banter").count(), 1);
    if (mode.startsWith("command") || mode === "escape" || mode === "enter") {
      const face = page.locator(".journey-banter .face-portrait").first();
      const style = await face.evaluate((el) => el.getAttribute("style"));
      assert.ok(style.includes("masked-pumpety-expressions.webp"));
      assert.ok((await page.locator(".journey-banter").innerText()).includes("カボチャ頭の少女"));
    }
    assert.ok(await page.locator(".map-journey progress").count());
    for (const [width, height] of ["forest", "touch", "night-cargo"].includes(name)
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
      const canvasSize = await page.locator(".phaser-canvas canvas").evaluate((canvas) => {
        const host = canvas.parentElement;
        const density = Math.max(1, Math.min(3, window.devicePixelRatio));
        return {
          actual: [canvas.width, canvas.height],
          expected: [
            Math.round(host.clientWidth * density),
            Math.round(host.clientHeight * density),
          ],
        };
      });
      assert.deepEqual(canvasSize.actual, canvasSize.expected);
      if (name === "touch") {
        const hits = () =>
          page.evaluate(
            () =>
              JSON.parse(localStorage.getItem("starlit-guild-v4")).profiles[0].state.squads[0].run
                .hits,
          );
        const beforeTap = await hits();
        const canvas = page.locator(".phaser-canvas canvas");
        const bounds = await canvas.boundingBox();
        const x = bounds.width * 0.6;
        const y = bounds.height * 0.4;
        await canvas.tap({ position: { x, y } });
        await page.clock.runFor(250);
        assert.equal(await hits(), beforeTap + 1);
      }
      const layout = await page
        .locator(".phone-game")
        .evaluate((el) => ({ width: el.clientWidth, scrollWidth: el.scrollWidth }));
      assert.ok(layout.scrollWidth <= layout.width + 1);
      const chat = page.getByRole("region", { name: "道中の掛け合い" });
      const chatStyle = () =>
        chat.evaluate((el) => {
          const style = getComputedStyle(el);
          return { background: style.backgroundColor, image: style.backgroundImage };
        });
      const background = await chatStyle();
      assert.deepEqual(background, { background: "rgba(30, 33, 37, 0.38)", image: "none" });
      await chat.hover();
      assert.deepEqual(await chatStyle(), background);
      await chat.focus();
      assert.deepEqual(await chatStyle(), background);
      await page.mouse.down();
      assert.deepEqual(await chatStyle(), background);
      await page.mouse.up();
      if (name === "touch") {
        await chat.tap();
        assert.deepEqual(await chatStyle(), background);
      }
      const geometry = await page.evaluate(() => {
        const chat = document.querySelector(".journey-banter");
        const map = document.querySelector(".adventure-map").getBoundingClientRect();
        const progress = document.querySelector(".map-journey").getBoundingClientRect();
        const activity = document
          .querySelector(".map-heading > span:last-of-type")
          .getBoundingClientRect();
        return {
          rows: Number(getComputedStyle(chat).getPropertyValue("--chat-rows")),
          chatHeight: chat.getBoundingClientRect().height,
          progressTop: progress.top - map.top,
          progressBottom: progress.bottom,
          activityBottom: activity.bottom,
          chatTop: chat.getBoundingClientRect().top,
        };
      });
      const rows = width < 760 || (name === "touch" && height <= 500) ? 3 : 5;
      assert.equal(geometry.rows, rows);
      assert.ok(Math.abs(geometry.chatHeight - (rows * 42 + 7)) <= 1);
      assert.ok(geometry.progressTop < 180);
      assert.ok(geometry.progressBottom > geometry.activityBottom);
      assert.ok(geometry.progressBottom < geometry.chatTop);
      if (name === "night-cargo") {
        assert.ok(
          (await page.locator(".map-heading").innerText()).includes("石を載せた荷車を橋へ運ぶ"),
        );
        assert.ok(geometry.activityBottom < geometry.chatTop);
      }
      if (["night-cargo", "moss", "five-cargo"].includes(name) || mode === "departure") {
        const caption = page.locator(".road-work-caption");
        assert.ok(await caption.isVisible(), `${name}: work caption visible`);
        const bounds = await caption.boundingBox();
        const map = await page.locator(".adventure-map").boundingBox();
        assert.ok(bounds.y > map.y + map.height * 0.6, `${name}: below the work point`);
        assert.ok(bounds.x >= map.x && bounds.x + bounds.width <= map.x + map.width);
        assert.equal(await caption.evaluate((el) => getComputedStyle(el).pointerEvents), "none");
        assert.ok(
          (await page.locator(".map-heading").innerText()).includes(await caption.innerText()),
        );
      }
      await page.screenshot({ path: `${output}/${name}-${width}.png` });
    }
    if (name === "night-cargo") {
      await page.setViewportSize({ width: 390, height: 844 });
      await new Promise((resolve) => setTimeout(resolve, 75));
      await page.clock.runFor(500);
      const caption = page.locator(".road-work-caption");
      const bounds = await caption.boundingBox();
      const map = await page.locator(".adventure-map").boundingBox();
      // UI overlays may grow, but the caption must stay attached to the work image.
      await page.locator(".journey-banter").evaluate((el) => {
        el.style.setProperty("height", "300px", "important");
      });
      await page.locator(".map-heading").evaluate((el) => {
        el.style.paddingBottom = "200px";
      });
      await new Promise((resolve) => setTimeout(resolve, 75));
      await page.clock.runFor(500);
      assert.equal((await page.locator(".adventure-map").boundingBox()).height, map.height);
      assert.ok(
        Math.abs((await caption.boundingBox()).y - bounds.y) < 1,
        "caption ignores chat and heading sizes",
      );
      await page.locator(".journey-banter").evaluate((el) => el.style.removeProperty("height"));
      await page
        .locator(".map-heading")
        .evaluate((el) => el.style.removeProperty("padding-bottom"));
      await new Promise((resolve) => setTimeout(resolve, 75));
      await page.clock.runFor(500);
      const hits = () =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("starlit-guild-v4")).profiles[0].state.squads[0].run
              .hits,
        );
      const beforeTap = await hits();
      await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      await page.clock.runFor(250);
      assert.equal(await hits(), beforeTap + 1, "caption passes taps to map assistance");
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.clock.runFor(300);
    if (mode.startsWith("command"))
      await page.screenshot({ path: `${output}/${name}-reduced.png` });
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
    for (const id of ["aria", "leon", "mira", "finn"])
      assert.ok(roadAssets.has(`/adventure-pixel/${id}.webp`), `${id}: new adventure art loaded`);
    if (save.profiles[0].state.squads[0].members.includes("lico"))
      assert.ok(roadAssets.has("/adventure-pixel/lico.webp"), "Lico: joining art loaded");
    assert.ok([...roadAssets].every((asset) => asset.endsWith(".webp")));
    for (const id of ["slime", "wolf", "dragon", "plant", "pumpety", "puppet", "golem"])
      assert.ok(
        roadAssets.has(`/adventure-enemies/${id}.webp`),
        `${id}: restyled enemy art loaded`,
      );
    if (name === "night-cargo") {
      await page.setViewportSize({ width: 390, height: 844 });
      await new Promise((resolve) => setTimeout(resolve, 75));
      await page.clock.runFor(500);
      const caption = page.locator(".road-work-caption");
      assert.ok(await caption.isVisible(), "caption remains in reduced motion after reload");
      const bounds = await caption.boundingBox();
      const map = await page.locator(".adventure-map").boundingBox();
      assert.ok(bounds.x >= map.x && bounds.x + bounds.width <= map.x + map.width);
      await page.getByRole("tab", { name: "キャラクター", exact: true }).click();
      await page.clock.runFor(100);
      assert.equal(await caption.count(), 0, "caption is removed with its renderer");
      await page.getByRole("tab", { name: "冒険", exact: true }).click();
      await page.locator('.phaser-canvas[data-status="ready"]').waitFor();
      await page.clock.runFor(100);
      assert.equal(await caption.count(), 1, "one caption after remount");
    }
    results.push({ name, quest: storyStages[index].quest, reloaded: true });
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
