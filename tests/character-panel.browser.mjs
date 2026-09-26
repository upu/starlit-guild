// npm run build, then node tests/character-panel.browser.mjs (Playwright + Chromium).
// Component fixture on an isolated port/context; never touches the player's save.
import { build } from "esbuild";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = fileURLToPath(new URL("../", import.meta.url)),
  dir = path.join(root, "work/character-browser");
async function swipe(page, selector, dx, dy = 0) {
  const box = await page.locator(selector).boundingBox();
  assert.ok(box, `${selector} is visible`);
  const x = box.x + box.width / 2;
  const y = box.y + Math.min(box.height / 2, 70);
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let step = 1; step <= 4; step++) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + (dx * step) / 4, y: y + (dy * step) / 4 }],
    });
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}
async function assertCharacter(page, name) {
  await page.waitForFunction(
    (expected) => document.querySelector(".character-heading h2")?.textContent === expected,
    name,
  );
  assert.equal(await page.locator('.character-picker button[aria-pressed="true"]').count(), 1);
}
async function checkAdventureSkills(page, url) {
  await page.goto(url + "/?away");
  await assertCharacter(page, "アリア");
  assert.equal(await page.getByText(/付け替えは帰還後/).count(), 0);
  for (const [slot, name] of [
    ["アクティブ", "丁寧な採取"],
    ["パッシブ", "野草の目利き"],
  ]) {
    const equipped = page.getByRole("button", { name: new RegExp(slot + "スキル.*習得・セット") });
    await equipped.click();
    const candidate = page.getByRole("button", { name, exact: true });
    await candidate.click();
    await page.getByRole("button", { name: name + "を習得する", exact: true }).click();
    await candidate.click();
    assert.match(await equipped.getAttribute("aria-label"), new RegExp(name));
    assert.equal(await page.getByRole("status").innerText(), "スキルをセットしました。");
    const empty = page.getByRole("button", { name: "スキルを外す候補", exact: true });
    await empty.click();
    await empty.click();
    assert.match(await equipped.getAttribute("aria-label"), /セットなし/);
    assert.equal(await page.getByRole("status").innerText(), "スキルを外しました。");
    await candidate.click();
    await candidate.click();
    assert.match(await equipped.getAttribute("aria-label"), new RegExp(name));
    await page.getByRole("button", { name: "閉じる", exact: true }).click();
  }
}
mkdirSync(dir, { recursive: true });
const bundle = await build({
  stdin: {
    contents: `
 import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
 import {CharacterPanel} from './app/equipment-panels';
 import {testState,act} from './lib/game';
 import {initialInventory} from './lib/equipment';
 import {MOON_HERB_QUEST} from './lib/chapter-two';
 const params=new URLSearchParams(location.search);
 let initial=testState(1000,params.has("locked") ? 2 : params.has("quartet") ? 19 : 14,params.has("limited") ? 1 : 20,params.has("limited") ? 100 : 1000);
 initial.inventory=initialInventory();
 Object.assign(initial.inventory.items,{'ash-bow':1,'steel-sword':1,'leather-vest':1,'gathering-coat':1});
 initial.xp.leon+=500;
 if(params.has("max")) initial.xp.aria=72030;
 if(params.has("away")) initial=act(initial,{type:"start",id:MOON_HERB_QUEST,readDeparture:true,value:true},initial.updatedAt);
 function App(){
  const [state,setState]=useState(initial);
  const dispatch=a=>{setState(s=>act(s,a,s.updatedAt));return true;};
  return <main className="phone-game"><div className="phone-tabs"><header className="phone-header">STARLIT GUILD</header><div className="phone-screen"><div data-slot="tabs-content" className="phone-characters"><CharacterPanel state={state} ready onAction={dispatch}/></div></div><nav className="phone-navigation">キャラクター</nav></div></main>;
 }
 createRoot(document.getElementById('root')).render(<App/>);
 `,
    resolveDir: root,
    loader: "tsx",
  },
  bundle: true,
  write: false,
  platform: "browser",
  format: "esm",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [
    {
      name: "image-shim",
      setup(b) {
        b.onResolve({ filter: /^next\/image$/ }, () => ({ path: "image", namespace: "shim" }));
        b.onLoad({ filter: /.*/, namespace: "shim" }, () => ({
          contents:
            'import React from "react"; export default function Image({unoptimized,...props}){return React.createElement("img",props)}',
          loader: "js",
          resolveDir: root,
        }));
      },
    },
  ],
});
const css = readdirSync(path.join(root, "dist/client"), { recursive: true })
  .filter((f) => f.endsWith(".css"))
  .map((f) => readFileSync(path.join(root, "dist/client", f), "utf8"))
  .join("\n");
const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/test.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end(bundle.outputFiles[0].contents);
    return;
  }
  if (url.pathname === "/style.css") {
    res.setHeader("Content-Type", "text/css");
    res.end(
      css +
        "\n.fixture{position:relative;inset:auto;transform:none;width:100%;max-height:100dvh;margin:0 auto;border-radius:0}",
    );
    return;
  }
  if (url.pathname === "/") {
    res.setHeader("Content-Type", "text/html");
    res.end(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script type="module" src="/test.js"></script>',
    );
    return;
  }
  const local = path.resolve(root, "public", `.${decodeURIComponent(url.pathname)}`);
  if (!local.startsWith(path.join(root, "public") + path.sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  try {
    res.setHeader("Content-Type", local.endsWith(".webp") ? "image/webp" : "image/png");
    res.end(readFileSync(local));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
try {
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [844, 390],
    [1364, 844],
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: true });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await checkAdventureSkills(page, "http://127.0.0.1:" + server.address().port);
    await page.screenshot({ path: path.join(dir, "adventure-skills-" + width + ".png") });
    await page.goto("http://127.0.0.1:" + server.address().port);
    const picker = page.locator(".character-picker");
    await picker.waitFor();
    const initialBox = await picker.boundingBox();
    const rows = await page.locator(".character-slot").evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, bottom: r.bottom };
      }),
    );
    assert.equal(rows.length, 4);
    assert.ok(
      rows.every((r, i) => i === 0 || (Math.abs(r.x - rows[0].x) < 1 && r.y >= rows[i - 1].bottom)),
    );
    const faces = await picker
      .locator(".face-portrait")
      .evaluateAll((els) => els.map((el) => [el.offsetWidth, el.offsetHeight]));
    const faceSize = width >= 1024 ? 56 : 40;
    assert.ok(faces.every(([w, h]) => w === faceSize && h === faceSize));
    assert.equal(
      (await page.locator(".character-heading > .face-portrait").boundingBox()).width,
      width >= 1024 ? 80 : 56,
    );
    assert.equal(await page.getByRole("heading", { name: /^(装備|スキル)$/ }).count(), 0);
    await page.getByRole("button", { name: "レオン", exact: true }).hover();
    await page.waitForTimeout(200);
    assert.equal(
      await page
        .getByRole("button", { name: "レオン", exact: true })
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      "rgb(48, 74, 58)",
    );
    await page.locator(".character-slot").first().hover();
    await page.waitForTimeout(200);
    assert.equal(
      await page
        .locator(".character-slot")
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      "rgb(48, 74, 58)",
    );
    const heading = page.locator(".character-heading");
    assert.match(await heading.innerText(), /Lv\. 20\s+EXP 10,830 \/ 12,000\s*次のLvまで 1,170/);
    assert.equal(await heading.locator("progress").getAttribute("aria-label"), "次のレベルまで 0%");
    assert.ok((await heading.boundingBox()).height <= 130, "heading too tall");
    await page.screenshot({ path: path.join(dir, "overview-" + width + ".png") });
    await page.getByRole("button", { name: /武器.*付け替える/ }).click();
    const bottom = page.locator(".character-bottom");
    const equipmentBox = await bottom.boundingBox();
    await page.locator(".character-scroll").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    assert.equal((await bottom.boundingBox()).y, equipmentBox.y);
    assert.equal(await page.locator(".character-scroll .character-icon-choices").count(), 0);

    await page.getByRole("button", { name: "トネリコの弓", exact: true }).click();
    assert.match(
      await page.locator(".character-slot").first().getAttribute("aria-label"),
      /使い慣れた弓/,
    );
    assert.equal(await page.getByRole("button", { name: "トネリコの弓を装備する" }).count(), 0);
    const candidate = page.getByRole("button", { name: "トネリコの弓", exact: true });
    await candidate.hover();
    await page.waitForTimeout(200);
    assert.equal(
      await candidate.evaluate((el) => getComputedStyle(el).backgroundColor),
      "rgb(59, 80, 55)",
    );
    await page.getByRole("button", { name: "トネリコの弓", exact: true }).click();
    assert.match(
      await page.locator(".character-slot").first().getAttribute("aria-label"),
      /トネリコの弓/,
    );
    await page.getByRole("button", { name: "装備を外す", exact: true }).click();
    await page.getByRole("button", { name: "装備を外す", exact: true }).click();
    assert.equal(
      await page.locator(".character-slot").first().locator(".empty-slot-icon").count(),
      1,
    );
    assert.match(
      await page.locator(".character-slot").first().getAttribute("aria-label"),
      /装備なし/,
    );
    await page.getByRole("button", { name: "トネリコの弓", exact: true }).click();
    await page.getByRole("button", { name: "トネリコの弓", exact: true }).click();
    await page.getByRole("button", { name: /武器.*付け替える/ }).click();
    await page.getByRole("button", { name: /パッシブスキル.*習得・セット/ }).click();
    assert.equal((await bottom.boundingBox()).y, equipmentBox.y);
    assert.equal(await page.locator(".character-bottom").count(), 1);
    assert.equal(
      await page
        .locator(".character-bottom")
        .getByText(/所持金/)
        .count(),
      0,
    );

    assert.equal(
      await page.locator(".character-slot").last().locator(".empty-slot-icon").count(),
      1,
    );
    await page.getByRole("button", { name: "野草の目利き", exact: true }).click();
    const unlearned = page.getByRole("button", { name: "野草の目利き", exact: true });
    assert.equal(await unlearned.getAttribute("data-muted"), "true");
    assert.equal(await unlearned.locator(".character-learnable-dot").count(), 1);
    assert.equal(await unlearned.innerText(), "");
    await unlearned.click();
    assert.equal(await unlearned.getAttribute("data-muted"), "true");
    assert.match(await page.locator(".character-choice-detail").last().innerText(), /未習得/);
    await page.screenshot({ path: path.join(dir, "candidates-" + width + ".png") });
    assert.match(
      await page.locator(".character-choice-detail").last().innerText(),
      /所持金 1,000 G/,
    );
    await page.getByRole("button", { name: "野草の目利きを習得する" }).click();
    assert.equal(await unlearned.locator(".character-learnable-dot").count(), 0);
    assert.equal(
      await page
        .locator(".character-bottom")
        .getByText(/所持金/)
        .count(),
      0,
    );
    await page.getByRole("button", { name: "野草の目利き", exact: true }).click();
    assert.match(
      await page.locator(".character-slot").last().getAttribute("aria-label"),
      /野草の目利き/,
    );
    await page.locator(".character-scroll").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    assert.equal((await picker.boundingBox()).y, initialBox.y);
    await page.getByRole("button", { name: "レオン", exact: true }).click();
    assert.equal(await page.locator(".character-heading h2").innerText(), "レオン");
    assert.match(await heading.innerText(), /EXP 11,330 \/ 12,000\s*次のLvまで 670/);
    await heading.screenshot({ path: path.join(dir, "exp-" + width + ".png") });
    assert.equal(
      await page
        .getByRole("button", { name: /パッシブスキル.*習得・セット/ })
        .getAttribute("aria-expanded"),
      "true",
    );
    assert.equal(await page.locator('[role="status"]').textContent(), "");
    await page.getByRole("button", { name: "堅実な備え", exact: true }).click();
    await page.getByRole("button", { name: "堅実な備えを習得する" }).click();
    await page.getByRole("button", { name: "堅実な備え", exact: true }).click();
    await page.getByRole("button", { name: "スキルを外す候補", exact: true }).click();
    await page.getByRole("button", { name: "スキルを外す候補", exact: true }).click();
    assert.equal(
      await page.locator(".character-slot").last().locator(".empty-slot-icon").count(),
      1,
    );
    assert.match(
      await page.locator(".character-slot").last().getAttribute("aria-label"),
      /セットなし/,
    );
    await page.screenshot({ path: path.join(dir, "skills-" + width + ".png") });
    const overflow = await page
      .locator(".character-scroll")
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    assert.ok(overflow <= 1, "horizontal overflow " + overflow);
    assert.deepEqual(errors, []);
    console.log(
      "PASS",
      width,
      height,
      "fixed portraits, equipment, learning, switching, unequipping",
    );
    await page.goto("http://127.0.0.1:" + server.address().port + "/?max");
    await heading.waitFor();
    assert.match(await heading.innerText(), /Lv\. 50\s*MAX\s+EXP 72,030/);
    assert.equal(await heading.getByText(/次のLv/).count(), 0);
    assert.equal(await heading.locator("progress").count(), 0);
    await page.screenshot({ path: path.join(dir, "max-" + width + ".png") });
    await page.goto("http://127.0.0.1:" + server.address().port + "/?locked");
    const fixed = page.locator(".character-slot-fixed");
    await fixed.waitFor();
    assert.match(await fixed.innerText(), /アクティブ/);
    assert.match(await fixed.innerText(), /風の二連矢/);
    assert.equal(
      await page.getByRole("button", { name: /アクティブスキル|パッシブスキル/ }).count(),
      0,
    );
    assert.equal(await page.getByText("パッシブ", { exact: true }).count(), 0);
    await fixed.click();
    assert.equal(await page.locator(".character-icon-choices").count(), 0);
    await page.getByRole("button", { name: "レオン", exact: true }).click();
    assert.match(await fixed.innerText(), /暁の踏み込み/);
    await page.screenshot({ path: path.join(dir, "locked-" + width + ".png") });
    await page.goto("http://127.0.0.1:" + server.address().port + "/?limited");
    await page.getByRole("button", { name: /パッシブスキル.*習得・セット/ }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "野草の目利き", exact: true })
        .locator(".character-learnable-dot")
        .count(),
      1,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "狩人の狙い", exact: true })
        .locator(".character-learnable-dot")
        .count(),
      0,
    );
    await page.getByRole("button", { name: "野草の目利き", exact: true }).click();
    await page.getByRole("button", { name: "野草の目利きを習得する" }).click();
    await page.getByRole("button", { name: /アクティブスキル.*習得・セット/ }).click();
    assert.equal(await page.locator(".character-learnable-dot").count(), 0);
    await page.goto("http://127.0.0.1:" + server.address().port + "/?quartet");
    for (const [hero, passive] of [
      ["ミラ", "丁寧な手当て"],
      ["フィン", "隙を見抜く目"],
    ]) {
      await page.getByRole("button", { name: hero, exact: true }).click();
      assert.equal(await page.getByText("アクティブ", { exact: true }).count(), 1);
      assert.equal(
        await page.getByRole("button", { name: /アクティブスキル.*習得・セット/ }).count(),
        0,
      );
      await page.getByRole("button", { name: /パッシブスキル.*習得・セット/ }).click();
      await page.getByRole("button", { name: passive, exact: true }).click();
      await page.getByRole("button", { name: passive + "を習得する", exact: true }).click();
      await page.getByRole("button", { name: passive, exact: true }).click();
      await page.getByRole("button", { name: "閉じる", exact: true }).click();
      assert.equal(
        await page
          .getByRole("button", {
            name: "パッシブスキル・" + passive + "・習得・セット",
            exact: true,
          })
          .count(),
        1,
      );
      await page.screenshot({ path: path.join(dir, hero + "-" + width + ".png") });
    }
    await page.goto("http://127.0.0.1:" + server.address().port + "/?quartet");
    await assertCharacter(page, "アリア");
    await swipe(page, ".character-scroll", -75);
    await assertCharacter(page, "レオン");
    await swipe(page, ".character-scroll", -75);
    await assertCharacter(page, "ミラ");
    await swipe(page, ".character-scroll", 75);
    await assertCharacter(page, "レオン");
    await swipe(page, ".character-scroll", 45);
    await assertCharacter(page, "レオン");
    const scroll = page.locator(".character-scroll");
    const scrollTop = await scroll.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      return el.scrollTop;
    });
    await swipe(page, ".character-scroll", -80, 110);
    await assertCharacter(page, "レオン");
    if (scrollTop > 0) {
      await page.waitForFunction(
        (previous) => document.querySelector(".character-scroll").scrollTop < previous,
        scrollTop,
      );
    }
    await page.getByRole("button", { name: "フィン", exact: true }).click();
    await assertCharacter(page, "フィン");
    await swipe(page, ".character-scroll", -75);
    await assertCharacter(page, "フィン");
    await page.getByRole("button", { name: "アリア", exact: true }).click();
    await swipe(page, ".character-scroll", 75);
    await assertCharacter(page, "アリア");
    await picker.evaluate((el) => {
      el.style.width = "120px";
    });
    await swipe(page, ".character-picker", -75);
    await assertCharacter(page, "アリア");
    assert.ok((await picker.evaluate((el) => el.scrollLeft)) > 0, "picker remains scrollable");
    await page.getByRole("button", { name: /武器.*付け替える/ }).click();
    await swipe(page, ".character-scroll", -75);
    await assertCharacter(page, "アリア");
    await swipe(page, ".character-bottom", -75);
    await assertCharacter(page, "アリア");
    await page.getByRole("button", { name: "閉じる", exact: true }).click();
    await swipe(page, ".character-scroll", -75);
    await assertCharacter(page, "レオン");
    assert.deepEqual(errors, []);
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
