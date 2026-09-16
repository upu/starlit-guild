// npm run build, then node tests/quest-picker.browser.mjs (Playwright + Chromium).
// Component fixture on an isolated port/context; never touches the player's save.
import { build } from "esbuild";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = fileURLToPath(new URL("../", import.meta.url)),
  dir = path.join(root, "work/quest-picker-browser");
mkdirSync(dir, { recursive: true });
const bundle = await build({
  stdin: {
    contents: `
 import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
 import {QuestPicker} from './app/quest-picker';import {SavePanel} from './app/save-panel';
 import {initialPrologueState,act} from './lib/game';import {storyStages} from './lib/prologue';
 const initial=initialPrologueState(1000);
 for(const {quest} of storyStages.slice(0,14)){initial.done[quest]=1;initial.story.completed.push(quest);initial.story.read.push(quest+'-return');}
 function App(){
  const [state,setState]=useState(initial),[selected,setSelected]=useState(storyStages[14].quest),[confirmed,setConfirmed]=useState('');
  const dispatch=a=>{setState(s=>act(s,a,s.updatedAt));return true;};
  const profile={id:'fixture',name:'表示確認',test:false,state};
  const game={s:state,ready:true,otherTab:false,profile,bundle:{sound:false,profiles:[profile],active:profile.id},dispatch,copies:[],toggleSound:()=>{}};
  const music={preferences:{enabled:false,volume:50},scene:'camp',setEnabled:()=>{},setVolume:()=>{}};
  return <main className="phone-game"><div className="phone-dialog quest-dialog fixture" data-slot="dialog-content"><h2>クエスト</h2><SavePanel game={game} music={music}/>{confirmed?<button onClick={()=>setConfirmed('')}>選び直す</button>:<QuestPicker state={state} squad={state.squads[0]} selected={selected} onSelect={setSelected} onConfirm={setConfirmed} ready onAutoNextChange={value=>dispatch({type:'autoNextQuest',value})}/>}<output>{confirmed}</output></div></main>;
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
async function checkThumb(switchControl) {
  const bounds = await switchControl.evaluate(async (element) => {
    await Promise.all(
      element.getAnimations({ subtree: true }).map((animation) => animation.finished),
    );
    const root = element.getBoundingClientRect(),
      track = getComputedStyle(element, "::before");
    const thumb = element.querySelector('[data-slot="switch-thumb"]').getBoundingClientRect();
    const x = root.left + parseFloat(track.left),
      y = root.top + parseFloat(track.top);
    return {
      track: { x, y, right: x + parseFloat(track.width), bottom: y + parseFloat(track.height) },
      thumb: { x: thumb.x, y: thumb.y, right: thumb.right, bottom: thumb.bottom },
    };
  });
  assert.ok(
    bounds.thumb.x >= bounds.track.x &&
      bounds.thumb.right <= bounds.track.right &&
      bounds.thumb.y >= bounds.track.y &&
      bounds.thumb.bottom <= bounds.track.bottom,
    JSON.stringify(bounds),
  );
}
try {
  const results = [];
  for (const width of [360, 390, 768, 1364]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: true });
    const page = await context.newPage(),
      errors = [],
      requests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (req) => requests.push(new URL(req.url()).pathname));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.locator(".quest-options .quest-option").first().waitFor();
    assert.equal(await page.locator(".quest-option").count(), 6);
    assert.equal(
      await page.getByRole("button", { name: "第二章", exact: true }).getAttribute("aria-pressed"),
      "true",
    );
    const preference = page.getByRole("switch", { name: "クリア後、次のステージを行先にする" });
    assert.equal(await preference.getAttribute("aria-checked"), "false");
    await checkThumb(preference);
    await preference.click();
    await checkThumb(preference);
    await page.screenshot({ path: path.join(dir, `chapter-two-${width}.png`) });
    await page.getByRole("button", { name: "第一章", exact: true }).click();
    assert.equal(await page.locator(".quest-option").count(), 9);
    await page.screenshot({ path: path.join(dir, `chapter-one-${width}.png`) });
    const detail = page.locator(".quest-summary");
    await detail.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(dir, `detail-${width}.png`) });
    await detail.hover();
    assert.equal(
      await detail.evaluate((element) => getComputedStyle(element).backgroundColor),
      "rgb(44, 66, 50)",
    );
    const detailBox = await detail.boundingBox();
    await page.mouse.move(detailBox.x + 30, detailBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(detailBox.x + 30, detailBox.y + 150, { steps: 6 });
    await page.mouse.up();
    assert.equal(await page.locator("output").innerText(), "");
    await page.evaluate(() => window.getSelection()?.removeAllRanges());
    await detail.locator(".quest-summary-title").tap();
    assert.equal(await page.locator("output").innerText(), "village-trade");
    await page.getByRole("button", { name: "選び直す" }).click();
    await page.getByRole("button", { name: "セーブ・設定" }).click();
    await page.getByRole("tab", { name: "設定", exact: true }).click();
    const savedPreference = page
      .getByRole("dialog")
      .getByRole("switch", { name: "クリア後、次のステージを行先にする" });
    assert.equal(await savedPreference.getAttribute("aria-checked"), "true");
    await checkThumb(savedPreference);
    await savedPreference.click();
    await checkThumb(savedPreference);
    await page.keyboard.press("Escape");
    assert.equal(await preference.getAttribute("aria-checked"), "false");
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    const sceneryRequests = [...new Set(requests.filter((p) => p.startsWith("/scenery/")))];
    assert.ok(sceneryRequests.length > 0);
    assert.ok(
      sceneryRequests.every((p) => /-(thumbnail|detail)\.webp$/.test(p)),
      sceneryRequests.join(),
    );
    assert.deepEqual(errors, []);
    results.push({ width, sceneryRequests, errors });
    await context.close();
  }
  writeFileSync(path.join(dir, "results.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
