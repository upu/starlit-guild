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
mkdirSync(dir, { recursive: true });
const bundle = await build({
  stdin: {
    contents: `
 import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
 import {CharacterPanel} from './app/equipment-panels';
 import {testState,act} from './lib/game';
 import {initialInventory} from './lib/equipment';
 const initial=testState(1000,new URLSearchParams(location.search).has("locked") ? 2 : 14,20,1000);
 initial.inventory=initialInventory();
 Object.assign(initial.inventory.items,{'ash-bow':1,'steel-sword':1,'leather-vest':1,'gathering-coat':1});
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
    assert.ok(faces.every(([w, h]) => w === 40 && h === 40));
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
    await page.screenshot({ path: path.join(dir, "overview-" + width + ".png") });
    await page.getByRole("button", { name: /武器.*付け替える/ }).click();
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
    await page.getByRole("button", { name: /パッシブ技.*習得・セット/ }).click();
    assert.equal(
      await page.locator(".character-slot").last().locator(".empty-slot-icon").count(),
      1,
    );
    await page.getByRole("button", { name: "野草の目利き", exact: true }).click();
    const unlearned = page.getByRole("button", { name: "野草の目利き", exact: true });
    assert.equal(await unlearned.getAttribute("data-muted"), "true");
    assert.equal(await unlearned.innerText(), "");
    await unlearned.click();
    assert.equal(await unlearned.getAttribute("data-muted"), "true");
    assert.match(await page.locator(".character-choice-detail").last().innerText(), /未習得/);
    await page.screenshot({ path: path.join(dir, "candidates-" + width + ".png") });
    await page.getByRole("button", { name: "野草の目利きを習得する" }).click();
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
    assert.equal(
      await page
        .getByRole("button", { name: /パッシブ技.*習得・セット/ })
        .getAttribute("aria-expanded"),
      "true",
    );
    assert.equal(await page.locator('[role="status"]').textContent(), "");
    await page.getByRole("button", { name: "堅実な備え", exact: true }).click();
    await page.getByRole("button", { name: "堅実な備えを習得する" }).click();
    await page.getByRole("button", { name: "堅実な備え", exact: true }).click();
    await page.getByRole("button", { name: "技を外す候補", exact: true }).click();
    await page.getByRole("button", { name: "技を外す候補", exact: true }).click();
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
    await page.goto("http://127.0.0.1:" + server.address().port + "/?locked");
    const fixed = page.locator(".character-slot-fixed");
    await fixed.waitFor();
    assert.match(await fixed.innerText(), /アクティブ技/);
    assert.match(await fixed.innerText(), /風の二連矢/);
    assert.equal(await page.getByRole("button", { name: /アクティブ技|パッシブ技/ }).count(), 0);
    assert.equal(await page.getByText("パッシブ技", { exact: true }).count(), 0);
    await fixed.click();
    assert.equal(await page.locator(".character-icon-choices").count(), 0);
    await page.getByRole("button", { name: "レオン", exact: true }).click();
    assert.match(await fixed.innerText(), /暁の踏み込み/);
    await page.screenshot({ path: path.join(dir, "locked-" + width + ".png") });
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
